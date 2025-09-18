ARG NODE_IMAGE=node:20-slim

# 1. Build Stage
FROM ${NODE_IMAGE} AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy dependency files first to leverage caching
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies for the client
RUN pnpm install --filter backgammon-bet --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the client application
RUN pnpm --filter backgammon-bet run build

# 2. Production Stage
FROM nginx:1.25-alpine AS production

# Copy built assets from the builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY --from=builder /app/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8001
EXPOSE 8002

CMD ["nginx", "-g", "daemon off;"]
