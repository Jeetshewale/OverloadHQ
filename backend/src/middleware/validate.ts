// ---------------------------------------------------------------
// OverloadHQ – Validation Middleware
// Uses Zod schemas to validate req.body, req.query, or req.params.
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        res.status(400).json({ error: "Validation failed", details: errors });
        return;
      }
      next(err);
    }
  };
}
