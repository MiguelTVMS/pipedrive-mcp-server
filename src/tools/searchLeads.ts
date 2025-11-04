import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerSearchLeads: ToolRegistration = (server, { leadsApi }) => {
  server.tool(
    "search-leads",
    "Search leads by term",
    {
      term: z.string().describe("Search term for leads"),
    },
    async ({ term }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await leadsApi.searchLeads(term);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error searching leads with term "${term}":`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error searching leads: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
