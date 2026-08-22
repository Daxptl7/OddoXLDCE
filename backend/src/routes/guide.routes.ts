import { Router } from 'express';
import * as guides from '../controllers/guide.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  guideBookingActionSchema,
  listGuideBookingsSchema,
  listGuidesSchema,
  updateGuideProfileSchema,
} from '../validators/guide.validators.js';

export const guideRouter = Router();

guideRouter.use(requireAuth);

// ── The guide's own workspace (mounted before /:id so "me" isn't an id) ──
guideRouter.get('/me', requireRole('GUIDE'), guides.getMyGuideProfile);
guideRouter.patch(
  '/me',
  requireRole('GUIDE'),
  validate(updateGuideProfileSchema),
  guides.updateMyGuideProfile,
);
guideRouter.get(
  '/me/assignments',
  requireRole('GUIDE'),
  validate(listGuideBookingsSchema, 'query'),
  guides.listMyAssignments,
);
guideRouter.patch(
  '/me/assignments/:id',
  requireRole('GUIDE'),
  numericParams('id'),
  validate(guideBookingActionSchema),
  guides.respondToAssignment,
);

// ── The directory, open to any signed-in account ──
guideRouter.get('/', validate(listGuidesSchema, 'query'), guides.listGuides);
guideRouter.get('/:id', numericParams('id'), guides.getGuide);
