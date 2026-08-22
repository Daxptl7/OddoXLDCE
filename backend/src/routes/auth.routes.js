import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema, updateProfileSchema } from '../validators/auth.validators.js';

// Credential endpoints get their own limiter; the rest of the API is far chattier.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, try again in a few minutes' } },
});

export const authRouter = Router();

authRouter.post('/signup', authLimiter, validate(signupSchema), auth.signup);
authRouter.post('/login', authLimiter, validate(loginSchema), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', requireAuth, auth.me);
authRouter.patch('/me', requireAuth, validate(updateProfileSchema), auth.updateProfile);
