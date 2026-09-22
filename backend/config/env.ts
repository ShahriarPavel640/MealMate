import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(5000),

  // Security
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Database config & URL
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(5434),
  DB_NAME: z.string().default('mealmate'),
  DATABASE_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  // URLs & CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:5000'),
  CORS_ORIGINS: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  // SSLCommerz
  SSL_COMMERZ_STORE_ID: z.string().default(''),
  SSL_COMMERZ_STORE_PASSWORD: z.string().default(''),
  SSL_COMMERZ_IS_LIVE: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
  STORE_ID: z.string().default(''),
  STORE_PASSWD: z.string().default(''),

  // BKash
  BKASH_USER_NAME: z.string().default(''),
  BKASH_PASSWORD: z.string().default(''),
  BKASH_APP_KEY: z.string().default(''),
  BKASH_APP_SECRET: z.string().default(''),
  BKASH_CALLBACK_URL: z.string().default(''),

  // Google / Gemini AI
  GOOGLE_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),

  // Observability & Sentry
  SENTRY_DSN: z.string().default(''),
  LOG_LEVEL: z.string().default('info'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables configuration');
}

export const env: Env = parsed.data;

/**
 * Helper to get the active database connection string
 */
export const getDatabaseUrl = (): string => {
  if (env.DB_HOST === 'db') {
    return `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@db:5432/${env.DB_NAME}?schema=public`;
  }
  if (env.DATABASE_URL) return env.DATABASE_URL;
  return `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;
};

/**
 * Helper to get the active Redis connection URL
 */
export const getRedisUrl = (): string => {
  if (env.DB_HOST === 'db') {
    return 'redis://redis:6379';
  }
  return env.REDIS_URL;
};

export default env;
