import { Router } from 'express';
import * as bookings from '../controllers/booking.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  cancelBookingSchema,
  createBookingSchema,
  listBookingsSchema,
} from '../validators/booking.validators.js';

export const bookingRouter = Router();

// Hiring a guide is the traveller's move; guides and admins have their own views.
bookingRouter.use(requireAuth, requireRole('USER'));

bookingRouter.get('/', validate(listBookingsSchema, 'query'), bookings.listMyBookings);
bookingRouter.post('/', validate(createBookingSchema), bookings.createBooking);
bookingRouter.get('/:id', numericParams('id'), bookings.getMyBooking);
bookingRouter.post(
  '/:id/cancel',
  numericParams('id'),
  validate(cancelBookingSchema),
  bookings.cancelBooking,
);
