import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetDeal: ToolRegistration = (server, { dealsApi }) => {
  server.tool(
    "get-deal",
    "Get a specific deal by ID including custom fields",
    {
      dealId: z.number().describe("Pipedrive deal ID"),
    },
    async ({ dealId }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition, API expects just the ID
        const response = await dealsApi.getDeal(dealId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error fetching deal ${dealId}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching deal ${dealId}: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
