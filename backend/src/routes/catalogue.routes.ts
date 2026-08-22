import { Router } from 'express';
import * as catalogue from '../controllers/catalogue.controller.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  activitySearchSchema,
  citySearchSchema,
} from '../validators/catalogue.validators.js';

export const cityRouter = Router();
export const activityRouter = Router();

// The catalogue is seeded reference data — readable without a session so the
// public share page can render city and activity details too.
cityRouter.get('/', validate(citySearchSchema, 'query'), catalogue.searchCities);
cityRouter.get('/:id', numericParams('id'), catalogue.getCity);
cityRouter.get(
  '/:id/activities',
  numericParams('id'),
  validate(activitySearchSchema, 'query'),
  catalogue.listCityActivities,
);

activityRouter.get('/', validate(activitySearchSchema, 'query'), catalogue.searchActivities);
activityRouter.get('/categories', catalogue.listCategories);
