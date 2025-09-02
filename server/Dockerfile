FROM node:20-slim AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /usr/src/app
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch --prod

FROM base AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY . .
RUN pnpm install --prod --offline
RUN pnpm run build

FROM base AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/dist /usr/src/app/dist
CMD ["node", "dist/main.js"]
