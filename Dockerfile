FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/ ./backend/
RUN cd backend && npm install
RUN rm -f ./backend/prisma/prisma.config.ts
RUN cd backend && npx prisma generate
RUN cd backend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./
ENV NODE_ENV=production
EXPOSE 10000
CMD ["node", "dist/src/main.js"]