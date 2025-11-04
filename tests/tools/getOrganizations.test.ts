import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetOrganizations } from "../../src/tools/getOrganizations.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OrganizationsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getOrganizations tool", () => {
  let mockServer: McpServer;
  let mockOrganizationsApi: OrganizationsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: () => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationsApi = { getOrganizations: vi.fn() } as unknown as OrganizationsApi;
    mockApiClients = { organizationsApi: mockOrganizationsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetOrganizations(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-organizations",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockOrganizationsApi.getOrganizations as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler();

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockOrganizationsApi.getOrganizations as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler();

    expect((result as any).isError).toBe(true);
  });
});
