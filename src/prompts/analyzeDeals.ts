import { PromptRegistration } from "../types/index.js";

export const registerAnalyzeDeals: PromptRegistration = (server) => {
  server.prompt("analyze-deals", "Analyze deals by stage", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please analyze the deals in my Pipedrive account, grouping them by stage and providing total value for each stage.",
        },
      },
    ],
  }));
};
