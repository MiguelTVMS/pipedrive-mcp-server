/**
 * Logger utility for MCP server
 *
 * Uses console.error for stdio transport (to avoid corrupting MCP protocol on stdout)
 * Can use console.log for SSE transport (since it uses HTTP, not stdout)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export type TransportType = "stdio" | "sse";

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private transport: TransportType = "stdio";

  /**
   * Initialize the logger with transport type
   * @param transport 'stdio' or 'sse'
   * @param level Minimum log level to output
   */
  initialize(transport: TransportType, level: LogLevel = LogLevel.INFO): void {
    this.transport = transport;
    this.level = level;
  }

  /**
   * Get the appropriate console method based on transport type
   * For stdio: always use console.error to avoid corrupting MCP protocol
   * For SSE: can use console.log for info/debug, console.error for errors
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    if (this.transport === "stdio") {
      // Always use stderr for stdio transport
      return console.error;
    }

    // For SSE transport, use appropriate console methods
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.log;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Format log message with level prefix
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    return `[${timestamp}] [${levelName}] ${message}`;
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.level) {
      return; // Skip if below minimum level
    }

    const consoleMethod = this.getConsoleMethod(level);
    const formattedMessage = this.formatMessage(level, message);

    if (args.length > 0) {
      consoleMethod(formattedMessage, ...args);
    } else {
      consoleMethod(formattedMessage);
    }
  }

  /**
   * Log debug message (detailed information for debugging)
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log info message (general informational messages)
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log warning message (warning conditions)
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log error message (error conditions)
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton instance
export const logger = new Logger();
