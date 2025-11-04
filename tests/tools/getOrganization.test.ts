import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetOrganization } from "../../src/tools/getOrganization.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OrganizationsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getOrganization tool", () => {
  let mockServer: McpServer;
  let mockOrganizationsApi: OrganizationsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { organizationId: number }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationsApi = { getOrganization: vi.fn() } as unknown as OrganizationsApi;
    mockApiClients = { organizationsApi: mockOrganizationsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetOrganization(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-organization",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockOrganizationsApi.getOrganization as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ organizationId: 123 });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockOrganizationsApi.getOrganization as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ organizationId: 123 });

    expect((result as any).isError).toBe(true);
  });
});
