import { z } from 'zod';
import { pagination } from './common.js';

export const citySearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  maxCostIndex: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['popularity', 'name', 'cost']).default('popularity'),
  ...pagination,
});

export const activitySearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  maxCost: z.coerce.number().min(0).optional(),
  maxDuration: z.coerce.number().int().min(1).optional(),
  sort: z.enum(['cost', 'name', 'duration']).default('cost'),
  ...pagination,
});
