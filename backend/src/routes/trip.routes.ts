import { Router } from 'express';
import * as stops from '../controllers/stop.controller.js';
import * as trips from '../controllers/trip.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  createStopSchema,
  reorderStopsSchema,
} from '../validators/stop.validators.js';
import {
  createTripSchema,
  listTripsSchema,
  updateTripSchema,
} from '../validators/trip.validators.js';

export const tripRouter = Router();

tripRouter.use(requireAuth);

tripRouter.get('/', validate(listTripsSchema, 'query'), trips.listTrips);
tripRouter.post('/', validate(createTripSchema), trips.createTrip);

tripRouter.get('/:id', numericParams('id'), trips.getTrip);
tripRouter.patch('/:id', numericParams('id'), validate(updateTripSchema), trips.updateTrip);
tripRouter.delete('/:id', numericParams('id'), trips.deleteTrip);

tripRouter.get('/:id/budget', numericParams('id'), trips.getBudget);
tripRouter.get('/:id/itinerary', numericParams('id'), trips.getItinerary);
tripRouter.post('/:id/copy', numericParams('id'), trips.copyTrip);

tripRouter.post('/:id/share', numericParams('id'), trips.shareTrip);
tripRouter.delete('/:id/share', numericParams('id'), trips.unshareTrip);

tripRouter.get('/:id/stops', numericParams('id'), stops.listStops);
tripRouter.post('/:id/stops', numericParams('id'), validate(createStopSchema), stops.addStop);
tripRouter.patch(
  '/:id/stops/reorder',
  numericParams('id'),
  validate(reorderStopsSchema),
  stops.reorder,
);
