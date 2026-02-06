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
      term: z
        .string()
        .min(2, "Search term must be at least 2 characters")
        .describe("Search term for persons"),
    },
    async ({ term }) => {
      const trimmedTerm = term.trim();

      if (trimmedTerm.length < 2) {
        const message = "Search term must be at least 2 characters";
        logger.error(message);
        return {
          content: [
            {
              type: "text",
              text: `Error searching persons: ${message}`,
            },
          ],
          isError: true,
        };
      }

      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await personsApi.searchPersons({ term: trimmedTerm });
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
