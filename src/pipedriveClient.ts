import {
  Configuration,
  DealsApi,
  PersonsApi,
  OrganizationsApi,
  PipelinesApi,
  ItemSearchApi,
  LeadsApi,
  NotesApi,
  UsersApi,
} from "pipedrive/v1";
import Bottleneck from "bottleneck";
import { ApiClients } from "./types/index.js";

/**
 * Rate limiter for Pipedrive API calls
 */
const limiter = new Bottleneck({
  minTime: Number(process.env.PIPEDRIVE_RATE_LIMIT_MIN_TIME_MS || 250),
  maxConcurrent: Number(process.env.PIPEDRIVE_RATE_LIMIT_MAX_CONCURRENT || 2),
});

/**
 * Wraps an API client with rate limiting using a Proxy
 */
const withRateLimit = <T extends object>(client: T): T => {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: unknown[]) =>
          limiter.schedule(() => (value as Function).apply(target, args));
      }
      return value;
    },
  });
};

/**
 * Initialize Pipedrive API clients with rate limiting
 */
export function initializePipedriveClients(): ApiClients {
  // Validate required environment variables
  if (!process.env.PIPEDRIVE_API_TOKEN) {
    throw new Error("PIPEDRIVE_API_TOKEN environment variable is required");
  }

  if (!process.env.PIPEDRIVE_DOMAIN) {
    throw new Error(
      "PIPEDRIVE_DOMAIN environment variable is required (e.g., 'ukkofi.pipedrive.com')"
    );
  }

  // Initialize Pipedrive API configuration with API token and custom domain
  const apiConfig = new Configuration({
    apiKey: process.env.PIPEDRIVE_API_TOKEN,
    basePath: `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`,
  });

  // Initialize and wrap API clients with rate limiting
  return {
    dealsApi: withRateLimit(new DealsApi(apiConfig)),
    personsApi: withRateLimit(new PersonsApi(apiConfig)),
    organizationsApi: withRateLimit(new OrganizationsApi(apiConfig)),
    pipelinesApi: withRateLimit(new PipelinesApi(apiConfig)),
    itemSearchApi: withRateLimit(new ItemSearchApi(apiConfig)),
    leadsApi: withRateLimit(new LeadsApi(apiConfig)),
    notesApi: withRateLimit(new NotesApi(apiConfig)),
    usersApi: withRateLimit(new UsersApi(apiConfig)),
  };
}
