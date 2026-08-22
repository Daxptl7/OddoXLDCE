import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { getTripBudget } from '../services/budget.service.js';
import { serializeActivity, serializeCity, serializeTrip } from '../services/serializers.js';
import { getOwnedTrip } from '../services/trip.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addDays, daysBetween, formatDateOnly, toDateOnly } from '../utils/dates.js';
import type { AiFoodSuggestionsInput, AiHomeChatInput, AiOptimizeInput, AiPlanInput, AiScheduleInput, AiTripInput } from '../validators/ai.validators.js';

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

type SupplementalActivity = [name: string, category: string, estimatedCost: number, durationMinutes: number, description: string];

interface SupplementalCity {
  aliases: string[];
  city: {
    name: string;
    country: string;
    region: string;
    costIndex: number;
    popularity: number;
    latitude: number;
    longitude: number;
    imageUrl: string;
  };
  activities: SupplementalActivity[];
}

const supplementalCities: SupplementalCity[] = [
  {
    aliases: ['kulu', 'kullu', 'himachal', 'himachal pradesh'],
    city: {
      name: 'Kullu',
      country: 'India',
      region: 'Himachal Pradesh',
      costIndex: 2,
      popularity: 76,
      latitude: 31.9579,
      longitude: 77.1095,
      imageUrl: 'https://picsum.photos/seed/kullu/800/600',
    },
    activities: [
      ['Raghunath Temple visit', 'culture', 0, 90, 'A calm heritage stop in central Kullu.'],
      ['Great Himalayan National Park day hike', 'outdoor', 3500, 360, 'Guided nature walk through cedar forest and mountain viewpoints.'],
      ['Beas River rafting', 'outdoor', 2500, 150, 'Beginner-friendly rafting on the Beas near Kullu.'],
      ['Kullu shawl market walk', 'shopping', 0, 90, 'Browse local wool, handicrafts and Himachali souvenirs.'],
      ['Bijli Mahadev trek', 'outdoor', 1500, 300, 'Ridge walk to a hilltop temple with valley views.'],
    ],
  },
  {
    aliases: ['manali', 'kulu', 'kullu', 'himachal', 'himachal pradesh'],
    city: {
      name: 'Manali',
      country: 'India',
      region: 'Himachal Pradesh',
      costIndex: 2,
      popularity: 86,
      latitude: 32.2432,
      longitude: 77.1892,
      imageUrl: 'https://picsum.photos/seed/manali/800/600',
    },
    activities: [
      ['Hadimba Devi Temple', 'culture', 0, 75, 'Woodland temple visit in Old Manali.'],
      ['Solang Valley adventure day', 'outdoor', 3000, 240, 'Cable car, viewpoints and optional adventure activities.'],
      ['Old Manali cafe walk', 'food', 1800, 120, 'Slow evening through cafes, bakeries and riverside lanes.'],
      ['Vashisht hot springs', 'culture', 200, 90, 'Temple village and natural hot springs above the Beas.'],
      ['Atal Tunnel viewpoint drive', 'sightseeing', 4000, 300, 'Scenic drive toward Sissu and high mountain viewpoints.'],
    ],
  },
  {
    aliases: ['shimla', 'himachal', 'himachal pradesh'],
    city: {
      name: 'Shimla',
      country: 'India',
      region: 'Himachal Pradesh',
      costIndex: 2,
      popularity: 82,
      latitude: 31.1048,
      longitude: 77.1734,
      imageUrl: 'https://picsum.photos/seed/shimla/800/600',
    },
    activities: [
      ['Mall Road and Ridge walk', 'sightseeing', 0, 120, 'Classic Shimla walk past cafes, shops and colonial views.'],
      ['Jakhu Temple climb', 'culture', 0, 120, 'Hilltop temple walk with sweeping city views.'],
      ['Viceregal Lodge tour', 'culture', 500, 90, 'Guided visit through a landmark colonial-era building.'],
      ['Kufri day trip', 'outdoor', 2500, 240, 'Short mountain drive for viewpoints and easy walks.'],
    ],
  },
  {
    aliases: ['delhi', 'new delhi', 'india'],
    city: {
      name: 'Delhi',
      country: 'India',
      region: 'North India',
      costIndex: 2,
      popularity: 90,
      latitude: 28.6139,
      longitude: 77.209,
      imageUrl: 'https://picsum.photos/seed/delhi/800/600',
    },
    activities: [
      ['Old Delhi food walk', 'food', 2000, 180, 'Chandni Chowk snacks, sweets and lanes with a local guide.'],
      ['Humayun Tomb and Lodhi Garden', 'culture', 800, 180, 'Mughal architecture and a quiet garden walk.'],
      ['India Gate and Kartavya Path', 'sightseeing', 0, 90, 'Evening monument walk in central Delhi.'],
      ['Qutub Minar complex', 'culture', 800, 120, 'UNESCO-listed minaret and ruins in Mehrauli.'],
    ],
  },
  {
    aliases: ['jaipur', 'rajasthan', 'india'],
    city: {
      name: 'Jaipur',
      country: 'India',
      region: 'Rajasthan',
      costIndex: 2,
      popularity: 88,
      latitude: 26.9124,
      longitude: 75.7873,
      imageUrl: 'https://picsum.photos/seed/jaipur/800/600',
    },
    activities: [
      ['Amber Fort visit', 'culture', 700, 180, 'Hilltop fort with courtyards and city views.'],
      ['Hawa Mahal photo stop', 'sightseeing', 300, 60, 'Iconic facade in the Pink City.'],
      ['Johari Bazaar shopping', 'shopping', 0, 120, 'Jewellery, textiles and handicrafts.'],
      ['Rajasthani thali dinner', 'food', 1800, 90, 'Classic local dinner with dal baati churma.'],
    ],
  },
  {
    aliases: ['udaipur', 'rajasthan', 'lake city', 'india'],
    city: {
      name: 'Udaipur',
      country: 'India',
      region: 'Rajasthan',
      costIndex: 2,
      popularity: 87,
      latitude: 24.5854,
      longitude: 73.7125,
      imageUrl: 'https://picsum.photos/seed/udaipur/800/600',
    },
    activities: [
      ['City Palace of Udaipur', 'culture', 800, 180, 'Grand palace complex overlooking Lake Pichola.'],
      ['Lake Pichola sunset boat ride', 'sightseeing', 1200, 60, 'Scenic boat cruise past Jag Mandir and Lake Palace.'],
      ['Bagore Ki Haveli cultural show', 'culture', 500, 90, 'Dharohar folk dance and puppet performance.'],
      ['Saheliyon Ki Bari', 'sightseeing', 200, 60, 'Lush ornamental gardens with fountains and marble kiosks.'],
    ],
  },
  {
    aliases: ['goa', 'beach', 'south goa', 'north goa', 'india'],
    city: {
      name: 'Goa',
      country: 'India',
      region: 'West Coast',
      costIndex: 2,
      popularity: 94,
      latitude: 15.2993,
      longitude: 74.124,
      imageUrl: 'https://picsum.photos/seed/goa/800/600',
    },
    activities: [
      ['Calangute & Baga beach day', 'outdoor', 0, 240, 'Popular beach stretch with cafes and watersports.'],
      ['Old Goa heritage walk', 'culture', 0, 120, 'Basilica of Bom Jesus and Se Cathedral.'],
      ['Scuba diving at Grand Island', 'outdoor', 4500, 300, 'Boat trip and beginner scuba dive with gear.'],
      ['Mandovi River sunset cruise', 'sightseeing', 1500, 90, 'Live Goan folk music and river sunset cruise.'],
    ],
  },
  {
    aliases: ['mumbai', 'bombay', 'maharashtra', 'india'],
    city: {
      name: 'Mumbai',
      country: 'India',
      region: 'Maharashtra',
      costIndex: 3,
      popularity: 92,
      latitude: 19.076,
      longitude: 72.8777,
      imageUrl: 'https://picsum.photos/seed/mumbai/800/600',
    },
    activities: [
      ['Gateway of India & Colaba walk', 'sightseeing', 0, 120, 'Iconic waterfront monument and heritage street walk.'],
      ['Elephanta Caves ferry & tour', 'culture', 1200, 240, 'Boat ride from Gateway to rock-cut cave temples.'],
      ['Marine Drive sunset walk', 'sightseeing', 0, 90, 'The Queen\'s Necklace promenade after dark.'],
      ['Chowpatty street food crawl', 'food', 800, 90, 'Pav bhaji, bhelpuri and kulfi by the beach.'],
    ],
  },
  {
    aliases: ['agra', 'taj mahal', 'uttar pradesh', 'india'],
    city: {
      name: 'Agra',
      country: 'India',
      region: 'Uttar Pradesh',
      costIndex: 2,
      popularity: 93,
      latitude: 27.1767,
      longitude: 78.0081,
      imageUrl: 'https://picsum.photos/seed/agra/800/600',
    },
    activities: [
      ['Taj Mahal sunrise visit', 'sightseeing', 1500, 180, 'World wonder at the quietest and most scenic hour.'],
      ['Agra Fort exploration', 'culture', 700, 120, 'Massive red sandstone fortress of Mughal emperors.'],
      ['Mehtab Bagh sunset view', 'sightseeing', 400, 90, 'Gardens across the river with direct Taj Mahal views.'],
      ['Mughlai culinary dinner', 'food', 1800, 90, 'Traditional Mughlai delicacies and kebabs.'],
    ],
  },
];

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

