import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetDealNotes: ToolRegistration = (
  server,
  { dealsApi, notesApi }
) => {
  server.tool(
    "get-deal-notes",
    "Get detailed notes and custom booking details for a specific deal",
    {
      dealId: z.number().describe("Pipedrive deal ID"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of notes to return (default: 20)"),
    },
    async ({ dealId, limit = 20 }) => {
      try {
        const result: any = {
          deal_id: dealId,
          notes: [],
          booking_details: null,
        };

        // Get deal details including custom fields
        try {
          // @ts-ignore - Bypass incorrect TypeScript definition
          const dealResponse = await dealsApi.getDeal(dealId);
          const deal = dealResponse.data;

          // Extract custom booking field
          const bookingFieldKey = "8f4b27fbd9dfc70d2296f23ce76987051ad7324e";
          if (deal && (deal as any)[bookingFieldKey]) {
            result.booking_details = (deal as any)[bookingFieldKey];
          }
        } catch (dealError) {
          logger.error(`Error fetching deal details for ${dealId}:`, dealError);
          result.deal_error = getErrorMessage(dealError);
        }

        // Get deal notes
        try {
          // @ts-ignore - API parameters may not be fully typed
          // @ts-ignore - Bypass incorrect TypeScript definition
          const notesResponse = await notesApi.getNotes({
            deal_id: dealId,
            limit: limit,
          });
          result.notes = notesResponse.data || [];
        } catch (noteError) {
          logger.error(`Error fetching notes for deal ${dealId}:`, noteError);
          result.notes_error = getErrorMessage(noteError);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: `Retrieved ${result.notes.length} notes and booking details for deal ${dealId}`,
                  ...result,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error fetching deal notes ${dealId}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching deal notes ${dealId}: ${getErrorMessage(
                error
              )}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
