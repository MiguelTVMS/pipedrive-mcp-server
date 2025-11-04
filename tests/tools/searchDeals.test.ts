import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerSearchDeals } from "../../src/tools/searchDeals.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("searchDeals tool", () => {
  let mockServer: McpServer;
  let mockDealsApi: DealsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { term: string }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDealsApi = {
      searchDeals: vi.fn(),
    } as unknown as DealsApi;

    mockApiClients = {
      dealsApi: mockDealsApi,
    } as unknown as ApiClients;

    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;

    registerSearchDeals(mockServer, mockApiClients);
  });

  describe("tool registration", () => {
    it("should register with correct name", () => {
      expect(mockServer.tool).toHaveBeenCalledWith(
        "search-deals",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("should require term parameter", () => {
      const call = (mockServer.tool as Mock).mock.calls[0];
      const schema = call[2];
      expect(schema).toHaveProperty("term");
    });
  });

  describe("successful search", () => {
    it("should return search results", async () => {
      const mockResults = [
        { id: 1, title: "Big Deal", value: 10000, status: "open" },
        { id: 2, title: "Small Deal", value: 1000, status: "open" },
      ];

      (mockDealsApi.searchDeals as Mock).mockResolvedValue({
        data: mockResults,
      });

      const result = await registeredToolHandler({ term: "Deal" });

      expect(mockDealsApi.searchDeals).toHaveBeenCalledWith("Deal");
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
      });
    });

    it("should handle empty results", async () => {
      (mockDealsApi.searchDeals as Mock).mockResolvedValue({
        data: [],
      });

      const result = await registeredToolHandler({ term: "NonExistent" });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "[]",
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      (mockDealsApi.searchDeals as Mock).mockRejectedValue(
        new Error("Search failed")
      );

      const result = await registeredToolHandler({ term: "test" });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error searching deals: Search failed",
          },
        ],
        isError: true,
      });
    });
  });
});
