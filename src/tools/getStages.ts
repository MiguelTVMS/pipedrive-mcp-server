import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetStages: ToolRegistration = (
  server,
  { pipelinesApi }
) => {
  server.tool("get-stages", "Get all stages from Pipedrive", {}, async () => {
    try {
      // Since the stages are related to pipelines, we'll get all pipelines first
      const pipelinesResponse = await pipelinesApi.getPipelines();
      const pipelines = pipelinesResponse.data || [];

      // For each pipeline, fetch its stages
      const allStages = [];
      for (const pipeline of pipelines) {
        try {
          // @ts-ignore - Type definitions for getPipelineStages are incomplete
          const stagesResponse = await pipelinesApi.getPipelineStages(
            pipeline.id
          );
          const stagesData = Array.isArray(stagesResponse?.data)
            ? stagesResponse.data
            : [];

          if (stagesData.length > 0) {
            const pipelineStages = stagesData.map((stage: any) => ({
              ...stage,
              pipeline_name: pipeline.name,
            }));
            allStages.push(...pipelineStages);
          }
        } catch (e) {
          logger.error(`Error fetching stages for pipeline ${pipeline.id}:`, e);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allStages, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error("Error fetching stages:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching stages: ${getErrorMessage(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
};
