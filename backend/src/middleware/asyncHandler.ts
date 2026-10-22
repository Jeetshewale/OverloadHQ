// ---------------------------------------------------------------
// OverloadHQ – Async Handler Wrapper
// Express 4 does NOT catch rejected promises from async handlers.
// This wrapper catches them and passes to the error middleware.
// ---------------------------------------------------------------

import { Request, Response, NextFunction, RequestHandler } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
