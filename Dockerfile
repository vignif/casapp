# syntax=docker/dockerfile:1.6

# ---------- Base builder ----------
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install OS deps needed by sharp/next/swc etc (optional minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    dumb-init \
  && rm -rf /var/lib/apt/lists/*

# ---------- Dependencies ----------
FROM base AS deps
# Enable corepack for pnpm/yarn if needed; default to npm
RUN corepack enable || true
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm i; fi

# ---------- Builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js app (standalone output)
RUN npx prisma generate
RUN npm run build

# ---------- Runner ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Add a non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy the standalone server output and static assets
# Next.js standalone places server in .next/standalone and static in .next/static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure prisma CLI is available at runtime to run migrations
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Use non-root user
USER nextjs

# Start
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
