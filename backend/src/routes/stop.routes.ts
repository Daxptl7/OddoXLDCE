import { Router } from 'express';
import * as stops from '../controllers/stop.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  addStopActivitySchema,
  updateStopActivitySchema,
  updateStopSchema,
} from '../validators/stop.validators.js';

export const stopRouter = Router();
export const stopActivityRouter = Router();

stopRouter.use(requireAuth);
stopActivityRouter.use(requireAuth);

stopRouter.patch(
  '/:stopId',
  numericParams('stopId'),
  validate(updateStopSchema),
  stops.updateStop,
);
stopRouter.delete('/:stopId', numericParams('stopId'), stops.deleteStop);
stopRouter.post(
  '/:stopId/activities',
  numericParams('stopId'),
  validate(addStopActivitySchema),
  stops.addActivityToStop,
);

stopActivityRouter.patch(
  '/:id',
  numericParams('id'),
  validate(updateStopActivitySchema),
  stops.updateStopActivity,
);
stopActivityRouter.delete('/:id', numericParams('id'), stops.removeStopActivity);
