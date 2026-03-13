# --------------------------------
# Base
# --------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat


# --------------------------------
# Dependencies
# --------------------------------
FROM base AS deps

# Install Bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile


# --------------------------------
# Builder
# --------------------------------
FROM base AS builder
WORKDIR /app

RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# --- Algolia build args (Coolify injects these) ---
ARG NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID
ARG NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY
ARG NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME

ENV NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID=$NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID
ENV NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY
ENV NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME

# Build Next.js
RUN bun run build


# --------------------------------
# Runner
# --------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]