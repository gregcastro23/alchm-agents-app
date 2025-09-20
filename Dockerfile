# Planetary Agents Frontend - Next.js Multi-stage Dockerfile
# Optimized for production deployment with security and performance

# =====================================
# Dependencies Stage
# =====================================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

# Enable Corepack for Yarn 4.0.0 support
RUN corepack enable

WORKDIR /app

# Copy package files and yarn configuration
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .yarnrc.yml* ./

# Install dependencies based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# =====================================
# Builder Stage
# =====================================
FROM node:18-alpine AS builder

# Enable Corepack for Yarn 4.0.0 support
RUN corepack enable

WORKDIR /app

# Copy package.json and yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client
RUN npx prisma generate

# Build the application
# Increase memory limit for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN yarn build

# =====================================
# Runner Stage (Production)
# =====================================
FROM node:18-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --gid 1001 --system nodejs
RUN adduser --system nextjs --uid 1001

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy Next.js build artifacts
COPY --from=builder /app/public ./public

# Create .next directory and set ownership
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Next.js production files with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/api/health', timeout: 3000 }; const request = http.request(options, (res) => { if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } }); request.on('error', () => process.exit(1)); request.on('timeout', () => process.exit(1)); request.end();" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]