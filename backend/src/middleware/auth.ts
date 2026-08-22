import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { SESSION_COOKIE, verifyToken } from '../utils/auth.js';

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[SESSION_COOKIE] ?? null;
}

/** Attaches req.user, or 401s. Accepts the session cookie or a bearer token. */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired, please sign in again');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, email: true, name: true, photoUrl: true, phone: true, role: true, createdAt: true },
  });
  if (!user) throw ApiError.unauthorized();

  req.user = user;
  next();
});

const roleLabels: Record<UserRole, string> = {
  USER: 'travellers',
  GUIDE: 'guides',
  ADMIN: 'administrators',
};

/**
 * Gate a route on the caller's role. Always mount it after requireAuth — the
 * role lives on req.user, so without that this can only ever 401.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      const allowed = roles.map((role) => roleLabels[role]).join(' or ');
      return next(ApiError.forbidden(`This area is for ${allowed} only`));
    }
    return next();
  };
