# syntax=docker/dockerfile:1

FROM node:24-slim AS build
WORKDIR /repo

RUN corepack enable
# better-sqlite3's native binding needs a compiler if no prebuilt binary matches
# this image's platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

# Install deps first so this layer only invalidates when lockfile/manifests change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/content-toolkit/package.json packages/content-toolkit/package.json
RUN pnpm install --frozen-lockfile

COPY . .

# content-toolkit is a workspace dep of the app — must be built before `vite build`
# resolves its dist/ output.
RUN pnpm --filter @doraeyi/content-toolkit build

# `vite build` runs SvelteKit's postbuild analyse step, which actually imports
# server modules — $lib/server/db throws at import time if DATABASE_URL is
# unset, and auth.ts (which imports db) constructs a betterAuth() instance at
# module scope. None of these open real connections during analyse, they just
# need to be set to *something* so the modules don't crash the build. Real
# values come from docker-compose's env_file at runtime, not from here.
ENV DATABASE_URL=/tmp/build-placeholder.db
ENV ORIGIN=http://localhost:3000
ENV BETTER_AUTH_SECRET=build-placeholder-not-used-at-runtime
ENV GITHUB_CLIENT_ID=build-placeholder
ENV GITHUB_CLIENT_SECRET=build-placeholder
RUN pnpm build

# ---- runtime ----
# Same base image as the build stage on purpose: copying node_modules across stages
# is only safe when both sides agree on platform/libc, so don't switch to alpine here.
FROM node:24-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/content-toolkit/node_modules ./packages/content-toolkit/node_modules
COPY --from=build /repo/packages/content-toolkit/dist ./packages/content-toolkit/dist
COPY --from=build /repo/packages/content-toolkit/package.json ./packages/content-toolkit/package.json
COPY --from=build /repo/build ./build
COPY --from=build /repo/package.json ./package.json
# Needed at container startup, not at build time — drizzle-kit reads these to apply
# any pending migrations against the real DATABASE_URL before the server starts.
COPY --from=build /repo/drizzle ./drizzle
COPY --from=build /repo/drizzle.config.ts ./drizzle.config.ts

# Applies any pending migrations against the mounted SQLite file before starting the
# server, so a new schema (like this repo's drizzle/*.sql) always lands in production
# without a manual migrate step. If migrate fails the container exits instead of
# serving against a stale schema.
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit migrate && node build/index.js"]
