import { Router } from 'express';
import * as weather from '../controllers/weather.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const weatherRouter = Router();

weatherRouter.get('/city/:cityId', weather.getCityWeather);
weatherRouter.get('/trip/:tripId', requireAuth, weather.getTripWeather);
