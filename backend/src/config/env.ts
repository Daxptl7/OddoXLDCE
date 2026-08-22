import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env.`);
  }
  return value;
}

export interface Env {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  publicAppUrl: string;
  groqApiKey?: string;
  groqModel: string;
  googleWeatherApiKey?: string;
  rapidApiKey?: string;
  readonly isProd: boolean;
}

export const env: Env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? 'http://localhost:5173',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  googleWeatherApiKey: process.env.GOOGLE_WEATHER_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  rapidApiKey: process.env.RAPIDAPI_KEY,
  get isProd(): boolean {
    return this.nodeEnv === 'production';
  },
};
