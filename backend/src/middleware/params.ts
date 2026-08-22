import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/** Coerces the named route params to positive integers, or 400s. */
export const numericParams =
  (...names: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    for (const name of names) {
      const value = Number(req.params[name]);
      if (!Number.isInteger(value) || value <= 0) {
        return next(ApiError.badRequest(`"${req.params[name]}" is not a valid ${name}`));
      }
      (req.params as Record<string, unknown>)[name] = value as unknown as string;
    }
    return next();
  };
