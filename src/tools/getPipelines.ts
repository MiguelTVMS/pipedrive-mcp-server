import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetPipelines: ToolRegistration = (
  server,
  { pipelinesApi }
) => {
  server.tool(
    "get-pipelines",
    "Get all pipelines from Pipedrive",
    {},
    async () => {
      try {
        const response = await pipelinesApi.getPipelines();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error("Error fetching pipelines:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching pipelines: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
