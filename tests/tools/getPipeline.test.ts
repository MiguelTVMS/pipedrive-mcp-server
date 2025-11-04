import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetPipeline } from "../../src/tools/getPipeline.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PipelinesApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getPipeline tool", () => {
  let mockServer: McpServer;
  let mockPipelinesApi: PipelinesApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { pipelineId: number }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPipelinesApi = { getPipeline: vi.fn() } as unknown as PipelinesApi;
    mockApiClients = { pipelinesApi: mockPipelinesApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetPipeline(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-pipeline",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockPipelinesApi.getPipeline as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ pipelineId: 123 });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockPipelinesApi.getPipeline as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ pipelineId: 123 });

    expect((result as any).isError).toBe(true);
  });
});
