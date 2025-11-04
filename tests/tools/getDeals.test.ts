import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetDeals } from "../../src/tools/getDeals.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getDeals tool", () => {
  let mockServer: McpServer;
  let mockDealsApi: DealsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args?: any) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDealsApi = {
      getDeals: vi.fn(),
      searchDeals: vi.fn(),
    } as unknown as DealsApi;
    mockApiClients = { dealsApi: mockDealsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetDeals(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-deals",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = [
      {
        id: 123,
        title: "Test Deal",
        last_activity_date: new Date().toISOString(),
      },
    ];
    (mockDealsApi.getDeals as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({});

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockDealsApi.getDeals as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({});

    expect((result as any).isError).toBe(true);
  });
});
