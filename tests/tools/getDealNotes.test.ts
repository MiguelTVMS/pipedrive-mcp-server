import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetDealNotes } from "../../src/tools/getDealNotes.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getDealNotes tool", () => {
  let mockServer: McpServer;
  let mockDealsApi: DealsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: {
    dealId: number;
    limit?: any;
  }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDealsApi = { getDeal: vi.fn() } as unknown as DealsApi;
    mockApiClients = { dealsApi: mockDealsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetDealNotes(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-deal-notes",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockDealsApi.getDeal as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ dealId: 123, limit: "test" });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockDealsApi.getDeal as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ dealId: 123, limit: 10 });

    // getDealNotes handles errors gracefully and doesn't set isError flag
    // Instead, it includes error information in the response
    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });
});
