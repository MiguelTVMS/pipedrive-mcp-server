# Pipedrive MCP Server - AI Coding Agent Instructions

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that exposes Pipedrive CRM data to LLM applications. The architecture consists of:

- **Modular structure**:
  - `src/index.ts` - server configuration, API setup, and transport logic
  - `src/types/` - centralized type definitions (API, MCP, errors)
  - `src/tools/` - individual tool files and registration
  - `src/prompts/` - individual prompt files and registration
  - `src/logger.ts` - transport-aware logging utility
- **Dual transport modes**: stdio (local CLI) and SSE (HTTP server for remote access)
- **Rate-limited Pipedrive API wrapper** using Bottleneck proxy pattern
- **Optional JWT authentication** for SSE transport

## Critical Development Workflows

### Running & Debugging

```bash
# Development (TypeScript source with tsx loader)
npm run dev

# Production build
npm run build && npm start

# Debug configurations available in .vscode/launch.json:
# - "Debug MCP Server (HTTP/SSE)" - Debug with SSE transport on port 3000
# - "Debug MCP Server (stdio)" - Debug with stdio transport
# - "Debug Built Server (HTTP/SSE)" - Debug compiled JS (runs build first)
```

### Environment Setup

Required `.env` variables:

```bash
PIPEDRIVE_API_TOKEN=your_token
PIPEDRIVE_DOMAIN=company.pipedrive.com  # No https://, just domain

# Optional - SSE transport (default: stdio)
MCP_TRANSPORT=sse
MCP_PORT=3000

# Optional - JWT auth for SSE
MCP_JWT_SECRET=secret
MCP_JWT_TOKEN=token_value
MCP_JWT_ALGORITHM=HS256

# Optional - ngrok tunnel (requires MCP_TRANSPORT=sse)
MCP_NGROK_ENABLED=true
MCP_NGROK_AUTHTOKEN=your_ngrok_token
```

### Docker Deployment

Multi-stage build uses **Node 22 Alpine**. Key points:

- Builder stage: installs all deps, compiles TypeScript
- Production stage: only production deps, runs as non-root `node` user
- Health check at `/health`, SSE endpoint at `/sse`, message POST at `/message`
- GitHub Actions workflow (`.github/workflows/docker-build.yml`) builds multi-arch images (amd64/arm64) on tag push

## Project-Specific Conventions

### Rate Limiting Pattern

All Pipedrive API clients are wrapped with a Bottleneck proxy in `src/index.ts`:

```typescript
const withRateLimit = <T extends object>(client: T): T => {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: unknown[]) =>
          limiter.schedule(() => (value as Function).apply(target, args));
      }
      return value;
    },
  });
};

const dealsApi = withRateLimit(new pipedrive.DealsApi(apiClient));
```

**Why**: Prevents Pipedrive API rate limit violations. Default: 250ms between calls, max 2 concurrent requests.

### Centralized Types Structure

All TypeScript types are organized in `src/types/` for better maintainability:

```
src/types/
├── index.ts       # Central export point for all types
├── api.ts         # ApiClients interface (Pipedrive API clients)
├── mcp.ts         # ToolRegistration, PromptRegistration types
└── errors.ts      # Error handling utilities (getErrorMessage, isErrorWithMessage)
```

**Usage pattern**:

```typescript
// Import from central types location
import {
  ApiClients,
  ToolRegistration,
  getErrorMessage,
} from "../types/index.js";

// Or import specific type files
import { ApiClients } from "../types/api.js";
import { ToolRegistration } from "../types/mcp.js";
```

### Tool Definition Pattern

Each tool is defined in its own file under `src/tools/` following this pattern:

```typescript
// src/tools/getTool.ts
import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetTool: ToolRegistration = (server, { apiClient }) => {
  server.tool(
    "tool-name",
    "Description for LLM",
    {
      /* zod schema for parameters */
    },
    async (params) => {
      try {
        // API call logic
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        logger.error("Error message:", error);
        return {
          content: [{ type: "text", text: `Error: ${getErrorMessage(error)}` }],
          isError: true,
        };
      }
    }
  );
};
```

