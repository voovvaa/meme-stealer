# ---------- STAGE 1: DEPENDENCIES ----------
FROM node:20-bullseye-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# ---------- STAGE 2: BUILD ----------
FROM deps AS builder

COPY . .
RUN npm run build

# ---------- STAGE 3: RUNTIME ----------
FROM node:20-bullseye-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/sessions
VOLUME ["/app/sessions"]

CMD ["node", "dist/main.js"]
