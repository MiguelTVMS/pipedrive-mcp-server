import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetOrganizations: ToolRegistration = (
  server,
  { organizationsApi }
) => {
  server.tool(
    "get-organizations",
    "Get all organizations from Pipedrive including custom fields",
    {},
    async () => {
      try {
        const response = await organizationsApi.getOrganizations();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error("Error fetching organizations:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching organizations: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
