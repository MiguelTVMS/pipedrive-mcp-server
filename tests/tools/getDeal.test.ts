import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { registerGetDeal } from "../../src/tools/getDeal.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealsApi } from "pipedrive/v1";
import type { ApiClients } from "../../src/types/api.js";

// Mock the logger
vi.mock("../../src/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getDeal tool", () => {
  let mockServer: McpServer;
  let mockDealsApi: DealsApi;
  let mockApiClients: ApiClients;
  let registeredToolHandler: (args: { dealId: number }) => Promise<unknown>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock DealsApi
    mockDealsApi = {
      getDeal: vi.fn(),
    } as unknown as DealsApi;

    // Create mock ApiClients
    mockApiClients = {
      dealsApi: mockDealsApi,
    } as unknown as ApiClients;

    // Create mock MCP server with tool registration capture
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredToolHandler = handler;
        return {} as any;
      }),
    } as unknown as McpServer;

    // Register the tool
    registerGetDeal(mockServer, mockApiClients);
  });

  describe("tool registration", () => {
    it("should register with correct name", () => {
      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-deal",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("should register with correct description", () => {
      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-deal",
        "Get a specific deal by ID including custom fields",
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("should register with correct schema requiring dealId", () => {
      const call = (mockServer.tool as Mock).mock.calls[0];
      const schema = call[2];

      expect(schema).toHaveProperty("dealId");
      expect(schema.dealId).toBeDefined();
    });
  });

  describe("successful deal retrieval", () => {
    it("should return deal data when API call succeeds", async () => {
      // Arrange
      const mockDealData = {
        id: 123,
        title: "Test Deal",
        value: 5000,
        currency: "USD",
        status: "open",
        person_id: 456,
        org_id: 789,
      };

      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
        success: true,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(mockDealsApi.getDeal).toHaveBeenCalledWith(123);
      expect(mockDealsApi.getDeal).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealData, null, 2),
          },
        ],
      });
    });

    it("should handle deal with custom fields", async () => {
      // Arrange
      const mockDealWithCustomFields = {
        id: 456,
        title: "Deal with Custom Fields",
        value: 10000,
        custom_field_123: "Custom Value",
        custom_field_456: 42,
      };

      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealWithCustomFields,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 456 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealWithCustomFields, null, 2),
          },
        ],
      });
    });

    it("should handle null data response", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: null,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 999 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "null",
          },
        ],
      });
    });

    it("should handle undefined data response", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: undefined,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 999 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: undefined,
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("should handle API errors with error message", async () => {
      // Arrange
      const errorMessage = "Deal not found";
      (mockDealsApi.getDeal as Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await registeredToolHandler({ dealId: 999 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error fetching deal 999: ${errorMessage}`,
          },
        ],
        isError: true,
      });
    });

    it("should handle API errors without error message", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockRejectedValue("String error");

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching deal 123: String error",
          },
        ],
        isError: true,
      });
    });

    it("should handle network errors", async () => {
      // Arrange
      const networkError = new Error("Network timeout");
      networkError.name = "NetworkError";
      (mockDealsApi.getDeal as Mock).mockRejectedValue(networkError);

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching deal 123: Network timeout",
          },
        ],
        isError: true,
      });
    });

    it("should handle 404 not found errors", async () => {
      // Arrange
      const notFoundError = new Error("404: Deal not found");
      (mockDealsApi.getDeal as Mock).mockRejectedValue(notFoundError);

      // Act
      const result = await registeredToolHandler({ dealId: 999 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching deal 999: 404: Deal not found",
          },
        ],
        isError: true,
      });
    });

    it("should handle API rate limit errors", async () => {
      // Arrange
      const rateLimitError = new Error("Rate limit exceeded");
      (mockDealsApi.getDeal as Mock).mockRejectedValue(rateLimitError);

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error fetching deal 123: Rate limit exceeded",
          },
        ],
        isError: true,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle dealId as 0", async () => {
      // Arrange
      const mockDealData = { id: 0, title: "Deal Zero" };
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 0 });

      // Assert
      expect(mockDealsApi.getDeal).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealData, null, 2),
          },
        ],
      });
    });

    it("should handle large dealId numbers", async () => {
      // Arrange
      const largeDealId = 999999999;
      const mockDealData = { id: largeDealId, title: "Large ID Deal" };
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
      });

      // Act
      const result = await registeredToolHandler({ dealId: largeDealId });

      // Assert
      expect(mockDealsApi.getDeal).toHaveBeenCalledWith(largeDealId);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealData, null, 2),
          },
        ],
      });
    });

    it("should handle deal with empty title", async () => {
      // Arrange
      const mockDealData = { id: 123, title: "", value: 0 };
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealData, null, 2),
          },
        ],
      });
    });

    it("should handle deal with special characters in fields", async () => {
      // Arrange
      const mockDealData = {
        id: 123,
        title: "Deal with émojis 🎉 and spëcial çhars",
        notes: "Line 1\nLine 2\tTabbed",
      };
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockDealData, null, 2),
          },
        ],
      });
    });
  });

  describe("response format", () => {
    it("should return content array with single text object", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: { id: 123, title: "Test" },
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toHaveProperty("content");
      expect(Array.isArray((result as any).content)).toBe(true);
      expect((result as any).content).toHaveLength(1);
      expect((result as any).content[0]).toHaveProperty("type", "text");
      expect((result as any).content[0]).toHaveProperty("text");
    });

    it("should format JSON with proper indentation", async () => {
      // Arrange
      const mockDealData = {
        id: 123,
        nested: {
          field: "value",
          array: [1, 2, 3],
        },
      };
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: mockDealData,
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      const text = (result as any).content[0].text;
      expect(text).toContain("\n");
      expect(text).toContain("  ");
      expect(text).toBe(JSON.stringify(mockDealData, null, 2));
    });

    it("should include isError flag on error responses", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockRejectedValue(new Error("Test error"));

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).toHaveProperty("isError", true);
    });

    it("should not include isError flag on success responses", async () => {
      // Arrange
      (mockDealsApi.getDeal as Mock).mockResolvedValue({
        data: { id: 123 },
      });

      // Act
      const result = await registeredToolHandler({ dealId: 123 });

      // Assert
      expect(result).not.toHaveProperty("isError");
    });
  });
});
