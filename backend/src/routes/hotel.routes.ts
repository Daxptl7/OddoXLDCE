import { Router } from 'express';
import * as hotels from '../controllers/hotel.controller.js';

export const hotelRouter = Router();

hotelRouter.get('/', hotels.listHotels);
