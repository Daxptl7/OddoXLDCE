import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

/** Unambiguous alphabet: no 0/O or 1/l, so a slug read off a phone screen still works. */
const slugId = customAlphabet('23456789abcdefghijkmnpqrstuvwxyz', 12);

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

/** Random, non-enumerable share slug — never the trip id. */
export const generateShareSlug = () => slugId();

export const SESSION_COOKIE = 'gt_session';

export const cookieOptions = {
  httpOnly: true,
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
