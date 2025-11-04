import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerSearchAll: ToolRegistration = (
  server,
  { itemSearchApi }
) => {
  server.tool(
    "search-all",
    "Search across all item types (deals, persons, organizations, etc.)",
    {
      term: z.string().describe("Search term"),
      itemTypes: z
        .string()
        .optional()
        .describe(
          "Comma-separated list of item types to search (deal,person,organization,product,file,activity,lead)"
        ),
    },
    async ({ term, itemTypes }) => {
      try {
        const response = await itemSearchApi.searchItem({
          term,
          item_types: itemTypes,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error performing search with term "${term}":`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error performing search: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
