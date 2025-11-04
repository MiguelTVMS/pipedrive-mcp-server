import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerSearchOrganizations } from "../../src/tools/searchOrganizations.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OrganizationsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("searchOrganizations tool", () => {
  let mockServer: McpServer;
  let mockOrganizationsApi: OrganizationsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { term: string }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationsApi = { searchOrganization: vi.fn() } as unknown as OrganizationsApi;
    mockApiClients = { organizationsApi: mockOrganizationsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerSearchOrganizations(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "search-organizations",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should handle successful API call", async () => {
    const mockData = { id: 123, name: "Test Data" };
    (mockOrganizationsApi.searchOrganization as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler({ term: 123 });

    expect(result).toHaveProperty("content");
    expect((result as any).content[0]).toHaveProperty("type", "text");
  });

  it("should handle API errors", async () => {
    (mockOrganizationsApi.searchOrganization as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler({ term: 123 });

    expect((result as any).isError).toBe(true);
  });
});
