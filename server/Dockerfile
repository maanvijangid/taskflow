# Build stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm ci

RUN npx prisma generate
COPY . .

RUN npm run build


# Production stage
FROM node:20

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8800

RUN apt-get update && apt-get install -y openssl

RUN addgroup --system nodejs
RUN adduser --system expressjs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER expressjs

EXPOSE 8800

CMD ["npm", "start"]