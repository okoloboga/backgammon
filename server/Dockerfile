ARG NODE_IMAGE=node:20-slim

# 1. Base Stage
FROM ${NODE_IMAGE} AS base
RUN npm install -g pnpm
WORKDIR /app

# 2. Production Dependencies Stage
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --filter backend --prod --frozen-lockfile

# 3. Build Stage
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
# Install all dependencies (including dev)
RUN pnpm install --filter backend --frozen-lockfile
# Copy source code
COPY server/ ./server/
# Build the application
RUN pnpm --filter backend build

# 4. Runner Stage (Final)
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create and use a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy production dependencies and build artifacts
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
