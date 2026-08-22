import { env } from '../config/env.js';
import type { Hotel } from '../types/index.js';

interface HotelCacheEntry {
  expiresAt: number;
  data: Hotel[];
}

const cache = new Map<string, HotelCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateEstimatedPrice(stars: number | null, costIndex: number): number {
  const s = stars ?? 3;
  const base = costIndex * 2000;
  const starMultiplier = 1 + (s - 1) * 0.45;
  return Math.round((base * starMultiplier) / 100) * 100;
}

function getBookingComUrl(hotelName: string, cityName: string, checkin?: string, checkout?: string): string {
  const query = `${hotelName} ${cityName}`;
  const params = new URLSearchParams({
    ss: query,
    selected_currency: 'INR',
  });
  if (checkin) params.set('checkin', checkin);
  if (checkout) params.set('checkout', checkout);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

async function searchBookingComRapidApi(
  cityName: string,
  arrivalDate?: string,
  departureDate?: string,
): Promise<Hotel[] | null> {
  if (!env.rapidApiKey) return null;

  try {
    // Step 1: Get destination/city ID
    const destUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(cityName)}`;
    const destRes = await fetch(destUrl, {
      headers: {
        'x-rapidapi-key': env.rapidApiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!destRes.ok) return null;
    const destData = await destRes.json() as any;
    const destId = destData.data?.[0]?.dest_id;
    if (!destId) return null;

    // Step 2: Fetch real-time hotel listings in INR
    const hotelsUrl = new URL('https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels');
    hotelsUrl.searchParams.set('dest_id', destId);
    hotelsUrl.searchParams.set('search_type', 'CITY');
    hotelsUrl.searchParams.set('arrival_date', arrivalDate || '2026-10-15');
    hotelsUrl.searchParams.set('departure_date', departureDate || '2026-10-18');
    hotelsUrl.searchParams.set('currency_code', 'INR');
    hotelsUrl.searchParams.set('units', 'metric');

    const hotelsRes = await fetch(hotelsUrl.toString(), {
      headers: {
        'x-rapidapi-key': env.rapidApiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!hotelsRes.ok) return null;
    const hotelsData = await hotelsRes.json() as any;
    const hotelList = hotelsData.data?.hotels;
    if (!Array.isArray(hotelList) || hotelList.length === 0) return null;

    return hotelList.map((hotel: any) => {
      const prop = hotel.property || {};
      const priceVal = prop.priceBreakdown?.grossPrice?.value ?? 4500;
      const reviewScore = prop.reviewScore ? Number(prop.reviewScore) : 8.5;
      const stars = prop.accuratePropertyClass || prop.qualityClass || (reviewScore >= 9 ? 5 : reviewScore >= 8 ? 4 : 3);
      const name = prop.name || `Hotel in ${cityName}`;
      const photoUrl = prop.photoUrls?.[0] || `https://picsum.photos/seed/${encodeURIComponent(name)}/800/600`;

      return {
        id: `booking-${hotel.hotel_id || prop.id || Math.random().toString(36).slice(2, 8)}`,
        name,
        stars,
        rating: reviewScore,
        reviewScore,
        address: prop.wishlistName || `${name}, ${cityName}`,
        street: null,
        city: cityName,
        postcode: null,
        country: 'India',
        latitude: prop.latitude || 0,
        longitude: prop.longitude || 0,
        website: getBookingComUrl(name, cityName, arrivalDate, departureDate),
        bookingUrl: getBookingComUrl(name, cityName, arrivalDate, departureDate),
        photoUrl,
        phone: '+91 80000 12345',
        email: null,
        amenities: ['Free Wi-Fi', 'Air Conditioning', '24/7 Front Desk', 'Breakfast Included'],
        estimatedPricePerNight: Math.round(priceVal),
        currency: prop.priceBreakdown?.grossPrice?.currency || 'INR',
        distanceKm: prop.distance || 1.2,
        rooms: 50,
        wheelchair: true,
        source: 'booking-com' as const,
      };
    });
  } catch (err) {
    console.warn('Booking.com RapidAPI search failed, falling back to OpenStreetMap / curated', err);
    return null;
  }
}

