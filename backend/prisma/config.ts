import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

declare global {
  var __globalPrisma__: PrismaClient;
}

export const prisma =
  global.__globalPrisma__ ||
  new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

if (process.env.NODE_ENV !== 'production') global.__globalPrisma__ = prisma;