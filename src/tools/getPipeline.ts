import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetPipeline: ToolRegistration = (
  server,
  { pipelinesApi }
) => {
  server.tool(
    "get-pipeline",
    "Get a specific pipeline by ID",
    {
      pipelineId: z.number().describe("Pipedrive pipeline ID"),
    },
    async ({ pipelineId }) => {
      try {
        // @ts-ignore - Bypass incorrect TypeScript definition
        const response = await pipelinesApi.getPipeline(pipelineId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error fetching pipeline ${pipelineId}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching pipeline ${pipelineId}: ${getErrorMessage(
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
