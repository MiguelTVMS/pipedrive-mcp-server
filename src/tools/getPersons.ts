import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetPersons: ToolRegistration = (
  server,
  { personsApi }
) => {
  server.tool(
    "get-persons",
    "Get all persons from Pipedrive including custom fields",
    {},
    async () => {
      try {
        const response = await personsApi.getPersons();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error("Error fetching persons:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching persons: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
