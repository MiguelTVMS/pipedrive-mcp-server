import { PromptRegistration } from "../types/index.js";

export const registerAnalyzeContacts: PromptRegistration = (server) => {
  server.prompt(
    "analyze-contacts",
    "Analyze contacts by organization",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please analyze the persons in my Pipedrive account, grouping them by organization and providing a count for each organization.",
          },
        },
      ],
    })
  );
};
