import { Router } from 'express';
import type { Request, Response } from 'express';
import { aiRouter } from './ai.routes.js';
import { authRouter } from './auth.routes.js';
import { activityRouter, cityRouter } from './catalogue.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { publicRouter } from './public.routes.js';
import { stopActivityRouter, stopRouter } from './stop.routes.js';
import { tripRouter } from './trip.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => res.json({ ok: true, service: 'globetrotter-api' }));

apiRouter.use('/auth', authRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/trips', tripRouter);
apiRouter.use('/stops', stopRouter);
apiRouter.use('/stop-activities', stopActivityRouter);
apiRouter.use('/cities', cityRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/public', publicRouter);
