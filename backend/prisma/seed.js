import { PrismaClient } from '@prisma/client';
import { cities } from './seed-data.js';

const prisma = new PrismaClient();

const DEMO = {
  email: 'demo@globetrotter.app',
  password: 'demo1234',
  name: 'Demo Traveller',
};

const date = (value) => new Date(`${value}T00:00:00.000Z`);

async function seedCatalogue() {
  let cityCount = 0;
  let activityCount = 0;

  for (const { activities, ...city } of cities) {
    const record = await prisma.city.upsert({
      where: { name_country: { name: city.name, country: city.country } },
      update: city,
      create: city,
    });
    cityCount += 1;

    for (const [name, category, estimatedCost, durationMinutes, description] of activities) {
      const existing = await prisma.activity.findFirst({
        where: { cityId: record.id, name },
        select: { id: true },
      });

      const data = {
        cityId: record.id,
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
      activityCount += 1;
    }
  }

  return { cityCount, activityCount };
}

/**
 * The rehearsal trip: Paris then Rome, activities attached, so the app is never
 * demoed against an empty database. Rebuilt from scratch on every seed run.
 */
async function seedDemoTrip() {
  const bcrypt = (await import('bcryptjs')).default;

  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: {},
    create: {
      email: DEMO.email,
      name: DEMO.name,
      passwordHash: await bcrypt.hash(DEMO.password, 10),
    },
  });

  await prisma.trip.deleteMany({ where: { userId: user.id, name: 'Europe Summer 2026' } });

  const paris = await prisma.city.findFirst({ where: { name: 'Paris' } });
  const rome = await prisma.city.findFirst({ where: { name: 'Rome' } });

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      name: 'Europe Summer 2026',
      description: 'Two cities, seven days, one budget that has to hold.',
      startDate: date('2026-06-01'),
      endDate: date('2026-06-08'),
      targetBudget: 2500,
      coverPhotoUrl: 'https://picsum.photos/seed/europe-summer/1200/600',
      stops: {
        create: [
          {
            cityId: paris.id,
            arrivalDate: date('2026-06-01'),
            departureDate: date('2026-06-04'),
            sortOrder: 10,
            transportCost: 220,
            accommodationCost: 480,
            notes: 'Hotel in the 11th, walkable to everything.',
          },
          {
            cityId: rome.id,
            arrivalDate: date('2026-06-04'),
            departureDate: date('2026-06-08'),
            sortOrder: 20,
            transportCost: 140,
            accommodationCost: 520,
            notes: 'Night train from Paris.',
          },
        ],
      },
    },
    include: { stops: true },
  });

  const [parisStop, romeStop] = trip.stops.sort((a, b) => a.sortOrder - b.sortOrder);

  const attach = async (stop, activityName, scheduledDate, scheduledTime) => {
    const activity = await prisma.activity.findFirst({
      where: { cityId: stop.cityId, name: activityName },
    });
    if (!activity) return;
    await prisma.stopActivity.create({
      data: {
        tripStopId: stop.id,
        activityId: activity.id,
        scheduledDate: date(scheduledDate),
        scheduledTime,
      },
    });
  };

  await attach(parisStop, 'Louvre Museum', '2026-06-02', '10:00');
  await attach(parisStop, 'Le Marais food tour', '2026-06-02', '18:00');
  await attach(parisStop, 'Eiffel Tower summit', '2026-06-03', '09:30');
  await attach(romeStop, 'Colosseum & Forum', '2026-06-05', '09:00');
  await attach(romeStop, 'Trastevere food crawl', '2026-06-05', '19:00');
  await attach(romeStop, 'Vatican Museums', '2026-06-06', '08:30');
  await attach(romeStop, 'Pasta making class', '2026-06-07', '17:00');

  return { user, trip };
}

async function main() {
  console.log('Seeding catalogue…');
  const { cityCount, activityCount } = await seedCatalogue();
  console.log(`  ${cityCount} cities, ${activityCount} activities`);

  console.log('Seeding demo trip…');
  const { trip } = await seedDemoTrip();
  console.log(`  "${trip.name}" ready`);
  console.log(`\nDemo login:  ${DEMO.email}  /  ${DEMO.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
