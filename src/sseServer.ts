import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";
import ngrok from "@ngrok/ngrok";
import { logger } from "./logger.js";
import { getErrorMessage } from "./types/index.js";

/**
 * Verify JWT authentication for incoming requests
 */
function createAuthenticationVerifier(
  jwtSecret: string | undefined,
  jwtVerifyOptions: object
) {
  return (req: http.IncomingMessage) => {
    if (!jwtSecret) {
      return { ok: true } as const;
    }

    const header = req.headers["authorization"];
    if (!header) {
      return {
        ok: false,
        status: 401,
        message: "Missing Authorization header",
      } as const;
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return {
        ok: false,
        status: 401,
        message: "Invalid Authorization header format",
      } as const;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require("jsonwebtoken");
      jwt.verify(token, jwtSecret, jwtVerifyOptions);
      return { ok: true } as const;
    } catch (_error) {
      return {
        ok: false,
        status: 401,
        message: "Invalid or expired token",
      } as const;
    }
  };
}

/**
 * Start the MCP server with SSE transport
 */
export function startSseServer(
  server: McpServer,
  jwtSecret: string | undefined,
  jwtVerifyOptions: object
): void {
  const port = parseInt(process.env.MCP_PORT || "3000", 10);
  const endpoint = process.env.MCP_ENDPOINT || "/message";

  const verifyRequestAuthentication = createAuthenticationVerifier(
    jwtSecret,
    jwtVerifyOptions
  );

  // Store active transports by session ID
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Session-Id"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/sse") {
      const authResult = verifyRequestAuthentication(req);
      if (!authResult.ok) {
        res.writeHead(authResult.status, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ error: authResult.message }));
        return;
      }

      // Establish SSE connection
      logger.debug("New SSE connection request");
      const transport = new SSEServerTransport(endpoint, res);

      // Store transport by session ID
      transports.set(transport.sessionId, transport);

      transport.onclose = () => {
        logger.info(`SSE connection closed: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      };

      try {
        await server.connect(transport);
        logger.info(`SSE connection established: ${transport.sessionId}`);
      } catch (err) {
        logger.error("Failed to establish SSE connection:", err);
        transports.delete(transport.sessionId);
      }
    } else if (req.method === "POST" && url.pathname === endpoint) {
      const authResult = verifyRequestAuthentication(req);
      if (!authResult.ok) {
        res.writeHead(authResult.status, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ error: authResult.message }));
        return;
      }

      // Handle incoming message
      const sessionId =
        url.searchParams.get("sessionId") ||
        (req.headers["x-session-id"] as string);

      if (!sessionId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing sessionId" }));
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }

      req.on("error", (err) => {
        logger.error("Error receiving POST message body:", err);
        if (!res.headersSent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request body" }));
        }
      });

      try {
        await transport.handlePostMessage(req, res);
      } catch (err) {
        logger.error("Error handling POST message:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    } else {
      // Health check endpoint
      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", transport: "sse" }));
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(port, async () => {
    logger.info(`Pipedrive MCP Server (SSE) listening on port ${port}`);
    logger.info(`SSE endpoint: http://localhost:${port}/sse`);
    logger.info(`Message endpoint: http://localhost:${port}${endpoint}`);

    // Check if ngrok is enabled
    const ngrokEnabled = process.env.MCP_NGROK_ENABLED === "true";
    const ngrokAuthtoken = process.env.MCP_NGROK_AUTHTOKEN;

    if (ngrokEnabled) {
      if (!ngrokAuthtoken) {
        logger.warn(
          "WARNING: MCP_NGROK_ENABLED is true but MCP_NGROK_AUTHTOKEN is not set. Skipping ngrok tunnel."
        );
      } else {
        try {
          // Establish ngrok tunnel
          const listener = await ngrok.connect({
            addr: port,
            authtoken: ngrokAuthtoken,
          });

          const ngrokUrl = listener.url();
          logger.info("");
          logger.info("=".repeat(60));
          logger.info("🌐 ngrok tunnel established!");
          logger.info(`Public URL: ${ngrokUrl}`);
          logger.info(`SSE endpoint: ${ngrokUrl}/sse`);
          logger.info(`Message endpoint: ${ngrokUrl}${endpoint}`);
          logger.info(`Health check: ${ngrokUrl}/health`);
          logger.info("=".repeat(60));
          logger.info("");
        } catch (error) {
          logger.error(
            "ERROR: Failed to establish ngrok tunnel:",
            getErrorMessage(error)
          );
          logger.warn("Server will continue running on local port only.");
        }
      }
    }
  });
}
