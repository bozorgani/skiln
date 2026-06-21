FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node server.js ./server.js
COPY --chown=node:node src ./src
COPY --chown=node:node openapi.yaml ./openapi.yaml
COPY --chown=node:node assets ./assets
RUN mkdir -p uploads/images uploads/videos && chown -R node:node /app/uploads
USER node
EXPOSE 5000
CMD ["node", "server.js"]
