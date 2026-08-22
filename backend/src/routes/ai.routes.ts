import { Router } from 'express';
import * as ai from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiOptimizeSchema, aiPlanSchema, aiTripSchema } from '../validators/ai.validators.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post('/plan', validate(aiPlanSchema), ai.planTrip);
aiRouter.post('/recommend', validate(aiTripSchema), ai.recommendActivities);
aiRouter.post('/optimize', validate(aiOptimizeSchema), ai.optimizeTrip);
