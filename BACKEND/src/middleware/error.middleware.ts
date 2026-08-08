import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found." },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err instanceof Error && err.message === "Not allowed by CORS") {
    status = 403;
    code = "CORS_DENIED";
    message = "Origin is not allowed.";
  } else if (err instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = err.issues[0]?.message ?? "Invalid input.";
  } else if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    status = 400;
    code = "INVALID_JSON";
    message = "Malformed JSON in request body.";
  } else {
    logger.error("unhandled error", { error: err instanceof Error ? err.message : String(err) });
  }

  res.status(status).json({
    success: false,
    error: { code, message },
  });
}
