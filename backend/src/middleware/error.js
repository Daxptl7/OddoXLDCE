import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message ?? 'Something went wrong';
  let details = err.details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      message = `That ${err.meta?.target?.join(', ') ?? 'value'} is already taken`;
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Not found';
    } else if (err.code === 'P2003') {
      status = 400;
      message = 'Referenced record does not exist';
    }
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) {
      message = 'Something went wrong';
      details = undefined;
    }
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
