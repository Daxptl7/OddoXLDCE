import type { Request, Response } from 'express';
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

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, photoUrl, phone, role, guideProfile } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  if (role === 'GUIDE') {
    const city = await prisma.city.findUnique({ where: { id: guideProfile.cityId } });
    if (!city) throw ApiError.badRequest('That city is not in our catalogue yet');
  }

  // One transaction: a guide account is never half-created without its profile.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      photoUrl: photoUrl ?? null,
      phone: phone ?? null,
      role,
      passwordHash: await hashPassword(password),
      ...(role === 'GUIDE'
        ? {
            guideProfile: {
              create: {
                cityId: guideProfile.cityId,
                headline: guideProfile.headline ?? null,
                bio: guideProfile.bio ?? null,
                languages: guideProfile.languages ?? [],
                specialties: guideProfile.specialties ?? [],
                dailyRate: guideProfile.dailyRate,
                experienceYears: guideProfile.experienceYears ?? 0,
              },
            },
          }
        : {}),
    },
  });

  const token = signToken(user);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.status(201).json({ user: serializeUser(user), token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
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

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: serializeUser(req.user!) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: req.body });
  res.json({ user: serializeUser(user) });
});
