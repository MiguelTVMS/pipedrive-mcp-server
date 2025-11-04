import { PromptRegistration } from "../types/index.js";

export const registerFindHighValueDeals: PromptRegistration = (server) => {
  server.prompt("find-high-value-deals", "Find high-value deals", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please identify the highest value deals in my Pipedrive account and provide information about which stage they're in and which person or organization they're associated with.",
        },
      },
    ],
  }));
};
