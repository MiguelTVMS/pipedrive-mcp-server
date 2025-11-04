import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerSearchOrganizations: ToolRegistration = (
  server,
  { organizationsApi }
) => {
  server.tool(
    "search-organizations",
    "Search organizations by term",
    {
      term: z.string().describe("Search term for organizations"),
    },
    async ({ term }) => {
      try {
        // @ts-ignore - API method exists but TypeScript definition is wrong
        const response = await (organizationsApi as any).searchOrganization({
          term,
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
        logger.error(
          `Error searching organizations with term "${term}":`,
          error
        );
        return {
          content: [
            {
              type: "text",
              text: `Error searching organizations: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
