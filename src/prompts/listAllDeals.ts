import { PromptRegistration } from "../types/index.js";

export const registerListAllDeals: PromptRegistration = (server) => {
  server.prompt("list-all-deals", "List all deals in Pipedrive", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please list all deals in my Pipedrive account, showing their title, value, status, and stage.",
        },
      },
    ],
  }));
};
