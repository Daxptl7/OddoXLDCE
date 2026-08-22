import { env } from '../config/env.js';
import type { WeatherDaily, WeatherForecast } from '../types/index.js';
import { formatDateOnly, toDateOnly, daysBetween, addDays } from '../utils/dates.js';

interface WeatherCacheEntry {
  expiresAt: number;
  data: WeatherForecast;
}

const cache = new Map<string, WeatherCacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

// WMO Weather interpretation code map
const WMO_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Fog', icon: '🌫️' },
  48: { condition: 'Depositing rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌦️' },
  53: { condition: 'Moderate drizzle', icon: '🌦️' },
  55: { condition: 'Dense drizzle', icon: '🌧️' },
  56: { condition: 'Light freezing drizzle', icon: '🌨️' },
  57: { condition: 'Dense freezing drizzle', icon: '🌨️' },
  61: { condition: 'Slight rain', icon: '🌧️' },
  62: { condition: 'Moderate rain', icon: '🌧️' },
  63: { condition: 'Heavy rain', icon: '🌧️' },
  65: { condition: 'Violent rain', icon: '🌧️' },
  66: { condition: 'Light freezing rain', icon: '🌨️' },
  67: { condition: 'Heavy freezing rain', icon: '🌨️' },
  71: { condition: 'Slight snow fall', icon: '🌨️' },
  73: { condition: 'Moderate snow fall', icon: '❄️' },
  75: { condition: 'Heavy snow fall', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '❄️' },
  80: { condition: 'Slight rain showers', icon: '🌦️' },
  81: { condition: 'Moderate rain showers', icon: '🌧️' },
  82: { condition: 'Violent rain showers', icon: '⛈️' },
  85: { condition: 'Slight snow showers', icon: '🌨️' },
  86: { condition: 'Heavy snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

function getWmoDetails(code: number): { condition: string; icon: string } {
  return WMO_MAP[code] ?? { condition: 'Partly cloudy', icon: '⛅' };
}

function evaluateAdverseCondition(
  code: number,
  tempMax: number,
  tempMin: number,
  precipProb: number,
  precipMm: number,
  windKm: number,
): { isAdverse: boolean; adverseReason: string | null } {
  const reasons: string[] = [];

  if ([95, 96, 99].includes(code)) {
    reasons.push('Thunderstorms expected');
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    reasons.push('Snowfall expected');
  } else if ([63, 65, 82].includes(code) || precipMm >= 15) {
    reasons.push(`Heavy rain (${precipMm}mm) expected`);
  } else if (precipProb >= 70 || precipMm >= 8) {
    reasons.push(`High rain probability (${precipProb}%)`);
  }

  if (tempMax >= 38) {
    reasons.push(`Extreme heatwave (${tempMax}°C)`);
  } else if (tempMin <= -2) {
    reasons.push(`Freezing cold (${tempMin}°C)`);
  }

  if (windKm >= 50) {
    reasons.push(`High winds (${windKm} km/h)`);
  }

  return {
    isAdverse: reasons.length > 0,
    adverseReason: reasons.length > 0 ? reasons.join(' · ') : null,
  };
}

export async function fetchWeatherForecast(
  city: { id?: number; name: string; country: string; latitude: number | null; longitude: number | null },
  startDate: Date | string,
  endDate: Date | string,
): Promise<WeatherForecast> {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const lat = city.latitude ?? 48.8566;
  const lng = city.longitude ?? 2.3522;
  const startStr = formatDateOnly(start) ?? toDateOnly(start).toISOString().slice(0, 10);
  const endStr = formatDateOnly(end) ?? toDateOnly(end).toISOString().slice(0, 10);

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}_${startStr}_${endStr}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '16');

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      const daily = data.daily;
      if (daily && Array.isArray(daily.time)) {
        const days: WeatherDaily[] = [];
        const times: string[] = daily.time;

        for (let i = 0; i < times.length; i += 1) {
          const dateStr = times[i]!;
          if (dateStr >= startStr && dateStr <= endStr) {
            const code = Number(daily.weather_code?.[i] ?? 0);
            const tempMax = Math.round(Number(daily.temperature_2m_max?.[i] ?? 24));
            const tempMin = Math.round(Number(daily.temperature_2m_min?.[i] ?? 16));
            const precipProb = Math.round(Number(daily.precipitation_probability_max?.[i] ?? 10));
            const precipMm = Math.round(Number(daily.precipitation_sum?.[i] ?? 0) * 10) / 10;
            const windKm = Math.round(Number(daily.wind_speed_10m_max?.[i] ?? 12));

            const { condition, icon } = getWmoDetails(code);
            const { isAdverse, adverseReason } = evaluateAdverseCondition(
              code,
              tempMax,
              tempMin,
              precipProb,
              precipMm,
              windKm,
            );

            days.push({
              date: dateStr,
              tempMax,
              tempMin,
              condition,
              weatherCode: code,
              icon,
              precipitationProb: precipProb,
              precipitationMm: precipMm,
              windSpeedKm: windKm,
              isAdverse,
              adverseReason,
            });
          }
        }

        if (days.length > 0) {
          const adverseDays = days.filter((d) => d.isAdverse);
          const result: WeatherForecast = {
            cityId: city.id,
            cityName: city.name,
            country: city.country,
            latitude: lat,
            longitude: lng,
            source: 'open-meteo',
            hasAdverseWeather: adverseDays.length > 0,
            adverseSummary:
              adverseDays.length > 0
                ? `${adverseDays.length} of ${days.length} days with poor weather: ${adverseDays.map((d) => d.adverseReason).join('; ')}`
                : null,
            days,
          };
          cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: result });
          return result;
        }
      }
    }
  } catch (error) {
    console.warn(`Weather fetch failed for ${city.name}, using seasonal model`, error);
  }

  // Fallback seasonal model so the UI never displays an error screen
  const count = Math.max(1, daysBetween(start, end) + 1);
  const fallbackDays: WeatherDaily[] = [];
  const baseTemp = city.latitude ? Math.max(12, Math.min(32, Math.round(34 - Math.abs(city.latitude) * 0.4))) : 24;

  for (let i = 0; i < count; i += 1) {
    const current = addDays(start, i);
    const dateStr = formatDateOnly(current) ?? current.toISOString().slice(0, 10);
    const tempMax = baseTemp + (i % 3) * 2;
    const tempMin = tempMax - 7;
    const isRain = i % 4 === 3;
    const code = isRain ? 61 : (i % 2 === 0 ? 0 : 2);
    const { condition, icon } = getWmoDetails(code);
    const precipProb = isRain ? 65 : 15;
    const precipMm = isRain ? 6.5 : 0;
    const windKm = 14;

    const { isAdverse, adverseReason } = evaluateAdverseCondition(
      code,
      tempMax,
      tempMin,
      precipProb,
      precipMm,
      windKm,
    );

    fallbackDays.push({
      date: dateStr,
      tempMax,
      tempMin,
      condition,
      weatherCode: code,
      icon,
      precipitationProb: precipProb,
      precipitationMm: precipMm,
      windSpeedKm: windKm,
      isAdverse,
      adverseReason,
    });
  }

  const adverseDays = fallbackDays.filter((d) => d.isAdverse);
  const result: WeatherForecast = {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    latitude: lat,
    longitude: lng,
    source: 'fallback',
    hasAdverseWeather: adverseDays.length > 0,
    adverseSummary:
      adverseDays.length > 0
        ? `${adverseDays.length} day(s) with potential rain (${adverseDays.map((d) => d.adverseReason).join('; ')})`
        : null,
    days: fallbackDays,
  };

  return result;
}
