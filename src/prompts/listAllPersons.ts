import { PromptRegistration } from "../types/index.js";

export const registerListAllPersons: PromptRegistration = (server) => {
  server.prompt(
    "list-all-persons",
    "List all persons in Pipedrive",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please list all persons in my Pipedrive account, showing their name, email, phone, and organization.",
          },
        },
      ],
    })
  );
};
