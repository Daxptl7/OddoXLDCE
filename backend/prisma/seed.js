import { PrismaClient } from '@prisma/client';
import { cities } from './seed-data.js';

const prisma = new PrismaClient();

const DEMO = {
  email: 'demo@globetrotter.app',
  password: 'demo1234',
  name: 'Demo Traveller',
  phone: '+91 98200 11223',
};

const ADMIN = {
  email: 'admin@globetrotter.app',
  password: 'admin1234',
  name: 'Ops Admin',
  phone: '+91 98200 00001',
};

/** One guide per marquee city, so the directory is never empty on demo day. */
const GUIDES = [
  {
    email: 'amelie@guides.globetrotter.app',
    name: 'Amelie Rousseau',
    city: 'Paris',
    phone: '+33 6 12 34 56 78',
    headline: 'Paris born and raised — museums, markets, and the quiet streets',
    bio: 'Twelve years walking visitors through Paris. I skip the queues, order in French, and know which bakery is worth the detour.',
    languages: ['French', 'English', 'Spanish'],
    specialties: ['Museums', 'Food', 'Photography'],
    dailyRate: 6500,
    experienceYears: 12,
    rating: 4.9,
  },
  {
    email: 'marco@guides.globetrotter.app',
    name: 'Marco Bianchi',
    city: 'Rome',
    phone: '+39 333 456 7890',
    headline: 'Ancient Rome without the queues',
    bio: 'Archaeology graduate turned guide. The Forum makes sense once someone tells you what you are looking at.',
    languages: ['Italian', 'English'],
    specialties: ['History', 'Architecture', 'Food'],
    dailyRate: 5500,
    experienceYears: 9,
    rating: 4.8,
  },
  {
    email: 'yuki@guides.globetrotter.app',
    name: 'Yuki Tanaka',
    city: 'Tokyo',
    phone: '+81 90 1234 5678',
    headline: 'Tokyo neighbourhoods, late-night ramen, day trips out',
    bio: 'I plan the trains so you never stare at a map. Shibuya to Nikko, first timers welcome.',
    languages: ['Japanese', 'English'],
    specialties: ['Food', 'Nightlife', 'Day trips'],
    dailyRate: 7000,
    experienceYears: 7,
    rating: 4.9,
  },
  {
    email: 'priya@guides.globetrotter.app',
    name: 'Priya Sharma',
    city: 'Jaipur',
    phone: '+91 98290 44556',
    headline: 'Rajasthan forts, bazaars, and where to actually eat',
    bio: 'Local historian. Expect stories about the people who built these palaces, not just the dates.',
    languages: ['Hindi', 'English', 'Rajasthani'],
    specialties: ['Heritage', 'Shopping', 'Food'],
    dailyRate: 3000,
    experienceYears: 10,
    rating: 4.7,
  },
  {
    email: 'lucas@guides.globetrotter.app',
    name: 'Lucas Almeida',
    city: 'Barcelona',
    phone: '+34 611 22 33 44',
    headline: 'Gaudí, Gothic Quarter, and the beach after',
    bio: 'Architecture nerd with a tapas problem. Mornings for the sights, evenings for the vermouth bars.',
    languages: ['Spanish', 'Catalan', 'English'],
    specialties: ['Architecture', 'Food', 'Beaches'],
    dailyRate: 4800,
    experienceYears: 6,
    rating: 4.6,
  },
];

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
    update: { phone: DEMO.phone, role: 'USER' },
    create: {
      email: DEMO.email,
      name: DEMO.name,
      phone: DEMO.phone,
      role: 'USER',
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
      targetBudget: 200000,
      coverPhotoUrl: 'https://picsum.photos/seed/europe-summer/1200/600',
      stops: {
        create: [
          {
            cityId: paris.id,
            arrivalDate: date('2026-06-01'),
            departureDate: date('2026-06-04'),
            sortOrder: 10,
            transportCost: 18000,
            accommodationCost: 36000,
            notes: 'Hotel in the 11th, walkable to everything.',
          },
          {
            cityId: rome.id,
            arrivalDate: date('2026-06-04'),
            departureDate: date('2026-06-08'),
            sortOrder: 20,
            transportCost: 12000,
            accommodationCost: 32000,
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

/** Admin + one guide per marquee city, and a booking each side can act on. */
async function seedRoles(demoUser, demoTrip) {
  const bcrypt = (await import('bcryptjs')).default;

  await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { role: 'ADMIN', phone: ADMIN.phone },
    create: {
      email: ADMIN.email,
      name: ADMIN.name,
      phone: ADMIN.phone,
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    },
  });

  const created = [];

  for (const guide of GUIDES) {
    const city = await prisma.city.findFirst({ where: { name: guide.city } });
    if (!city) {
      console.log(`  skipped ${guide.name} — ${guide.city} is not in the catalogue`);
      continue;
    }

    const profileData = {
      cityId: city.id,
      headline: guide.headline,
      bio: guide.bio,
      languages: guide.languages,
      specialties: guide.specialties,
      dailyRate: guide.dailyRate,
      experienceYears: guide.experienceYears,
      rating: guide.rating,
      isActive: true,
      isVerified: true,
    };

    const user = await prisma.user.upsert({
      where: { email: guide.email },
      update: {
        name: guide.name,
        phone: guide.phone,
        role: 'GUIDE',
        guideProfile: { upsert: { create: profileData, update: profileData } },
      },
      create: {
        email: guide.email,
        name: guide.name,
        phone: guide.phone,
        role: 'GUIDE',
        photoUrl: `https://i.pravatar.cc/300?u=${encodeURIComponent(guide.email)}`,
        passwordHash: await bcrypt.hash('guide1234', 10),
        guideProfile: { create: profileData },
      },
      include: { guideProfile: true },
    });

    created.push(user);
  }

  // Amelie walks the demo traveller through their Paris days: one live booking
  // to open the app on, in both the traveller view and the guide view.
  const amelie = created.find((guide) => guide.email === GUIDES[0].email);
  const parisStop = demoTrip.stops.find((stop) => stop.sortOrder === 10);

  if (amelie?.guideProfile && parisStop) {
    await prisma.guideBooking.deleteMany({ where: { touristId: demoUser.id } });

    const days = 3;
    await prisma.guideBooking.create({
      data: {
        guideId: amelie.guideProfile.id,
        touristId: demoUser.id,
        tripId: demoTrip.id,
        cityId: parisStop.cityId,
        startDate: date('2026-06-01'),
        endDate: date('2026-06-03'),
        days,
        headcount: 2,
        dailyRate: GUIDES[0].dailyRate,
        totalCost: GUIDES[0].dailyRate * days,
        status: 'CONFIRMED',
        notes: 'First time in Paris — two of us, slow mornings please.',
        guideNote: 'Booked. I will meet you at your hotel at 09:30 on the first day.',
      },
    });
  }

  return created.length;
}

async function main() {
  console.log('Seeding catalogue…');
  const { cityCount, activityCount } = await seedCatalogue();
  console.log(`  ${cityCount} cities, ${activityCount} activities`);

  console.log('Seeding demo trip…');
  const { user, trip } = await seedDemoTrip();
  console.log(`  "${trip.name}" ready`);

  console.log('Seeding roles…');
  const guideCount = await seedRoles(user, trip);
  console.log(`  1 admin, ${guideCount} guides, 1 live booking`);

  console.log(`\nTraveller login:  ${DEMO.email}  /  ${DEMO.password}`);
  console.log(`Guide login:      ${GUIDES[0].email}  /  guide1234`);
  console.log(`Admin login:      ${ADMIN.email}  /  ${ADMIN.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
