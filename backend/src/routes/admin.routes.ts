import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { numericParams } from '../middleware/params.js';
import { validate } from '../middleware/validate.js';
import {
  adminUpdateBookingSchema,
  adminUpdateGuideSchema,
  listAdminBookingsSchema,
  listAdminGuidesSchema,
  listUsersSchema,
  updateUserRoleSchema,
} from '../validators/admin.validators.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/stats', admin.getStats);

adminRouter.get('/users', validate(listUsersSchema, 'query'), admin.listUsers);
adminRouter.patch(
  '/users/:id/role',
  numericParams('id'),
  validate(updateUserRoleSchema),
  admin.updateUserRole,
);

adminRouter.get('/guides', validate(listAdminGuidesSchema, 'query'), admin.listGuides);
adminRouter.patch('/guides/:id', numericParams('id'), validate(adminUpdateGuideSchema), admin.updateGuide);

adminRouter.get('/bookings', validate(listAdminBookingsSchema, 'query'), admin.listBookings);
adminRouter.patch(
  '/bookings/:id',
  numericParams('id'),
  validate(adminUpdateBookingSchema),
  admin.updateBooking,
);
adminRouter.delete('/bookings/:id', numericParams('id'), admin.deleteBooking);
