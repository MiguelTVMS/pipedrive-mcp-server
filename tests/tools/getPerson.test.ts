import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetPerson } from "../../src/tools/getPerson.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PersonsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

describe("getPerson tool", () => {
  let mockServer: McpServer;
  let mockPersonsApi: PersonsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { personId: number }) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersonsApi = { getPerson: vi.fn() } as unknown as PersonsApi;
    mockApiClients = { personsApi: mockPersonsApi } as unknown as ApiClients;
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;
    registerGetPerson(mockServer, mockApiClients);
  });

  it("should register with correct name", () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      "get-person",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("should return person data when API call succeeds", async () => {
    const mockPersonData = { id: 123, name: "John Doe", email: "john@test.com" };
    (mockPersonsApi.getPerson as Mock).mockResolvedValue({ data: mockPersonData });

    const result = await registeredToolHandler({ personId: 123 });

    expect(mockPersonsApi.getPerson).toHaveBeenCalledWith(123);
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPersonData, null, 2) }],
    });
  });

  it("should handle API errors", async () => {
    (mockPersonsApi.getPerson as Mock).mockRejectedValue(new Error("Person not found"));

    const result = await registeredToolHandler({ personId: 999 });

    expect(result).toEqual({
      content: [{ type: "text", text: "Error fetching person 999: Person not found" }],
      isError: true,
    });
  });
});
