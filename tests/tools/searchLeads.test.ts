import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerSearchLeads } from "../../src/tools/searchLeads.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LeadsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("searchLeads tool", () => {
  let mockServer: McpServer;
  let mockLeadsApi: LeadsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { term: string }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadsApi = { searchLeads: vi.fn() } as unknown as LeadsApi;
    mockApiClients = { leadsApi: mockLeadsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerSearchLeads(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "search-leads",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockLeadsApi.searchLeads as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ term: 123 });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockLeadsApi.searchLeads as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ term: 123 });

    expect((result as any).isError).toBe(true);
  });
});
