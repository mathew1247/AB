export type LogLevel = "info" | "warn" | "error";

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

function format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const time = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${time}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function safe(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const line = format(level, message, meta);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger: Logger = {
  info: (message, meta) => safe("info", message, meta),
  warn: (message, meta) => safe("warn", message, meta),
  error: (message, meta) => safe("error", message, meta),
};
