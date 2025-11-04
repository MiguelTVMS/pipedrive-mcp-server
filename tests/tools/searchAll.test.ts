import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerSearchAll } from "../../src/tools/searchAll.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ItemSearchApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("searchAll tool", () => {
  let mockServer: McpServer;
  let mockItemSearchApi: ItemSearchApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { term: string, itemTypes?: any }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockItemSearchApi = { searchItem: vi.fn() } as unknown as ItemSearchApi;
    mockApiClients = { itemSearchApi: mockItemSearchApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerSearchAll(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "search-all",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockItemSearchApi.searchItem as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ term: 123, itemTypes: "test" });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockItemSearchApi.searchItem as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ term: 123, itemTypes: "test" });

    expect((result as any).isError).toBe(true);
  });
});