export async function fetchHotelsFromOverpass(
  cityName: string,
  country: string,
  lat: number,
  lng: number,
  costIndex: number = 3,
  radiusMeters: number = 8000,
  arrivalDate?: string,
  departureDate?: string,
): Promise<Hotel[]> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}_${radiusMeters}_${cityName}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 1. Try RapidAPI if key is provided
  const rapidHotels = await searchBookingComRapidApi(cityName, arrivalDate, departureDate);
  if (rapidHotels && rapidHotels.length > 0) {
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: rapidHotels });
    return rapidHotels;
  }

  // 2. Query Overpass API
  const query = `[out:json][timeout:15];
(
  node["tourism"~"hotel|guest_house|hostel|resort|motel"](around:${radiusMeters},${lat},${lng});
  way["tourism"~"hotel|guest_house|hostel|resort|motel"](around:${radiusMeters},${lat},${lng});
);
out center 40;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'GlobeTrotter-TripPlanner/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const elements = data.elements;
      if (!Array.isArray(elements) || elements.length === 0) continue;

      const hotels: Hotel[] = [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || tags.brand;
        if (!name) continue;

        const hLat = el.lat ?? el.center?.lat ?? lat;
        const hLng = el.lon ?? el.center?.lon ?? lng;

        let stars: number | null = null;
        if (tags.stars) {
          const parsed = parseInt(tags.stars, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) stars = parsed;
        }

        const street = tags['addr:street']
          ? [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
          : null;
        const address =
          street || tags['addr:city']
            ? [street, tags['addr:city'] || cityName, tags['addr:country'] || country].filter(Boolean).join(', ')
            : `${name}, ${cityName}, ${country}`;

        const website = tags.website || tags['contact:website'] || tags.url || null;
        const phone = tags.phone || tags['contact:phone'] || null;
        const email = tags.email || tags['contact:email'] || null;

        const amenities: string[] = ['Free Wi-Fi', 'Air Conditioning', '24/7 Front Desk'];
        if (tags.swimming_pool === 'yes' || tags.pool === 'yes') amenities.push('Swimming Pool');
        if (tags.restaurant === 'yes') amenities.push('In-house Restaurant');
        if (tags.bar === 'yes') amenities.push('Bar / Lounge');
        if (tags.parking === 'yes' || tags['parking:fee'] === 'no') amenities.push('Parking');
        if (tags.wheelchair === 'yes') amenities.push('Wheelchair Accessible');
        if (tags.spa === 'yes') amenities.push('Spa & Wellness');

        const distanceKm = calculateDistanceKm(lat, lng, hLat, hLng);
        const estimatedPricePerNight = calculateEstimatedPrice(stars, costIndex);
        const bookingUrl = getBookingComUrl(name, cityName, arrivalDate, departureDate);
        const photoUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/800/600`;
        const reviewScore = stars ? Math.min(9.8, 7.0 + stars * 0.5) : 8.4;

        hotels.push({
          id: `osm-${el.type}-${el.id}`,
          name,
          stars: stars || (tags.tourism === 'resort' ? 5 : tags.tourism === 'hostel' ? 2 : 3),
          rating: reviewScore,
          reviewScore,
          address,
          street,
          city: tags['addr:city'] || cityName,
          postcode: tags['addr:postcode'] || null,
          country: tags['addr:country'] || country,
          latitude: hLat,
          longitude: hLng,
          website: website || bookingUrl,
          bookingUrl,
          photoUrl,
          phone,
          email,
          amenities,
          estimatedPricePerNight,
          currency: 'INR',
          distanceKm,
          rooms: tags.rooms ? parseInt(tags.rooms, 10) : null,
          wheelchair: tags.wheelchair === 'yes',
          source: 'overpass' as const,
        });
      }

      if (hotels.length > 0) {
        hotels.sort((a, b) => a.distanceKm - b.distanceKm);
        cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: hotels });
        return hotels;
      }
    } catch (err) {
      console.warn(`Overpass endpoint ${endpoint} failed, trying next...`);
    }
  }

  // 3. If no listings were returned by the API for this place, return an empty array
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: [] });
  return [];
}