**Key points**:

- Each tool exports a `ToolRegistration` function
- Tools receive server and API clients as parameters
- All responses are JSON-stringified text, not structured objects
- Error handling uses `getErrorMessage()` from `types/errors.ts`
- Logging uses the transport-aware logger from `logger.ts`

### Logging Pattern

The project uses a transport-aware logger (`src/logger.ts`):

```typescript
import { logger } from "./logger.js";

logger.debug("Debug trace"); // LogLevel.DEBUG (0)
logger.info("Server started"); // LogLevel.INFO (1)
logger.warn("Warning message"); // LogLevel.WARN (2)
logger.error("Error occurred:", error); // LogLevel.ERROR (3)
```

**Key behavior**:

- **stdio transport**: All logs go to `console.error` (stderr) to avoid corrupting MCP protocol on stdout
- **SSE transport**: Uses appropriate console methods (log, warn, error) based on level
- Configurable via `LOG_LEVEL` environment variable
- Automatically initialized in `index.ts` based on `MCP_TRANSPORT`

### Transport Selection Logic

Transport determined at startup in `src/index.ts`:

```typescript
const transportType = process.env.MCP_TRANSPORT || "stdio";

if (transportType === "sse") {
  // HTTP server with /sse (GET) and /message (POST) endpoints
  // JWT verification on all requests if MCP_JWT_SECRET set
  // Maintains Map<sessionId, SSEServerTransport>
} else {
  // stdio - direct stdin/stdout communication
}
```

**Why two transports**: stdio for local development/Claude Desktop, SSE for Dockerized deployments accessible over HTTP.

### TypeScript Configuration

- **Module**: `NodeNext` with `moduleResolution: NodeNext` - modern ES module resolution for Node.js 22+
- **Target**: `ES2022` - uses native top-level await
- **Type**: `"module"` in package.json - ES modules only (outputs `.js` files treated as ES modules)
- **Output**: `dist/` directory (matches package.json main entry point)
- **Strict mode enabled** but uses `@ts-ignore` for incomplete Pipedrive SDK types in tool files

### API Client Initialization

Pipedrive client requires custom domain setup (using SDK v30+ Configuration pattern):

```typescript
const apiConfig = new Configuration({
  apiKey: process.env.PIPEDRIVE_API_TOKEN,
  basePath: `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`,
});

// Initialize API clients
const dealsApi = withRateLimit(new DealsApi(apiConfig));
const personsApi = withRateLimit(new PersonsApi(apiConfig));
// ... etc
```

**Do not** use default Pipedrive client instantiation - it won't respect custom domains (subdomains vary per customer).

## Key Tools Implemented

16 tools total, each in its own file under `src/tools/`:

### Tool Files Structure

```
src/tools/
├── types.ts              # Shared types: ApiClients, ToolRegistration, error utilities
├── index.ts              # registerTools() function that imports and registers all tools
├── getUsers.ts           # Get all users/owners for ID lookup
├── getDeals.ts           # Complex filtering with search/date-based options
├── getDeal.ts            # Get single deal by ID
├── getDealNotes.ts       # Get notes + custom booking field for a deal
├── searchDeals.ts        # Search deals by term
├── getPersons.ts         # Get all persons
├── getPerson.ts          # Get single person by ID
├── searchPersons.ts      # Search persons by term
├── getOrganizations.ts   # Get all organizations
├── getOrganization.ts    # Get single organization by ID
├── searchOrganizations.ts # Search organizations by term
├── getPipelines.ts       # Get all pipelines
├── getPipeline.ts        # Get single pipeline by ID
├── getStages.ts          # Get all stages across all pipelines
├── searchLeads.ts        # Search leads by term
└── searchAll.ts          # Generic cross-entity search
```

### Notable Patterns

