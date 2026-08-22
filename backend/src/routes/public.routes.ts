import { Router } from 'express';
import { getPublicTrip } from '../controllers/public.controller.js';

export const publicRouter = Router();

// No requireAuth anywhere on this router — that is the point of it.
publicRouter.get('/:slug', getPublicTrip);
