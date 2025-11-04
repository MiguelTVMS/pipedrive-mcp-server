import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetUsers: ToolRegistration = (server, { usersApi }) => {
  server.tool(
    "get-users",
    "Get all users/owners from Pipedrive to identify owner IDs for filtering deals",
    {},
    async () => {
      try {
        const response = await usersApi.getUsers();
        const users =
          response.data?.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            active_flag: user.active_flag,
            role_name: user.role_name,
          })) || [];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: `Found ${users.length} users in your Pipedrive account`,
                  users: users,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logger.error("Error fetching users:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching users: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
