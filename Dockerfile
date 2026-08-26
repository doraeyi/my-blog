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

CMD ["node", "build/index.js"]
