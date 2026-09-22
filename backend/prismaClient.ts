import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '@/config/env.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

export default prisma;
