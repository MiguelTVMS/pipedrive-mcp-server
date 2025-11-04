import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetOrganization: ToolRegistration = (
  server,
  { organizationsApi }
) => {
  server.tool(
    "get-organization",
    "Get a specific organization by ID including custom fields",
    {
      organizationId: z.number().describe("Pipedrive organization ID"),
    },
    async ({ organizationId }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await organizationsApi.getOrganization(organizationId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error fetching organization ${organizationId}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching organization ${organizationId}: ${getErrorMessage(
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
