import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerSearchDeals: ToolRegistration = (server, { dealsApi }) => {
  server.tool(
    "search-deals",
    "Search deals by term",
    {
      term: z.string().describe("Search term for deals"),
    },
    async ({ term }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await dealsApi.searchDeals(term);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error searching deals with term "${term}":`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error searching deals: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
