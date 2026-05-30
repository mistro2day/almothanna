import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import('@prisma/adapter-neon');
      return new PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED! });
    },
  },
});