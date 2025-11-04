import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerSearchPersons: ToolRegistration = (
  server,
  { personsApi }
) => {
  server.tool(
    "search-persons",
    "Search persons by term",
    {
      term: z.string().describe("Search term for persons"),
    },
    async ({ term }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await personsApi.searchPersons(term);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error searching persons with term "${term}":`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error searching persons: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
