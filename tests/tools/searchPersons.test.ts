import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerSearchPersons } from "../../src/tools/searchPersons.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PersonsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("searchPersons tool", () => {
  let mockServer: McpServer;
  let mockPersonsApi: PersonsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { term: string }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPersonsApi = {
      searchPersons: vi.fn(),
    } as unknown as PersonsApi;

    mockApiClients = {
      personsApi: mockPersonsApi,
    } as unknown as ApiClients;

    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;

    registerSearchPersons(mockServer, mockApiClients);
  });

  describe("tool registration", () => {
    it("should register with correct name", () => {
      expect(mockServer.tool).toHaveBeenCalledWith(
        "search-persons",
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
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Doe", email: "jane@example.com" },
      ];

      (mockPersonsApi.searchPersons as Mock).mockResolvedValue({
        data: mockResults,
      });

      const result = await registeredToolHandler({ term: "Doe" });

      expect(mockPersonsApi.searchPersons).toHaveBeenCalledWith("Doe");
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
      (mockPersonsApi.searchPersons as Mock).mockResolvedValue({
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

    it("should handle special characters in search term", async () => {
      (mockPersonsApi.searchPersons as Mock).mockResolvedValue({
        data: [{ id: 1, name: "Café Owner" }],
      });

      const result = await registeredToolHandler({ term: "Café" });

      expect(mockPersonsApi.searchPersons).toHaveBeenCalledWith("Café");
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      (mockPersonsApi.searchPersons as Mock).mockRejectedValue(
        new Error("Search failed")
      );

      const result = await registeredToolHandler({ term: "test" });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error searching persons: Search failed",
          },
        ],
        isError: true,
      });
    });

    it("should handle rate limit errors", async () => {
      (mockPersonsApi.searchPersons as Mock).mockRejectedValue(
        new Error("Rate limit exceeded")
      );

      const result = await registeredToolHandler({ term: "test" });

      expect((result as any).isError).toBe(true);
      expect((result as any).content[0].text).toContain("Rate limit exceeded");
    });
  });
});
