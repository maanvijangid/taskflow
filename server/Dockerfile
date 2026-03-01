# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code
COPY src ./src

RUN npm ci

# Generate prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build


# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8800

RUN addgroup --system nodejs && adduser --system expressjs

# Copy production files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./prisma

USER expressjs

EXPOSE 8800

CMD ["npm", "start"]