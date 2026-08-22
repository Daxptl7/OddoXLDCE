import { prisma } from '../lib/prisma.js';
import { serializeTrip } from './serializers.js';
import { tripDeepInclude } from './trip.service.js';

export async function copyTripForUser(sourceTripId: number, userId: number) {
  const source = await prisma.trip.findUnique({
    where: { id: sourceTripId },
    include: tripDeepInclude,
  });

  if (!source) return null;

  const copy = await prisma.trip.create({
    data: {
      userId,
      name: `${source.name} (copy)`,
      description: source.description,
      startDate: source.startDate,
      endDate: source.endDate,
      coverPhotoUrl: source.coverPhotoUrl,
      targetBudget: source.targetBudget,
      isPublic: false,
      stops: {
        create: source.stops.map((stop) => ({
          cityId: stop.cityId,
          arrivalDate: stop.arrivalDate,
          departureDate: stop.departureDate,
          sortOrder: stop.sortOrder,
          transportCost: stop.transportCost,
          accommodationCost: stop.accommodationCost,
          notes: stop.notes,
          activities: {
            create: stop.activities.map((link) => ({
              activityId: link.activityId,
              scheduledDate: link.scheduledDate,
              scheduledTime: link.scheduledTime,
              customCost: link.customCost,
            })),
          },
        })),
      },
    },
    include: tripDeepInclude,
  });

  return { source, trip: serializeTrip(copy) };
}
