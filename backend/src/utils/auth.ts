import type { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';
import type { CookieOptions } from 'express';

const SALT_ROUNDS = 10;

/** Unambiguous alphabet: no 0/O or 1/l, so a slug read off a phone screen still works. */
const slugId = customAlphabet('23456789abcdefghijkmnpqrstuvwxyz', 12);

export interface JwtPayload {
  sub: number;
  email: string;
  /** Routing hint only — every protected route re-reads the role from the database. */
  role: UserRole;
}

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const signToken = (user: { id: number; email: string; role: UserRole }): string =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret) as unknown as JwtPayload;

/** Random, non-enumerable share slug — never the trip id. */
export const generateShareSlug = (): string => slugId();

export const SESSION_COOKIE = 'gt_session';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
