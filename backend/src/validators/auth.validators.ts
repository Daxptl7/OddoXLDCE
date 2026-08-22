import { z } from 'zod';
import { guideProfileSchema } from './guide.validators.js';

const phone = z
  .string()
  .trim()
  .min(6, 'Enter a valid phone number')
  .max(24)
  .regex(/^[+0-9()\-\s]+$/, 'Enter a valid phone number');

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    photoUrl: z.string().url().max(500).optional().nullable(),
    phone: phone.optional().nullable(),
    // ADMIN is deliberately absent: admins are seeded or promoted, never self-registered.
    role: z.enum(['USER', 'GUIDE']).default('USER'),
    guideProfile: guideProfileSchema.optional(),
  })
  .refine((data) => data.role !== 'GUIDE' || data.guideProfile !== undefined, {
    message: 'Guides must tell us where they guide and what they charge',
    path: ['guideProfile'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    photoUrl: z.string().url().max(500).nullable().optional(),
    phone: phone.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
