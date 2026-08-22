import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { getTripBudget } from '../services/budget.service.js';
import { serializeActivity, serializeCity } from '../services/serializers.js';
import { getOwnedTrip } from '../services/trip.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AiOptimizeInput, AiPlanInput, AiTripInput } from '../validators/ai.validators.js';

const categoryForInterest = (interest: string): string | null => {
  const value = interest.toLowerCase();
  if (/(food|cafe|restaurant|eat)/.test(value)) return 'food';
  if (/(museum|history|culture|art)/.test(value)) return 'culture';
  if (/(hike|beach|nature|outdoor)/.test(value)) return 'outdoor';
  if (/(bar|club|music|night)/.test(value)) return 'nightlife';
  if (/(shop|market)/.test(value)) return 'shopping';
  return null;
};

type CandidateCity = Awaited<ReturnType<typeof findCandidateCities>>[number];
type CandidateActivity = Awaited<ReturnType<typeof findCandidateActivities>>;

interface GeneratedPlanStop {
  cityId: number;
  suggestedDays: number;
  activityIds: number[];
  reason: string;
}

interface GeneratedPlan {
  title: string;
  summary: string;
  stops: GeneratedPlanStop[];
}

const generatedPlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'stops'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    stops: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cityId', 'suggestedDays', 'activityIds', 'reason'],
        properties: {
          cityId: { type: 'number' },
          suggestedDays: { type: 'number' },
          activityIds: {
            type: 'array',
            items: { type: 'number' },
          },
          reason: { type: 'string' },
        },
      },
    },
  },
};

async function findCandidateCities(destinations: string) {
  const terms = destinations
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);

  const matched = await prisma.city.findMany({
    where: {
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' as const } },
        { country: { contains: term, mode: 'insensitive' as const } },
        { region: { contains: term, mode: 'insensitive' as const } },
      ]),
    },
    orderBy: [{ popularity: 'desc' }, { costIndex: 'asc' }],
    take: 8,
  });

  return matched.length
    ? matched
    : prisma.city.findMany({ orderBy: [{ popularity: 'desc' }, { costIndex: 'asc' }], take: 8 });
}

async function findCandidateActivities(cityIds: number[], interests: string[], budget?: number) {
  const preferredCategories = interests.map(categoryForInterest).filter((category): category is string => Boolean(category));

  const activities = await prisma.activity.findMany({
    where: {
      cityId: { in: cityIds },
      ...(preferredCategories.length ? { category: { in: preferredCategories } } : {}),
    },
    orderBy: [{ estimatedCost: budget ? 'asc' : 'desc' }, { name: 'asc' }],
    take: Math.max(18, cityIds.length * 6),
  });

  if (activities.length) return activities;

  return prisma.activity.findMany({
    where: { cityId: { in: cityIds } },
    orderBy: [{ estimatedCost: 'asc' }, { name: 'asc' }],
    take: Math.max(18, cityIds.length * 6),
  });
}

function fallbackPlan(input: AiPlanInput, pickedCities: CandidateCity[], candidateActivities: CandidateActivity) {
  const daysPerStop = Math.max(1, Math.floor(input.durationDays / Math.max(1, Math.min(pickedCities.length, 3))));
  const cities = pickedCities.slice(0, 3);
  const stops = cities.map((city, index) => {
    const activities = candidateActivities.filter((activity) => activity.cityId === city.id).slice(0, 3);
    const activityTotal = activities.reduce((sum, activity) => sum + Number(activity.estimatedCost), 0);
    const stayEstimate = city.costIndex * 55 * daysPerStop;
    return {
      city: serializeCity(city),
      suggestedDays: Math.max(1, index === cities.length - 1 ? input.durationDays - daysPerStop * index : daysPerStop),
      estimatedCost: Math.round((activityTotal + stayEstimate) * 100) / 100,
      activities: activities.map(serializeActivity),
      reason: 'Selected by local fallback from the seeded catalogue.',
    };
  });

  return {
    source: 'seeded-fallback' as const,
    title: `${input.durationDays}-day ${input.travelStyle || 'balanced'} itinerary`,
    summary: 'Generated locally because the LLM was unavailable or returned an invalid plan.',
    targetBudget: input.budget ?? null,
    interests: input.interests,
    stops,
    estimatedTotal: Math.round(stops.reduce((sum, stop) => sum + stop.estimatedCost, 0) * 100) / 100,
  };
}

