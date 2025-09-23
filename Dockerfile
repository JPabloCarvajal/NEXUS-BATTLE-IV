# ================================
# Build Stage
# ================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY . .

# Install all dependencies (including dev)
RUN npm ci --include=dev

# Build the application
RUN npm run build

# ================================
# Runtime Stage
# ================================
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install runtime dependencies
RUN apk add --no-cache \
    tini \
    dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app


# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app ./

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["npm", "run", "dev"]