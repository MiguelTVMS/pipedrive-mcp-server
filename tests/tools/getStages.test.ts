import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetStages } from "../../src/tools/getStages.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PipelinesApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getStages tool", () => {
  let mockServer: McpServer;
  let mockPipelinesApi: PipelinesApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: () => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPipelinesApi = { getPipelines: vi.fn(), getPipelineStages: vi.fn() } as unknown as PipelinesApi;
    mockApiClients = { pipelinesApi: mockPipelinesApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetStages(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-stages",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockPipelinesApi.getPipelines as Mock).mockResolvedValue({ data: [] });

    const result = await registeredToolHandler();

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockPipelinesApi.getPipelines as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler();

    expect((result as any).isError).toBe(true);
  });
});
