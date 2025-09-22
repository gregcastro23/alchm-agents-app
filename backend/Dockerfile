# =====================================
# Dependencies Stage
# =====================================
FROM node:18-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies only
RUN yarn install --frozen-lockfile --production=false

# =====================================
# Builder Stage
# =====================================
FROM node:18-alpine AS builder

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production

# Build the application
RUN yarn build

# Remove dev dependencies after build
RUN yarn install --production --frozen-lockfile && yarn cache clean

# =====================================
# Production Stage
# =====================================
FROM node:18-alpine AS production

WORKDIR /app

# Install required packages for production
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && update-ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

# Copy package files and install production dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=backend:nodejs /app/dist ./dist

# Create necessary directories with proper permissions
RUN mkdir -p logs temp && \
    chown -R backend:nodejs logs temp

# Copy health check script
COPY --chown=backend:nodejs scripts/health-check.js ./scripts/

# Switch to non-root user
USER backend

# Set production environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expose ports
EXPOSE 8000 8001

# Health check using dedicated script
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node scripts/health-check.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
