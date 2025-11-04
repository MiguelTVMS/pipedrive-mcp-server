import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./logger.js";

/**
 * Start the MCP server with stdio transport
 */
export function startStdioServer(server: McpServer): void {
  const transport = new StdioServerTransport();

  server.connect(transport).catch((err) => {
    logger.error("Failed to start MCP server:", err);
    process.exit(1);
  });

  logger.info("Pipedrive MCP Server started (stdio transport)");
}
