import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetPersons } from "../../src/tools/getPersons.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PersonsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getPersons tool", () => {
  let mockServer: McpServer;
  let mockPersonsApi: PersonsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: () => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersonsApi = { getPersons: vi.fn() } as unknown as PersonsApi;
    mockApiClients = { personsApi: mockPersonsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetPersons(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-persons",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should return all persons", async () => {
    const mockData = [{ id: 1, name: "Person 1" }, { id: 2, name: "Person 2" }];
    (mockPersonsApi.getPersons as Mock).mockResolvedValue({ data: mockData });

    const result = await registeredToolHandler();

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
  });

  it("should handle API errors", async () => {
    (mockPersonsApi.getPersons as Mock).mockRejectedValue(new Error("API error"));

    const result = await registeredToolHandler();

    expect((result as any).isError).toBe(true);
  });
});