- **`get-users`** - Always call BEFORE filtering by owner_id (returns user ID mapping)
- **`get-deals`** - Complex filtering: supports search by title (uses search API) OR date-based filtering (uses list API) + client-side filters for value ranges
- **`search-*`** tools - Use ItemSearchApi for cross-entity searching
- All tools return **full object dumps** including custom fields (Pipedrive extends base schemas per customer)

## Key Prompts Implemented

8 prompts total, each in its own file under `src/prompts/`:

### Prompt Files Structure

```
src/prompts/
├── types.ts              # Shared type: PromptRegistration
├── index.ts              # registerPrompts() function that imports and registers all prompts
├── listAllDeals.ts       # Prompt to list and filter deals
├── listAllPersons.ts     # Prompt to list contacts/persons
├── listAllPipelines.ts   # Prompt to list pipelines and stages
├── analyzeDeals.ts       # Prompt to analyze deal patterns and insights
├── analyzeContacts.ts    # Prompt to analyze contact/person patterns
├── analyzeLeads.ts       # Prompt to analyze lead patterns
├── comparePipelines.ts   # Prompt to compare pipeline performance
└── findHighValueDeals.ts # Prompt to identify high-value opportunities
```

### Prompt Definition Pattern

Each prompt is defined in its own file following this pattern:

```typescript
// src/prompts/listTool.ts
import { PromptRegistration } from "./types.js";

export const registerListTool: PromptRegistration = (server) => {
  server.prompt("prompt-name", "Description for LLM", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Prompt instructions for LLM...",
        },
      },
    ],
  }));
};
```

**Key points**:

- Each prompt exports a `PromptRegistration` function
- Prompts receive only the server instance (no API clients needed)
- All prompts use empty parameters `{}` (static prompts, no dynamic inputs)
- Prompts return messages array with user role content
- Naming convention: camelCase filenames (e.g., `listAllDeals.ts`, `findHighValueDeals.ts`)

### Adding New Prompts

1. Create file in `src/prompts/` with camelCase name
2. Export a `PromptRegistration` function
3. Import and register in `src/prompts/index.ts`

## Common Pitfalls

1. **Don't add import extensions manually** - TypeScript will error. Use `.js` for imports of `.ts` files (NodeNext module resolution requirement for ES modules)
2. **JWT validation runs at startup** - If `MCP_JWT_SECRET` set, `MCP_JWT_TOKEN` must be valid or server exits
3. **Pipedrive SDK types are incomplete** - Expect `@ts-ignore` for newer APIs in tool files
4. **Client-side filtering is intentional** - API filters are limited; tools combine API + manual filtering for flexibility
5. **Bottleneck proxy breaks instanceof checks** - Proxied clients aren't instances of original class
6. **Adding new tools** - Create file in `src/tools/`, export `ToolRegistration` function, import and register in `src/tools/index.ts`
7. **Adding new prompts** - Create file in `src/prompts/`, export `PromptRegistration` function, import and register in `src/prompts/index.ts`
8. **Tool/Prompt naming convention** - Use camelCase for filenames (e.g., `getDeal.ts`, `searchPersons.ts`, `listAllDeals.ts`)

## Testing Approach

No automated tests currently. Manual testing workflow:

1. Start with stdio: `npm run dev` (test with Claude Desktop or MCP inspector)
2. Test SSE mode: Set `MCP_TRANSPORT=sse` and use curl/Postman against `/sse` and `/message`
3. Docker testing: `docker-compose up` and verify health endpoint

## Dependencies Update Strategy

- **Node.js**: Currently on v22 LTS (`.devcontainer/devcontainer.json`, `Dockerfile`, `package.json` engines field)
- **Key deps**: `@modelcontextprotocol/sdk`, `pipedrive`, `zod`, `bottleneck`
- Update with `npm outdated` then manually bump versions in `package.json`
- Major version updates of `pipedrive` SDK may require new `@ts-ignore` annotations
