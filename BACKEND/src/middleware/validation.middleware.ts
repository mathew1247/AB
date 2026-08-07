import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      return next(new AppError("VALIDATION_ERROR", issue?.message ?? "Invalid request body.", 400));
    }
    req.body = result.data;
    return next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new AppError("VALIDATION_ERROR", "Invalid request parameters.", 400));
    }
    return next();
  };
}
