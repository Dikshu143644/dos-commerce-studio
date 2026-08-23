# =============================================================================
# StockFlow Frontend - Production Multi-Stage Build
# =============================================================================

# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# Install dependencies first (layer caching)
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0

# Copy source
COPY . .

# Accept VITE_ env vars as build args so they are inlined during the build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_PHP_API_URL
ARG VITE_AI_PROXY_URL

# Build the application
RUN pnpm build

# =============================================================================
# Production stage
# =============================================================================
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration with security headers and SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set correct permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Switch to non-root user
USER appuser

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Graceful shutdown support - nginx handles SIGTERM
STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