interface PlanFallbackReason {
  code: 'missing_groq_key' | 'groq_http_error' | 'groq_empty_response' | 'groq_invalid_json' | 'groq_invalid_plan';
  message: string;
}

interface GroqPlanResult {
  plan: GeneratedPlan | null;
  fallbackReason?: PlanFallbackReason;
}

interface GeneratedScheduleStop {
  cityId: number;
  arrivalDate: string;
  departureDate: string;
  activityIds: number[];
  notes: string;
}

interface GeneratedSchedule {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetBudget: number | null;
  stops: GeneratedScheduleStop[];
}

interface GroqChatPayload {
  model: string;
  temperature: number;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  response_format:
    | { type: 'json_object' }
    | {
        type: 'json_schema';
        json_schema: {
          name: string;
          schema: Record<string, unknown>;
        };
      };
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

const generatedScheduleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'startDate', 'endDate', 'targetBudget', 'stops'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    targetBudget: { type: ['number', 'null'] },
    stops: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cityId', 'arrivalDate', 'departureDate', 'activityIds', 'notes'],
        properties: {
          cityId: { type: 'number' },
          arrivalDate: { type: 'string' },
          departureDate: { type: 'string' },
          activityIds: { type: 'array', items: { type: 'number' } },
          notes: { type: 'string' },
        },
      },
    },
  },
};

