# =====================================
# Dependencies Stage
# =====================================
FROM node:18-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

WORKDIR /app

# Copy package files and Yarn configuration
COPY package.json yarn.lock ./
COPY .yarnrc.yml* ./

# Ensure nodeLinker is set to node-modules
RUN echo "nodeLinker: node-modules" >> .yarnrc.yml

# Install dependencies only
RUN yarn install --immutable

# =====================================
# Builder Stage
# =====================================
FROM node:18-alpine AS builder

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

WORKDIR /app

# Copy package files and Yarn configuration
COPY package.json yarn.lock ./
COPY .yarnrc.yml* ./

# Ensure nodeLinker is set to node-modules
RUN echo "nodeLinker: node-modules" >> .yarnrc.yml

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production

# Build the application
RUN yarn build

# Clean up unnecessary files
RUN yarn cache clean && \
    rm -rf src tests .git .gitignore README.md || true

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

# Enable Corepack for Yarn 4.0 support
RUN corepack enable && corepack prepare yarn@4.0.0 --activate

# Copy package files and Yarn configuration
COPY package.json yarn.lock ./
COPY .yarnrc.yml* ./

# Ensure nodeLinker is set to node-modules
RUN echo "nodeLinker: node-modules" >> .yarnrc.yml

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=backend:nodejs /app/dist ./dist

# Copy prisma files for runtime
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma

# Install production dependencies only using Yarn 4 approach
RUN yarn install --immutable && \
    yarn cache clean && \
    rm -rf /tmp/* /var/cache/apk/* || true

# Copy generated Prisma client from builder
COPY --from=builder --chown=backend:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create necessary directories and fix permissions
RUN mkdir -p logs temp && \
    chown -R backend:nodejs . logs temp node_modules

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
