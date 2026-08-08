# --- deps + build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 5000
CMD ["node", "dist/server.js"]