async function callOpenAIPlan(input: AiPlanInput, cities: CandidateCity[], activities: CandidateActivity): Promise<GeneratedPlan | null> {
  if (!env.openaiApiKey) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openaiModel,
      input: [
        {
          role: 'system',
          content:
            'You are GlobeTrotter planning AI. Build practical multi-city itineraries using ONLY provided city IDs and activity IDs. Never invent IDs, cities, activities, or prices.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            request: input,
            constraints: [
              'Return 1 to 4 stops.',
              'Use only cityId values from candidateCities.',
              'Use only activityIds from candidateActivities and match them to the same city.',
              'Balance cost, variety, and the user interests.',
              'Keep suggestedDays total close to durationDays.',
            ],
            candidateCities: cities.map((city) => ({
              id: city.id,
              name: city.name,
              country: city.country,
              region: city.region,
              costIndex: city.costIndex,
              popularity: city.popularity,
            })),
            candidateActivities: activities.map((activity) => ({
              id: activity.id,
              cityId: activity.cityId,
              name: activity.name,
              category: activity.category,
              estimatedCost: Number(activity.estimatedCost),
              durationMinutes: activity.durationMinutes,
            })),
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'globetrotter_plan',
          strict: true,
          schema: generatedPlanSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    console.warn('OpenAI plan request failed', response.status, await response.text().catch(() => ''));
    return null;
  }

  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text;
  if (!text) return null;

  try {
    return JSON.parse(text) as GeneratedPlan;
  } catch {
    return null;
  }
}

function hydrateGeneratedPlan(input: AiPlanInput, generated: GeneratedPlan, cities: CandidateCity[], activities: CandidateActivity) {
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));

  const stops = generated.stops.flatMap((stop) => {
    const city = citiesById.get(Number(stop.cityId));
    if (!city) return [];
    const stopActivities = stop.activityIds
      .map((id) => activitiesById.get(Number(id)))
      .filter((activity): activity is NonNullable<ReturnType<typeof activitiesById.get>> => Boolean(activity))
      .filter((activity) => activity.cityId === city.id)
      .slice(0, 4);

    const activityTotal = stopActivities.reduce((sum, activity) => sum + Number(activity.estimatedCost), 0);
    const stayEstimate = city.costIndex * 55 * Math.max(1, Math.round(stop.suggestedDays));
    return [{
      city: serializeCity(city),
      suggestedDays: Math.max(1, Math.round(stop.suggestedDays)),
      estimatedCost: Math.round((activityTotal + stayEstimate) * 100) / 100,
      activities: stopActivities.map(serializeActivity),
      reason: stop.reason,
    }];
  });

  if (stops.length === 0) return null;

  return {
    source: 'openai' as const,
    title: generated.title,
    summary: generated.summary,
    targetBudget: input.budget ?? null,
    interests: input.interests,
    stops,
    estimatedTotal: Math.round(stops.reduce((sum, stop) => sum + stop.estimatedCost, 0) * 100) / 100,
  };
}

export const planTrip = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AiPlanInput;
  const cities = await findCandidateCities(input.destinations);
  const activities = await findCandidateActivities(cities.map((city) => city.id), input.interests, input.budget);
  const generated = await callOpenAIPlan(input, cities, activities);
  const llmPlan = generated ? hydrateGeneratedPlan(input, generated, cities, activities) : null;

  res.json(llmPlan ?? fallbackPlan(input, cities, activities));
});
    targetBudget: budget ?? null,
    interests,
    stops,
    estimatedTotal: Math.round(stops.reduce((sum, stop) => sum + stop.estimatedCost, 0) * 100) / 100,
  });
});

export const recommendActivities = asyncHandler(async (req: Request, res: Response) => {
  const { tripId, limit } = req.body as AiTripInput;
  const trip = await getOwnedTrip(tripId, req.user!.id, { deep: true });
  const deepTrip = trip as any;

  const recommendations = await Promise.all(
    deepTrip.stops.map(async (stop: any) => {
      const selectedIds = stop.activities.map((link: any) => Number(link.activityId));
      const activities = await prisma.activity.findMany({
        where: { cityId: stop.cityId, id: { notIn: selectedIds } },
        orderBy: [{ estimatedCost: 'asc' }, { durationMinutes: 'asc' }, { name: 'asc' }],
        take: limit,
      });

      return {
        stopId: stop.id,
        city: stop.city.name,
        reason: stop.activities.length
          ? `Complements your existing ${stop.city.name} plan without pushing the budget too hard.`
          : `Fills an empty ${stop.city.name} stop with low-friction catalogue activities.`,
        activities: activities.map(serializeActivity),
      };
    }),
  );

  res.json({ source: 'seeded-fallback', recommendations });
});

export const optimizeTrip = asyncHandler(async (req: Request, res: Response) => {
  const { tripId, targetBudget } = req.body as AiOptimizeInput;
  const trip = await getOwnedTrip(tripId, req.user!.id, { deep: true });
  const budget = await getTripBudget(trip);
  const neededSavings = Math.max(0, budget.totals.grandTotal - targetBudget);
  const deepTrip = trip as any;

  const chosenActivities = deepTrip.stops.flatMap((stop: any) =>
    stop.activities.map((link: any) => ({
      id: link.id,
      stopId: stop.id,
      city: stop.city.name,
      name: link.activity.name,
      category: link.activity.category,
      cost: Number(link.customCost ?? link.activity.estimatedCost ?? 0),
    })),
  );

  const remove = chosenActivities
    .sort((a: any, b: any) => b.cost - a.cost)
    .slice(0, 3)
    .map((activity: any) => ({
      stopActivityId: activity.id,
      label: `Remove ${activity.name} in ${activity.city}`,
      savings: activity.cost,
      reason: 'Highest-cost selected activity.',
    }));

  const expectedSavings = Math.round(remove.reduce((sum: number, item: any) => sum + item.savings, 0) * 100) / 100;

  res.json({
    source: 'seeded-fallback',
    currentTotal: budget.totals.grandTotal,
    targetBudget,
    neededSavings,
    status: neededSavings <= 0 ? 'already_under_target' : expectedSavings >= neededSavings ? 'actionable' : 'partial',
    actions: neededSavings <= 0 ? [] : remove,
    expectedSavings: neededSavings <= 0 ? 0 : expectedSavings,
    reason:
      neededSavings <= 0
        ? 'This trip is already inside the requested budget.'
        : 'Preview only: confirm manually by removing or swapping activities in the builder.',
  });
});
