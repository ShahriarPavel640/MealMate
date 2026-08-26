import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 5434;
const dbName = process.env.DB_NAME || 'mealmate';

const databaseUrl =
  process.env.DB_HOST === 'db'
    ? `postgresql://${user}:${password}@${host}:5432/${dbName}?schema=public`
    : process.env.DATABASE_URL ||
      `postgresql://${user}:${password}@${host}:${port}/${dbName}?schema=public`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;
