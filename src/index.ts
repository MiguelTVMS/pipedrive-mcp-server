import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { logger, LogLevel } from "./logger.js";
import { registerPrompts } from "./prompts/index.js";
import { registerTools } from "./tools/index.js";
import { initializePipedriveClients } from "./pipedriveClient.js";
import { startSseServer } from "./sseServer.js";
import { startStdioServer } from "./stdioServer.js";

// Load environment variables
dotenv.config();

// Initialize logger early (will be re-initialized with transport type later)
const transportType = (process.env.MCP_TRANSPORT || "stdio") as "stdio" | "sse";
const logLevel = process.env.LOG_LEVEL
  ? parseInt(process.env.LOG_LEVEL)
  : LogLevel.INFO;
logger.initialize(transportType, logLevel);

// Check for required environment variables
if (!process.env.PIPEDRIVE_API_TOKEN) {
  logger.error("PIPEDRIVE_API_TOKEN environment variable is required");
  process.exit(1);
}

if (!process.env.PIPEDRIVE_DOMAIN) {
  logger.error(
    "PIPEDRIVE_DOMAIN environment variable is required (e.g., 'ukkofi.pipedrive.com')"
  );
  process.exit(1);
}

const jwtSecret = process.env.MCP_JWT_SECRET;
const jwtAlgorithm = (process.env.MCP_JWT_ALGORITHM ||
  "HS256") as jwt.Algorithm;
const jwtVerifyOptions = {
  algorithms: [jwtAlgorithm],
  audience: process.env.MCP_JWT_AUDIENCE,
  issuer: process.env.MCP_JWT_ISSUER,
};

if (jwtSecret) {
  const bootToken = process.env.MCP_JWT_TOKEN;
  if (!bootToken) {
    logger.error(
      "MCP_JWT_TOKEN environment variable is required when MCP_JWT_SECRET is set"
    );
    process.exit(1);
  }

  try {
    jwt.verify(bootToken, jwtSecret, jwtVerifyOptions);
  } catch (error) {
    logger.error("Failed to verify MCP_JWT_TOKEN", error);
    process.exit(1);
  }
}

// Initialize Pipedrive API clients
const apiClients = initializePipedriveClients();

// Create MCP server
const server = new McpServer({
  name: "pipedrive-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

// === TOOLS ===
registerTools(server, apiClients);

// === PROMPTS ===
registerPrompts(server);

// === TRANSPORT SETUP ===
if (transportType === "sse") {
  startSseServer(server, jwtSecret, jwtVerifyOptions);
} else {
  startStdioServer(server);
}
