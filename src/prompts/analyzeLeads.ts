import { PromptRegistration } from "../types/index.js";

export const registerAnalyzeLeads: PromptRegistration = (server) => {
  server.prompt("analyze-leads", "Analyze leads by status", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please search for all leads in my Pipedrive account and group them by status.",
        },
      },
    ],
  }));
};
