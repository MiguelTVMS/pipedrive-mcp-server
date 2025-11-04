import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetUsers } from "../../src/tools/getUsers.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UsersApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

vi.mock("../../src/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getUsers tool", () => {
  let mockServer: McpServer;
  let mockUsersApi: UsersApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: () => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersApi = {
      getUsers: vi.fn(),
    } as unknown as UsersApi;

    mockApiClients = {
      usersApi: mockUsersApi,
    } as unknown as ApiClients;

    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;

    registerGetUsers(mockServer, mockApiClients);
  });

  describe("tool registration", () => {
    it("should register with correct name", () => {
      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-users",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("should register with no parameters (empty schema)", () => {
      const call = (mockServer.tool as Mock).mock.calls[0];
      const schema = call[2];
      expect(schema).toEqual({});
    });
  });

  describe("successful user retrieval", () => {
    it("should return formatted user list", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          active_flag: true,
          role_name: "Admin",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          active_flag: true,
          role_name: "User",
        },
      ];

      (mockUsersApi.getUsers as Mock).mockResolvedValue({
        data: mockUsers,
      });

      const result = await registeredToolHandler();

      expect(mockUsersApi.getUsers).toHaveBeenCalledTimes(1);
      const content = (result as any).content[0].text;
      const parsed = JSON.parse(content);

      expect(parsed.summary).toBe("Found 2 users in your Pipedrive account");
      expect(parsed.users).toHaveLength(2);
      expect(parsed.users[0]).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        active_flag: true,
        role_name: "Admin",
      });
    });

    it("should handle empty user list", async () => {
      (mockUsersApi.getUsers as Mock).mockResolvedValue({
        data: [],
      });

      const result = await registeredToolHandler();

      const content = (result as any).content[0].text;
      const parsed = JSON.parse(content);

      expect(parsed.summary).toBe("Found 0 users in your Pipedrive account");
      expect(parsed.users).toEqual([]);
    });

    it("should handle null data response", async () => {
      (mockUsersApi.getUsers as Mock).mockResolvedValue({
        data: null,
      });

      const result = await registeredToolHandler();

      const content = (result as any).content[0].text;
      const parsed = JSON.parse(content);

      expect(parsed.users).toEqual([]);
    });

    it("should handle undefined data response", async () => {
      (mockUsersApi.getUsers as Mock).mockResolvedValue({
        data: undefined,
      });

      const result = await registeredToolHandler();

      const content = (result as any).content[0].text;
      const parsed = JSON.parse(content);

      expect(parsed.users).toEqual([]);
    });

    it("should extract only required fields from users", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John",
          email: "john@test.com",
          active_flag: true,
          role_name: "Admin",
          extra_field: "should not appear",
          another_field: 123,
        },
      ];

      (mockUsersApi.getUsers as Mock).mockResolvedValue({
        data: mockUsers,
      });

      const result = await registeredToolHandler();

      const content = (result as any).content[0].text;
      const parsed = JSON.parse(content);

      expect(parsed.users[0]).toEqual({
        id: 1,
        name: "John",
        email: "john@test.com",
        active_flag: true,
        role_name: "Admin",
      });
      expect(parsed.users[0]).not.toHaveProperty("extra_field");
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      (mockUsersApi.getUsers as Mock).mockRejectedValue(new Error("API error"));

      const result = await registeredToolHandler();

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching users: API error",
          },
        ],
        isError: true,
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network timeout");
      (mockUsersApi.getUsers as Mock).mockRejectedValue(networkError);

      const result = await registeredToolHandler();

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching users: Network timeout",
          },
        ],
        isError: true,
      });
    });

    it("should handle authentication errors", async () => {
      (mockUsersApi.getUsers as Mock).mockRejectedValue(
        new Error("Unauthorized")
      );

      const result = await registeredToolHandler();

      expect((result as any).isError).toBe(true);
      expect((result as any).content[0].text).toContain("Unauthorized");
    });
  });

  describe("response format", () => {
    it("should return properly formatted JSON", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Test",
          email: "test@test.com",
          active_flag: true,
          role_name: "User",
        },
      ];
      (mockUsersApi.getUsers as Mock).mockResolvedValue({ data: mockUsers });

      const result = await registeredToolHandler();

      const content = (result as any).content[0];
      expect(content.type).toBe("text");
      expect(content.text).toContain("summary");
      expect(content.text).toContain("users");
      expect(() => JSON.parse(content.text)).not.toThrow();
    });

    it("should not include isError flag on success", async () => {
      (mockUsersApi.getUsers as Mock).mockResolvedValue({ data: [] });

      const result = await registeredToolHandler();

      expect(result).not.toHaveProperty("isError");
    });

    it("should include isError flag on failure", async () => {
      (mockUsersApi.getUsers as Mock).mockRejectedValue(new Error("Test"));

      const result = await registeredToolHandler();

      expect(result).toHaveProperty("isError", true);
    });
  });
});
