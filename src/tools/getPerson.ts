import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetPerson: ToolRegistration = (server, { personsApi }) => {
  server.tool(
    "get-person",
    "Get a specific person by ID including custom fields",
    {
      personId: z.number().describe("Pipedrive person ID"),
    },
    async ({ personId }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await personsApi.getPerson(personId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error fetching person ${personId}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching person ${personId}: ${getErrorMessage(
                error
              )}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
