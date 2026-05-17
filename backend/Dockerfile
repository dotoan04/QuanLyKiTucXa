# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV npm_config_audit=false \
    npm_config_fund=false \
    npm_config_loglevel=warn

RUN apk add --no-cache openssl

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
COPY scripts ./scripts/

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV npm_config_audit=false \
    npm_config_fund=false \
    npm_config_loglevel=warn

RUN apk add --no-cache curl openssl

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev && npm cache clean --force

COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/scripts ./scripts/

RUN mkdir -p /app/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD curl -f http://localhost:3001/health || exit 1

# Migrate DB → Seed (if first run) → Start server
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/seed-runner.cjs && node dist/index.js"]
