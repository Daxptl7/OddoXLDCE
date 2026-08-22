import { Router } from 'express';
import { copyPublicTrip, getPublicTrip } from '../controllers/public.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const publicRouter = Router();

// GET stays unauthenticated: public links must open in incognito.
publicRouter.get('/:slug', getPublicTrip);
publicRouter.post('/:slug/copy', requireAuth, copyPublicTrip);
