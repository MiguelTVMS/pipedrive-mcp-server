import { PromptRegistration } from "../types/index.js";

export const registerListAllPipelines: PromptRegistration = (server) => {
  server.prompt(
    "list-all-pipelines",
    "List all pipelines in Pipedrive",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please list all pipelines in my Pipedrive account, showing their name and stages.",
          },
        },
      ],
    })
  );
};
