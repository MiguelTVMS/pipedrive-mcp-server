# Tests

This directory contains unit tests for the Pipedrive MCP Server.

## Test Framework

We use **[Vitest](https://vitest.dev/)** - a blazing fast unit test framework powered by Vite. Vitest is chosen for:

- ✅ Native TypeScript and ESM support
- ✅ Compatible with Jest API (familiar syntax)
- ✅ Fast execution with watch mode
- ✅ Built-in code coverage
- ✅ Modern testing experience with UI

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
└── tools/
    └── getDeal.test.ts    # Unit tests for getDeal tool
```

## Testing Patterns

### 1. Tool Registration Tests

Verify that tools are registered correctly with the MCP server:

```typescript
it("should register with correct name", () => {
  expect(mockServer.tool).toHaveBeenCalledWith(
    "get-deal",
    expect.any(String),
    expect.any(Object),
    expect.any(Function)
  );
});
```

### 2. Success Path Tests

Test successful API responses and data transformation:

```typescript
it("should return deal data when API call succeeds", async () => {
  const mockDealData = { id: 123, title: "Test Deal" };
  mockDealsApi.getDeal.mockResolvedValue({ data: mockDealData });
  
  const result = await registeredToolHandler({ dealId: 123 });
  
  expect(result.content[0].text).toBe(JSON.stringify(mockDealData, null, 2));
});
```

### 3. Error Handling Tests

Verify proper error handling for various failure scenarios:

```typescript
it("should handle API errors with error message", async () => {
  mockDealsApi.getDeal.mockRejectedValue(new Error("Deal not found"));
  
  const result = await registeredToolHandler({ dealId: 999 });
  
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain("Error fetching deal 999");
});
```

### 4. Edge Case Tests

Test boundary conditions and special cases:

```typescript
it("should handle dealId as 0", async () => {
  // Test with edge case values
});

it("should handle special characters in fields", async () => {
  // Test with emoji, unicode, special chars
});
```

### 5. Response Format Tests

Verify the response structure matches MCP protocol requirements:

```typescript
it("should return content array with single text object", async () => {
  expect(result).toHaveProperty("content");
  expect(result.content[0]).toHaveProperty("type", "text");
});
```

## Mocking Strategy

### Logger Mocking

The logger is mocked at the module level to prevent console output during tests:

```typescript
vi.mock("../../src/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));
```

### API Client Mocking

Pipedrive API clients are mocked using Vitest's `vi.fn()`:

```typescript
mockDealsApi = {
  getDeal: vi.fn(),
} as unknown as DealsApi;
```

### MCP Server Mocking

The MCP server's `tool()` method is mocked to capture the registered handler:

```typescript
mockServer = {
  tool: vi.fn((name, description, schema, handler) => {
    registeredToolHandler = handler;
    return {} as any;
  }),
} as unknown as McpServer;
```

## Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 90%

## Writing New Tests

When adding tests for new tools:

1. Create a new test file in `tests/tools/` matching the source file name
2. Follow the established test structure:
   - Tool registration tests
   - Success path tests
   - Error handling tests
   - Edge case tests
   - Response format tests
3. Mock external dependencies (logger, API clients)
4. Use descriptive test names that explain the scenario
5. Include both positive and negative test cases

## Example Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerYourTool } from "../../src/tools/yourTool.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

describe("yourTool", () => {
  let mockServer: McpServer;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: any) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks...
    registerYourTool(mockServer, mockApiClients);
  });

  describe("tool registration", () => {
    it("should register with correct name", () => {
      // Test registration...
    });
  });

  describe("successful operations", () => {
    it("should handle successful API call", async () => {
      // Test success path...
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      // Test error scenarios...
    });
  });
});
```

## CI Integration

Tests automatically run in CI/CD pipelines. Add to your GitHub Actions workflow:

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## Debugging Tests

Use VS Code's built-in debugging:

1. Set breakpoints in your test files
2. Press F5 or use "JavaScript Debug Terminal"
3. Run `npm test` in the debug terminal

Or use Vitest UI for visual debugging:

```bash
npm run test:ui
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clear mocks**: Use `vi.clearAllMocks()` in `beforeEach`
3. **Descriptive names**: Test names should describe the scenario and expected outcome
4. **Arrange-Act-Assert**: Follow AAA pattern for test structure
5. **Test behavior, not implementation**: Focus on what the tool does, not how
6. **Mock external dependencies**: Don't make real API calls in tests
7. **Cover edge cases**: Test boundary conditions, null/undefined, empty values
8. **Verify error handling**: Ensure errors are caught and properly formatted

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