const normalizeSearchText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const searchTokens = (value: string): string[] => {
  const normalized = normalizeSearchText(value);
  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  return Array.from(new Set([normalized, ...tokens].filter(Boolean)));
};

async function ensureSupplementalCities(query: string) {
  const normalized = normalizeSearchText(query);
  const matchedSeeds = supplementalCities.filter((seed) =>
    seed.aliases.some((alias) => normalized.includes(normalizeSearchText(alias))),
  );

  for (const seed of matchedSeeds) {
    const city = await prisma.city.upsert({
      where: { name_country: { name: seed.city.name, country: seed.city.country } },
      update: seed.city,
      create: seed.city,
    });

    for (const [name, category, estimatedCost, durationMinutes, description] of seed.activities) {
      const existing = await prisma.activity.findFirst({
        where: { cityId: city.id, name },
        select: { id: true },
      });
      const data = {
        cityId: city.id,
        name,
        category,
        estimatedCost,
        durationMinutes,
        description,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}/600/400`,
      };

      if (existing) {
        await prisma.activity.update({ where: { id: existing.id }, data });
      } else {
        await prisma.activity.create({ data });
      }
    }
  }
}

async function findCandidateCities(destinations: string) {
  await ensureSupplementalCities(destinations);

  const terms = searchTokens(destinations);

  let matched = terms.length
    ? await prisma.city.findMany({
        where: {
          OR: terms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' as const } },
            { country: { contains: term, mode: 'insensitive' as const } },
            { region: { contains: term, mode: 'insensitive' as const } },
          ]),
        },
        orderBy: [{ popularity: 'desc' }, { costIndex: 'asc' }],
        take: 8,
      })
    : [];

  if (matched.length === 0) {
    matched = await prisma.city.findMany({
      orderBy: [{ popularity: 'desc' }, { costIndex: 'asc' }],
      take: 8,
    });
  }

  return matched;
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

function fallbackPlan(
  input: AiPlanInput,
  pickedCities: CandidateCity[],
  candidateActivities: CandidateActivity,
  fallbackReason: PlanFallbackReason,
) {
  const daysPerStop = Math.max(1, Math.floor(input.durationDays / Math.max(1, Math.min(pickedCities.length, 3))));
  const cities = pickedCities.slice(0, 3);
  const stops = cities.map((city, index) => {
    const activities = candidateActivities.filter((activity) => activity.cityId === city.id).slice(0, 3);
    const activityTotal = activities.reduce((sum, activity) => sum + Number(activity.estimatedCost), 0);
    const stayEstimate = (2500 + city.costIndex * 1500) * daysPerStop;
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
    fallbackReason,
    title: `${input.durationDays}-day ${input.travelStyle || 'balanced'} itinerary`,
    summary: fallbackReason.message,
    targetBudget: input.budget ?? null,
    interests: input.interests,
    stops,
    estimatedTotal: Math.round(stops.reduce((sum, stop) => sum + stop.estimatedCost, 0) * 100) / 100,
  };
}

function buildGroqMessages(input: AiPlanInput, cities: CandidateCity[], activities: CandidateActivity): GroqChatPayload['messages'] {
  return [
    {
      role: 'system',
      content:
        'You are GlobeTrotter planning AI. Build practical multi-city itineraries using ONLY provided city IDs and activity IDs. Never invent IDs, cities, activities, or prices. Return JSON only with title, summary, and stops.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        request: input,
        outputShape: {
          title: 'string',
          summary: 'string',
          stops: [{ cityId: 'number', suggestedDays: 'number', activityIds: ['number'], reason: 'string' }],
        },
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
  ];
}

function parseGeneratedPlan(text: string): GeneratedPlan | null {
  try {
    return JSON.parse(text) as GeneratedPlan;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    try {
      return JSON.parse(text.slice(start, end + 1)) as GeneratedPlan;
    } catch {
      return null;
    }
  }
}

function parseGeneratedSchedule(text: string): GeneratedSchedule | null {
  try {
    return JSON.parse(text) as GeneratedSchedule;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    try {
      return JSON.parse(text.slice(start, end + 1)) as GeneratedSchedule;
    } catch {
      return null;
    }
  }
}

async function requestGroqPlan(payload: GroqChatPayload) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function requestGroqText(messages: GroqChatPayload['messages']): Promise<string | null> {
  if (!env.groqApiKey) return null;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.groqModel,
      temperature: 0.45,
      messages,
    }),
  });

  if (!response.ok) {
    console.warn('Groq chat request failed', response.status, await response.text().catch(() => ''));
    return null;
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  return payload.choices?.[0]?.message?.content ?? null;
}

async function callGroqPlan(input: AiPlanInput, cities: CandidateCity[], activities: CandidateActivity): Promise<GroqPlanResult> {
  if (!env.groqApiKey) {
    return {
      plan: null,
      fallbackReason: {
        code: 'missing_groq_key',
        message: 'Generated locally because GROQ_API_KEY is not configured on the backend.',
      },
    };
  }

  const basePayload = {
    model: env.groqModel,
    temperature: 0.75,
    messages: buildGroqMessages(input, cities, activities),
  };

  const schemaPayload: GroqChatPayload = {
    ...basePayload,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'globetrotter_plan',
        schema: generatedPlanSchema,
      },
    },
  };

  let response = await requestGroqPlan(schemaPayload);
  if (!response.ok && response.status === 400) {
    response = await requestGroqPlan({
      ...basePayload,
      response_format: { type: 'json_object' },
    });
  }

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.warn('Groq plan request failed', response.status, details);
    return {
      plan: null,
      fallbackReason: {
        code: 'groq_http_error',
        message: `Generated locally because Groq returned HTTP ${response.status}. Check the backend logs for details.`,
      },
    };
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) {
    return {
      plan: null,
      fallbackReason: {
        code: 'groq_empty_response',
        message: 'Generated locally because Groq returned an empty planning response.',
      },
    };
  }

  try {
    const plan = parseGeneratedPlan(text);
    if (plan) return { plan };

    return {
      plan: null,
      fallbackReason: {
        code: 'groq_invalid_json',
        message: 'Generated locally because Groq returned a response that was not valid JSON.',
      },
    };
  } catch {
    return {
      plan: null,
      fallbackReason: {
        code: 'groq_invalid_json',
        message: 'Generated locally because Groq returned a response that was not valid JSON.',
      },
    };
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
    const stayEstimate = (2500 + city.costIndex * 1500) * Math.max(1, Math.round(stop.suggestedDays));
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
    source: 'groq' as const,
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
  if (cities.length === 0) {
    res.status(400).json({
      error: {
        message: `I could not find "${input.destinations}" in the trip catalogue yet. Try a nearby city or add it to the catalogue first.`,
      },
    });
    return;
  }

  const activities = await findCandidateActivities(cities.map((city) => city.id), input.interests, input.budget);
  const generated = await callGroqPlan(input, cities, activities);
  const llmPlan = generated.plan ? hydrateGeneratedPlan(input, generated.plan, cities, activities) : null;

  res.json(
    llmPlan ??
      fallbackPlan(
        input,
        cities,
        activities,
        generated.fallbackReason ?? {
          code: 'groq_invalid_plan',
          message: 'Generated locally because Groq returned city or activity IDs that are not in the catalogue.',
        },
      ),
  );
});

export const getAiStatus = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    provider: 'groq',
    configured: Boolean(env.groqApiKey),
    model: env.groqModel,
  });
});

export const homeChat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body as AiHomeChatInput;
  const answer = await requestGroqText([
    {
      role: 'system',
      content:
        'You are the GlobeTrotter website assistant. Answer only questions about GlobeTrotter: multi-city trip planning, itineraries, scheduling activities, budgets, sharing trips, signup/login, and how the site helps travelers. Keep answers short, friendly, and practical. If asked unrelated questions, politely bring the user back to GlobeTrotter.',
    },
    { role: 'user', content: message },
  ]);

  res.json({
    source: answer ? 'groq' : 'seeded-fallback',
    message:
      answer ??
      'GlobeTrotter helps you create multi-city trips, schedule activities by day, track budget health, and share or copy trip plans after you sign up.',
  });
});

function isDateOnly(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function safeDate(value: unknown, fallback: string): string {
  return isDateOnly(value) ? value : fallback;
}

function normalizeSchedule(
  generated: GeneratedSchedule,
  cities: CandidateCity[],
  activities: CandidateActivity,
): GeneratedSchedule | null {
  const defaultStart = formatDateOnly(addDays(new Date(), 30))!;
  const defaultEnd = formatDateOnly(addDays(defaultStart, 6))!;
  const cityIds = new Set(cities.map((city) => city.id));
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const startDate = safeDate(generated.startDate, defaultStart);
  const endDate = safeDate(generated.endDate, defaultEnd);

  const stops = generated.stops.flatMap((stop, index) => {
    if (!cityIds.has(Number(stop.cityId))) return [];
    const arrivalDate = safeDate(stop.arrivalDate, index === 0 ? startDate : defaultStart);
    const departureDate = safeDate(stop.departureDate, arrivalDate);
    const activityIds = stop.activityIds
      .map(Number)
      .filter((id) => activitiesById.get(id)?.cityId === Number(stop.cityId))
      .slice(0, 4);

    return [{
      cityId: Number(stop.cityId),
      arrivalDate,
      departureDate: departureDate >= arrivalDate ? departureDate : arrivalDate,
      activityIds,
      notes: stop.notes || 'Scheduled by the dashboard AI assistant.',
    }];
  }).slice(0, 4);

  if (stops.length === 0) return null;

  const normalizedStart = stops.reduce((earliest, stop) => stop.arrivalDate < earliest ? stop.arrivalDate : earliest, startDate);
  const normalizedEnd = stops.reduce((latest, stop) => stop.departureDate > latest ? stop.departureDate : latest, endDate);

  return {
    title: generated.title?.trim() || 'AI scheduled trip',
    description: generated.description?.trim() || 'Created from your dashboard assistant prompt.',
    startDate: normalizedStart,
    endDate: normalizedEnd >= normalizedStart ? normalizedEnd : normalizedStart,
    targetBudget: typeof generated.targetBudget === 'number' && generated.targetBudget >= 0 ? generated.targetBudget : null,
    stops,
  };
}

function fallbackSchedule(prompt: string, cities: CandidateCity[], activities: CandidateActivity): GeneratedSchedule | null {
  const picked = cities.slice(0, 2);
  if (picked.length === 0) return null;

  const startDate = formatDateOnly(addDays(new Date(), 30))!;
  const stops = picked.map((city, index) => {
    const arrivalDate = formatDateOnly(addDays(startDate, index * 2))!;
    const departureDate = formatDateOnly(addDays(arrivalDate, 1))!;
    return {
      cityId: city.id,
      arrivalDate,
      departureDate,
      activityIds: activities.filter((activity) => activity.cityId === city.id).slice(0, 3).map((activity) => activity.id),
      notes: `Added from your prompt: ${prompt.slice(0, 120)}`,
    };
  });

  return {
    title: 'AI scheduled trip',
    description: 'Created from your dashboard assistant prompt.',
    startDate,
    endDate: stops[stops.length - 1]?.departureDate ?? startDate,
    targetBudget: null,
    stops,
  };
}

async function generateSchedule(prompt: string, cities: CandidateCity[], activities: CandidateActivity): Promise<{ source: 'groq' | 'seeded-fallback'; schedule: GeneratedSchedule | null; note?: string }> {
  if (!env.groqApiKey) {
    return {
      source: 'seeded-fallback',
      schedule: fallbackSchedule(prompt, cities, activities),
      note: 'GROQ_API_KEY is not configured, so a catalogue fallback was used.',
    };
  }

  const today = formatDateOnly(new Date())!;
  const payload: GroqChatPayload = {
    model: env.groqModel,
    temperature: 0.65,
    messages: [
      {
        role: 'system',
        content:
          'You are GlobeTrotter dashboard AI. Convert a user prompt into a scheduled trip using ONLY provided city IDs and activity IDs. Return JSON only. Do not invent IDs. Use YYYY-MM-DD dates. If dates are missing, choose future dates after today.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          today,
          prompt,
          outputShape: {
            title: 'string',
            description: 'string',
            startDate: 'YYYY-MM-DD',
            endDate: 'YYYY-MM-DD',
            targetBudget: 'number|null',
            stops: [{ cityId: 'number', arrivalDate: 'YYYY-MM-DD', departureDate: 'YYYY-MM-DD', activityIds: ['number'], notes: 'string' }],
          },
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
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'globetrotter_schedule',
        schema: generatedScheduleSchema,
      },
    },
  };

  let response = await requestGroqPlan(payload);
  if (!response.ok && response.status === 400) {
    response = await requestGroqPlan({ ...payload, response_format: { type: 'json_object' } });
  }

  if (!response.ok) {
    console.warn('Groq schedule request failed', response.status, await response.text().catch(() => ''));
    return {
      source: 'seeded-fallback',
      schedule: fallbackSchedule(prompt, cities, activities),
      note: `Groq returned HTTP ${response.status}, so a catalogue fallback was used.`,
    };
  }

  const body = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const text = body.choices?.[0]?.message?.content;
  const generated = text ? parseGeneratedSchedule(text) : null;
  const schedule = generated ? normalizeSchedule(generated, cities, activities) : null;

  return {
    source: schedule ? 'groq' : 'seeded-fallback',
    schedule: schedule ?? fallbackSchedule(prompt, cities, activities),
    note: schedule ? undefined : 'Groq returned an invalid schedule, so a catalogue fallback was used.',
  };
}

export const scheduleTrip = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, tripId } = req.body as AiScheduleInput;
  const cities = await findCandidateCities(prompt);
  const activities = await findCandidateActivities(cities.map((city) => city.id), [prompt]);
  const result = await generateSchedule(prompt, cities, activities);

  if (!result.schedule || result.schedule.stops.length === 0) {
    result.schedule = fallbackSchedule(prompt, cities, activities);
  }

  if (!result.schedule || result.schedule.stops.length === 0) {
    res.status(400).json({ error: { message: 'Could not schedule a trip for this prompt. Please try with different destinations.' } });
    return;
  }

  const activityIdsByCity = new Map<number, number[]>();
  for (const stop of result.schedule.stops) {
    activityIdsByCity.set(stop.cityId, stop.activityIds);
  }

  let calculatedBudget = result.schedule.targetBudget;
  if (!calculatedBudget || calculatedBudget <= 0) {
    let totalEst = 0;
    for (const stop of result.schedule.stops) {
      const nights = Math.max(1, daysBetween(stop.arrivalDate, stop.departureDate));
      const city = cities.find((c) => c.id === stop.cityId);
      const costIdx = city?.costIndex ?? 2;
      totalEst += Math.round((2500 + costIdx * 1500) * nights) + Math.round(3000 + costIdx * 2000);
      const actIds = activityIdsByCity.get(stop.cityId) ?? [];
      for (const aId of actIds) {
        const act = activities.find((a) => a.id === aId);
        totalEst += Number(act?.estimatedCost ?? 1500);
      }
    }
    calculatedBudget = Math.round(totalEst * 1.15);
  }

  const trip = await prisma.$transaction(async (tx) => {
    const existing = tripId ? await getOwnedTrip(tripId, req.user!.id) : null;
    const savedTrip = existing
      ? await tx.trip.update({
          where: { id: existing.id },
          data: {
            name: result.schedule!.title,
            description: result.schedule!.description,
            startDate: toDateOnly(result.schedule!.startDate),
            endDate: toDateOnly(result.schedule!.endDate),
            targetBudget: calculatedBudget,
          },
        })
      : await tx.trip.create({
          data: {
            userId: req.user!.id,
            name: result.schedule!.title,
            description: result.schedule!.description,
            startDate: toDateOnly(result.schedule!.startDate),
            endDate: toDateOnly(result.schedule!.endDate),
            targetBudget: calculatedBudget,
          },
        });

    if (existing) {
      await tx.tripStop.deleteMany({ where: { tripId: savedTrip.id } });
    }

    for (const [index, stop] of result.schedule!.stops.entries()) {
      const nights = Math.max(1, daysBetween(stop.arrivalDate, stop.departureDate));
      const city = cities.find((c) => c.id === stop.cityId);
      const costIdx = city?.costIndex ?? 2;
      const accommodationCost = Math.round((2500 + costIdx * 1500) * nights);
      const transportCost = Math.round(3000 + costIdx * 2000);

      const savedStop = await tx.tripStop.create({
        data: {
          tripId: savedTrip.id,
          cityId: stop.cityId,
          arrivalDate: toDateOnly(stop.arrivalDate),
          departureDate: toDateOnly(stop.departureDate),
          sortOrder: (index + 1) * 10,
          accommodationCost,
          transportCost,
          notes: stop.notes,
        },
      });

      const activityIds = activityIdsByCity.get(stop.cityId) ?? [];
      for (const [activityIndex, activityId] of activityIds.entries()) {
        await tx.stopActivity.create({
          data: {
            tripStopId: savedStop.id,
            activityId,
            scheduledDate: toDateOnly(
              formatDateOnly(addDays(stop.arrivalDate, activityIndex))! <= stop.departureDate
                ? formatDateOnly(addDays(stop.arrivalDate, activityIndex))!
                : stop.arrivalDate,
            ),
            scheduledTime: `${String(9 + activityIndex * 2).padStart(2, '0')}:00`,
          },
        });
      }
    }

    return tx.trip.findUnique({
      where: { id: savedTrip.id },
      include: { _count: { select: { stops: true } } },
    });
  });

  res.status(tripId ? 200 : 201).json({
    source: result.source,
    message: tripId ? 'Trip updated by the dashboard AI assistant.' : 'Trip scheduled by the dashboard AI assistant.',
    note: result.note,
    trip: serializeTrip(trip!, { includeStops: false }),
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

export const getFoodSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { cityName, country = '', hotelName = null, hotelAddress = null, dietaryPreference = 'all' } = req.body as AiFoodSuggestionsInput;

  if (env.groqApiKey) {
    try {
      const hotelContext = hotelName
        ? `The user is specifically staying at or viewing hotel: "${hotelName}" located at "${hotelAddress || cityName}". Recommend authentic eateries and dishes located near or easily reachable from this hotel area.`
        : `The user is exploring food across ${cityName}, ${country}.`;

      const prompt = `You are a renowned culinary expert and local foodie guide.
Suggest 4-6 of the most iconic, famous, and delicious must-try dishes and culinary experiences for:
Destination: ${cityName}, ${country}
${hotelContext}
Dietary Preference: ${dietaryPreference}

Return a valid JSON object matching this exact schema:
{
  "cuisineOverview": "2 engaging sentences highlighting the gastronomic heritage and flavor highlights of this city.",
  "foods": [
    {
      "dish": "Popular Name of the Dish",
      "localName": "Native / Regional name",
      "description": "Appetizing description of ingredients, flavors, and why travelers must taste it.",
      "category": "must_try", // one of: "must_try", "street_food", "sweet_dessert", "beverage", "classic"
      "estimatedCost": 350, // estimated price in INR (e.g. 150 to 1200)
      "whySpecial": "What makes the preparation or heritage unique.",
      "foodieTip": "Insider secret (e.g. best paired with fresh espresso, visit before 10 AM, ask for extra sauce).",
      "bestPlacesNearHotel": [
        {
          "name": "Iconic Eatery / Trattoria / Cafe Name",
          "type": "Bistro / Street Stall / Bakery / Restaurant",
          "approxDistance": "400m from stay (6 min walk)",
          "description": "Famous for their artisanal recipe and fresh local ingredients.",
          "priceLevel": "₹₹"
        }
      ]
    }
  ]
}
Only output the JSON object without any additional markdown formatting.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.groqModel,
          temperature: 0.5,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an expert food & travel critic. Provide vivid, highly authentic local culinary recommendations in valid JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.foods && Array.isArray(parsed.foods) && parsed.foods.length > 0) {
            res.json({
              cityName,
              country,
              hotelName,
              cuisineOverview: parsed.cuisineOverview || `Authentic and world-renowned culinary specialties of ${cityName}.`,
              source: 'groq',
              foods: parsed.foods,
            });
            return;
          }
        }
      } else {
        console.warn('Groq food suggestions failed', response.status, await response.text().catch(() => ''));
      }
    } catch (err) {
      console.warn('Groq food suggestions error, using fallback', err);
    }
  }

  // Fallback culinary recommendations
  const fallback = generateFallbackFoodSuggestions(cityName, country, hotelName);
  res.json(fallback);
});

