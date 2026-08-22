import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/** Replaces req[source] with the parsed value, so handlers get clean typed input. */
export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Some fields need fixing', details));
    }
    if (source === 'query') {
      req.validatedQuery = result.data as Record<string, unknown>;
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data;
    }
    return next();
  };
