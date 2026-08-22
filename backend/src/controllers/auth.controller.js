import { prisma } from '../lib/prisma.js';
import { serializeUser } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  SESSION_COOKIE,
  cookieOptions,
  hashPassword,
  signToken,
  verifyPassword,
} from '../utils/auth.js';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, photoUrl } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const user = await prisma.user.create({
    data: { name, email, photoUrl: photoUrl ?? null, passwordHash: await hashPassword(password) },
  });

  const token = signToken(user);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.status(201).json({ user: serializeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way, so the endpoint cannot be used to enumerate emails.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  const token = signToken(user);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.json({ user: serializeUser(user), token });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.user.id }, data: req.body });
  res.json({ user: serializeUser(user) });
});