function generateFallbackFoodSuggestions(cityName: string, country: string, hotelName: string | null) {
  const cityKey = cityName.toLowerCase();
  
  const foodDatabase: Record<string, any[]> = {
    paris: [
      {
        dish: 'Artisanal Croissant & Pain au Chocolat',
        localName: 'Croissant au Beurre',
        description: 'Flaky, buttery, multi-layered golden pastry baked fresh daily.',
        category: 'must_try',
        estimatedCost: 350,
        whySpecial: 'Traditional French lamination with high-fat Normandy butter.',
        foodieTip: 'Pair with a cafe noisette in the morning.',
        bestPlacesNearHotel: [
          { name: 'Du Pain et des Idées', type: 'Bakery', approxDistance: '500m from stay', description: 'Legendary Parisian boulangerie', priceLevel: '₹' },
          { name: 'Mamiche', type: 'Artisan Bakery', approxDistance: '800m', description: 'Warm fresh morning batches', priceLevel: '₹' }
        ]
      },
      {
        dish: 'Croque Monsieur & Truffle Fries',
        localName: 'Croque-Monsieur',
        description: 'Toasted sourdough with grilled ham, gruyère cheese and rich béchamel sauce.',
        category: 'classic',
        estimatedCost: 850,
        whySpecial: 'Broiled till bubbly golden brown with authentic comte cheese.',
        foodieTip: 'Order the Croque Madame if you prefer a sunny-side fried egg on top.',
        bestPlacesNearHotel: [
          { name: 'Café de Flore', type: 'Historic Bistro', approxDistance: '600m from stay', description: 'Classic Saint-Germain landmark', priceLevel: '₹₹₹' }
        ]
      },
      {
        dish: 'Beef Bourguignon',
        localName: 'Boeuf Bourguignon',
        description: 'Tender braised beef simmered for hours in red Burgundy wine with pearl onions and mushrooms.',
        category: 'must_try',
        estimatedCost: 1400,
        whySpecial: 'Slow-cooked tradition that melts in your mouth.',
        foodieTip: 'Soak up the sauce with a piece of fresh crusty baguette.',
        bestPlacesNearHotel: [
          { name: 'Les Antiquaires', type: 'Traditional Bistro', approxDistance: '450m from stay', description: 'Cozy setting with vintage decor', priceLevel: '₹₹' }
        ]
      }
    ],
    rome: [
      {
        dish: 'Authentic Cacio e Pepe',
        localName: 'Tonnarelli Cacio e Pepe',
        description: 'Handmade fresh tonnarelli pasta emulsified with aged Pecorino Romano and cracked black pepper.',
        category: 'must_try',
        estimatedCost: 850,
        whySpecial: 'Only 3 ingredients, creating a creamy velvety sauce without cream or butter.',
        foodieTip: 'Twirl with pasta water while piping hot.',
        bestPlacesNearHotel: [
          { name: 'Da Enzo al 29', type: 'Trattoria', approxDistance: '400m from stay', description: 'Beloved neighborhood gem in Trastevere', priceLevel: '₹₹' }
        ]
      },
      {
        dish: 'Crispy Roman Supplì',
        localName: 'Supplì al Telefono',
        description: 'Fried rice croquette stuffed with slow-cooked ragù and melted mozzarella strings.',
        category: 'street_food',
        estimatedCost: 250,
        whySpecial: 'Mozzarella stretches like a telephone wire when pulled apart.',
        foodieTip: 'Eat fresh while warm for the ultimate cheese pull.',
        bestPlacesNearHotel: [
          { name: 'Supplì Roma', type: 'Street Food Stall', approxDistance: '350m from stay', description: 'Crispy perfection served hot daily', priceLevel: '₹' }
        ]
      },
      {
        dish: 'Traditional Pistachio Gelato',
        localName: 'Gelato Artigianale',
        description: 'Creamy artisanal gelato churned from Bronte pistachios without artificial additives.',
        category: 'sweet_dessert',
        estimatedCost: 320,
        whySpecial: 'Dense, slow-churned Italian texture served in a crisp wafer cone.',
        foodieTip: 'Top with fresh whipped panna (cream) for 50 cents extra.',
        bestPlacesNearHotel: [
          { name: 'Frigidarium', type: 'Gelateria', approxDistance: '300m from stay', description: 'Free dark chocolate dip on every cone', priceLevel: '₹' }
        ]
      }
    ],
    tokyo: [
      {
        dish: 'Rich Tonkotsu Ramen',
        localName: '豚骨ラーメン',
        description: 'Rich, collagen-infused pork bone broth simmered for 18 hours with springy noodles and chashu.',
        category: 'must_try',
        estimatedCost: 650,
        whySpecial: 'Deep savory umami with marinated soft-boiled ajitsuke tamago.',
        foodieTip: 'Order "Kaedama" for an extra serving of noodles in your leftover broth.',
        bestPlacesNearHotel: [
          { name: 'Ichiran Shibuya', type: 'Ramen Counter', approxDistance: '350m from stay', description: 'Solo ramen tasting booths', priceLevel: '₹' }
        ]
      },
      {
        dish: 'Crispy Takoyaki Octopus Balls',
        localName: 'たこ焼き',
        description: 'Sizzling batter balls filled with tender octopus, topped with sweet brown sauce, kewpie mayo, and dancing bonito flakes.',
        category: 'street_food',
        estimatedCost: 350,
        whySpecial: 'Crispy on the outside, molten and velvety on the inside.',
        foodieTip: 'Poke a small hole first to let the steam escape before taking a bite!',
        bestPlacesNearHotel: [
          { name: 'Gindaco', type: 'Street Stall', approxDistance: '200m from stay', description: 'Crispy exterior prepared on copper hotplates', priceLevel: '₹' }
        ]
      }
    ]
  };

  const matched = foodDatabase[cityKey] || [
    {
      dish: `Signature ${cityName} Street Platter`,
      localName: `Local Delicacy of ${cityName}`,
      description: `Authentic regional street specialty bursting with fresh local spices and culinary tradition.`,
      category: 'must_try',
      estimatedCost: 400,
      whySpecial: `Centuries-old recipe preserved and cooked fresh by neighborhood cooks.`,
      foodieTip: `Ask for the house-special dipping sauce and fresh lime.`,
      bestPlacesNearHotel: [
        { name: `${cityName} Heritage Market Kitchen`, type: 'Local Eatery', approxDistance: '350m from stay', description: 'Popular with locals and food lovers', priceLevel: '₹' }
      ]
    },
    {
      dish: `${cityName} Chef Special Roasts`,
      localName: `Slow Cooked Specialty`,
      description: `Locally sourced seasonal cuts and vegetables slow cooked over wood fire.`,
      category: 'classic',
      estimatedCost: 850,
      whySpecial: `Wood-fired smoky flavor with authentic regional herbs.`,
      foodieTip: `Best enjoyed as a relaxed evening dinner.`,
      bestPlacesNearHotel: [
        { name: `The Old Town Tavern`, type: 'Bistro & Grill', approxDistance: '500m from stay', description: 'Cozy ambiance with craft drinks', priceLevel: '₹₹' }
      ]
    }
  ];

  return {
    cityName,
    country,
    hotelName,
    cuisineOverview: `Explore the vibrant local dishes and beloved dining spots in ${cityName}${hotelName ? ` around ${hotelName}` : ''}.`,
    source: 'fallback',
    foods: matched,
  };
}
