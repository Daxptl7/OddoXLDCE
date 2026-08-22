import { Router } from 'express';
import * as ai from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiFoodSuggestionsSchema, aiHomeChatSchema, aiOptimizeSchema, aiPlanSchema, aiScheduleSchema, aiTripSchema } from '../validators/ai.validators.js';

export const aiRouter = Router();

aiRouter.get('/status', ai.getAiStatus);
aiRouter.post('/home-chat', validate(aiHomeChatSchema), ai.homeChat);
aiRouter.post('/food-suggestions', validate(aiFoodSuggestionsSchema), ai.getFoodSuggestions);

aiRouter.use(requireAuth);

aiRouter.post('/plan', validate(aiPlanSchema), ai.planTrip);
aiRouter.post('/schedule', validate(aiScheduleSchema), ai.scheduleTrip);
aiRouter.post('/recommend', validate(aiTripSchema), ai.recommendActivities);
aiRouter.post('/optimize', validate(aiOptimizeSchema), ai.optimizeTrip);
