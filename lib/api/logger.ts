interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("INFO", message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("WARN", message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: {
        message: error?.message,
        stack: this.isDev ? error?.stack : undefined,
      },
    };
    console.error(this.formatMessage("ERROR", message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }

  // API 請求日誌
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";
    const message = `${method} ${path} ${statusCode} ${duration}ms`;
    if (level === "ERROR") {
      this.error(message, undefined, context);
    } else if (level === "WARN") {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }
}

export const logger = new Logger();

