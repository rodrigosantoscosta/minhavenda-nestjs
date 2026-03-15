# Dockerfile — MinhaVenda NestJS
# Multi-stage build: builder → production

# ─── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Build the NestJS application
RUN pnpm run build

# ─── Stage 2: production ──────────────────────────────────────────────────────
FROM node:24-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy manifests and install production deps — owned by appuser from the start
COPY --chown=appuser:appgroup package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

USER appuser

# Port exposed by the NestJS app
EXPOSE 3000

# Health check — relies on the /health endpoint (or the root if absent)
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
