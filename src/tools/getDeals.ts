import { z } from "zod";
import { logger } from "../logger.js";
import { ToolRegistration, getErrorMessage } from "../types/index.js";

export const registerGetDeals: ToolRegistration = (server, { dealsApi }) => {
  server.tool(
    "get-deals",
    "Get deals from Pipedrive with flexible filtering options including search by title, date range, owner, stage, status, and more. Use 'get-users' tool first to find owner IDs.",
    {
      searchTitle: z
        .string()
        .optional()
        .describe("Search deals by title/name (partial matches supported)"),
      daysBack: z
        .number()
        .optional()
        .describe(
          "Number of days back to fetch deals based on last activity date (default: 365)"
        ),
      ownerId: z
        .number()
        .optional()
        .describe(
          "Filter deals by owner/user ID (use get-users tool to find IDs)"
        ),
      stageId: z.number().optional().describe("Filter deals by stage ID"),
      status: z
        .enum(["open", "won", "lost", "deleted"])
        .optional()
        .describe("Filter deals by status (default: open)"),
      pipelineId: z.number().optional().describe("Filter deals by pipeline ID"),
      minValue: z.number().optional().describe("Minimum deal value filter"),
      maxValue: z.number().optional().describe("Maximum deal value filter"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of deals to return (default: 500)"),
    },
    async ({
      searchTitle,
      daysBack = 365,
      ownerId,
      stageId,
      status = "open",
      pipelineId,
      minValue,
      maxValue,
      limit = 500,
    }) => {
      try {
        let filteredDeals: any[] = [];

        // If searching by title, use the search API first
        if (searchTitle) {
          // @ts-ignore - Bypass incorrect TypeScript definition
          const searchResponse = await dealsApi.searchDeals(searchTitle);
          filteredDeals = (searchResponse.data as any) || [];
        } else {
          // Calculate the date filter (daysBack days ago)
          const filterDate = new Date();
          filterDate.setDate(filterDate.getDate() - daysBack);

          // Build API parameters (using actual Pipedrive API parameter names)
          const params: any = {
            sort: "last_activity_date DESC",
            status: status,
            limit: limit,
          };

          // Add optional filters
          if (ownerId) params.user_id = ownerId;
          if (stageId) params.stage_id = stageId;
          if (pipelineId) params.pipeline_id = pipelineId;

          // Fetch deals with filters
          // @ts-ignore - getDeals accepts parameters but types may be incomplete
          const response = await dealsApi.getDeals(params);
          filteredDeals = response.data || [];
        }

        // Apply additional client-side filtering

        // Filter by date if not searching by title
        if (!searchTitle) {
          const filterDate = new Date();
          filterDate.setDate(filterDate.getDate() - daysBack);

          filteredDeals = filteredDeals.filter((deal: any) => {
            if (!deal.last_activity_date) return false;
            const dealActivityDate = new Date(deal.last_activity_date);
            return dealActivityDate >= filterDate;
          });
        }

        // Filter by owner if specified and not already applied in API call
        if (ownerId && searchTitle) {
          filteredDeals = filteredDeals.filter(
            (deal: any) => deal.owner_id === ownerId
          );
        }

        // Filter by status if specified and searching by title
        if (status && searchTitle) {
          filteredDeals = filteredDeals.filter(
            (deal: any) => deal.status === status
          );
        }

        // Filter by stage if specified and not already applied in API call
        if (stageId && (searchTitle || !stageId)) {
          filteredDeals = filteredDeals.filter(
            (deal: any) => deal.stage_id === stageId
          );
        }

        // Filter by pipeline if specified and not already applied in API call
        if (pipelineId && (searchTitle || !pipelineId)) {
          filteredDeals = filteredDeals.filter(
            (deal: any) => deal.pipeline_id === pipelineId
          );
        }

        // Filter by value range if specified
        if (minValue !== undefined || maxValue !== undefined) {
          filteredDeals = filteredDeals.filter((deal: any) => {
            const value = parseFloat(deal.value) || 0;
            if (minValue !== undefined && value < minValue) return false;
            if (maxValue !== undefined && value > maxValue) return false;
            return true;
          });
        }

        // Apply limit
        if (filteredDeals.length > limit) {
          filteredDeals = filteredDeals.slice(0, limit);
        }

        // Build filter summary for response
        const filterSummary = {
          ...(searchTitle && { search_title: searchTitle }),
          ...(!searchTitle && { days_back: daysBack }),
          ...(!searchTitle && {
            filter_date: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          }),
          status: status,
          ...(ownerId && { owner_id: ownerId }),
          ...(stageId && { stage_id: stageId }),
          ...(pipelineId && { pipeline_id: pipelineId }),
          ...(minValue !== undefined && { min_value: minValue }),
          ...(maxValue !== undefined && { max_value: maxValue }),
          total_deals_found: filteredDeals.length,
          limit_applied: limit,
        };

        // Summarize deals to avoid massive responses but include notes and booking details
        const bookingFieldKey = "8f4b27fbd9dfc70d2296f23ce76987051ad7324e";
        const summarizedDeals = filteredDeals.map((deal: any) => ({
          id: deal.id,
          title: deal.title,
          value: deal.value,
          currency: deal.currency,
          status: deal.status,
          stage_name: deal.stage?.name || "Unknown",
          pipeline_name: deal.pipeline?.name || "Unknown",
          owner_name: deal.owner?.name || "Unknown",
          organization_name: deal.org?.name || null,
          person_name: deal.person?.name || null,
          add_time: deal.add_time,
          last_activity_date: deal.last_activity_date,
          close_time: deal.close_time,
          won_time: deal.won_time,
          lost_time: deal.lost_time,
          notes_count: deal.notes_count || 0,
          // Include recent notes if available
          notes: deal.notes || [],
          // Include custom booking details field
          booking_details: deal[bookingFieldKey] || null,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: searchTitle
                    ? `Found ${filteredDeals.length} deals matching title search "${searchTitle}"`
                    : `Found ${filteredDeals.length} deals matching the specified filters`,
                  filters_applied: filterSummary,
                  total_found: filteredDeals.length,
                  deals: summarizedDeals.slice(0, 30), // Limit to 30 deals max to prevent huge responses
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logger.error("Error fetching deals:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching deals: ${getErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
