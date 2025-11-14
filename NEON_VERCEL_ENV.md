# Neon Database - Vercel Environment Variables

## ✅ Connection Verified
- Database: `neondb`
- Host: `ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech`
- Region: `us-east-1` (AWS)
- Status: **ACTIVE** ✓

## 🔑 Environment Variables for Vercel

### Required Variables

Add these to your Vercel project environment variables (Settings → Environment Variables):

```bash
# Primary Database Connection (Prisma Accelerate - Global Edge Caching)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18td3VSbzZMendSS2tiVUNVUjl6R2QiLCJhcGlfa2V5IjoiMDFLN0dRNERENFJSQjI4QVE4U1BZRFpFVEUiLCJ0ZW5hbnRfaWQiOiI2YmI2MGYzNTUxY2Q1OGMxZDMwYWY5ZmM5YzRiM2FiOTcyZmI5ZThmY2Y3NDdjMzM4NDdjYWIxYmU5YmIzMzVjIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2RlZDYwNTYtYTI5Zi00YTljLThmN2EtZWQ4MmU2YmY3MjZmIn0.CRh4PfsKi-bRJY_ixC-xN-i7WrgOa2Jrr7eblH10uTs

# Direct Database Connection (Pooled - for migrations and Prisma commands)
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15

# Direct Database Connection (Non-Pooled - for migrations only)
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Additional Recommended Variables

```bash
# Node Environment
NODE_ENV=production

# Redis (if using - may need to update)
REDIS_URL=your_redis_url_here

# Backend URL (if separate backend service)
BACKEND_URL=your_backend_url_here
NEXT_PUBLIC_BACKEND_URL=your_backend_url_here

# AI API Keys (already configured in Vercel)
ANTHROPIC_API_KEY=sk-ant-api03-***
OPENAI_API_KEY=sk-***
GALILEO_API_KEY=q01AM1oNTjbStxEaiHx44gKLg0FUCd-yzmk4hV55pjU
GALILEO_PROJECT=1e7fd4a1-3e28-4fe1-a719-744f239a13be
GALILEO_LOG_STREAM=6ed50263-a348-4ad6-ab63-bd04d3a4ffdd

# Claude Configuration
CLAUDE_DEFAULT_MODEL=claude-3-opus-20240229
CLAUDE_FAST_MODEL=claude-3-5-haiku-20241022

# Monica Configuration
MONICA_DEFAULT_MODEL=gpt-4o-mini
MONICA_TEMPERATURE=0.4

# Feature Flags
NEXT_PUBLIC_BETA_MODE=true
NEXT_PUBLIC_FEEDBACK_ENABLED=true
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ACCESSIBILITY_MODE=true
NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS=false

# RAG Configuration
USE_RAG_GENERATION=true
USE_VECTOR_SEARCH=true
USE_RAG_CACHE=true

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

## 📋 Copy-Paste Format for Vercel CLI

If using Vercel CLI, you can set variables like this:

```bash
# Set Prisma Accelerate URL (primary - with global edge caching)
vercel env add DATABASE_URL production
# Paste: prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18td3VSbzZMendSS2tiVUNVUjl6R2QiLCJhcGlfa2V5IjoiMDFLN0dRNERENFJSQjI4QVE4U1BZRFpFVEUiLCJ0ZW5hbnRfaWQiOiI2YmI2MGYzNTUxY2Q1OGMxZDMwYWY5ZmM5YzRiM2FiOTcyZmI5ZThmY2Y3NDdjMzM4NDdjYWIxYmU5YmIzMzVjIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2RlZDYwNTYtYTI5Zi00YTljLThmN2EtZWQ4MmU2YmY3MjZmIn0.CRh4PfsKi-bRJY_ixC-xN-i7WrgOa2Jrr7eblH10uTs

# Set Direct Database URLs (for migrations)
vercel env add POSTGRES_PRISMA_URL production
# Paste: postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15

vercel env add POSTGRES_URL_NON_POOLING production
# Paste: postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🎯 Key Connection Details

### Prisma Accelerate Connection (Use for app runtime - RECOMMENDED)
- **URL**: `accelerate.prisma-data.net`
- **Protocol**: `prisma+postgres://`
- **Features**:
  - Global edge caching
  - Connection pooling
  - Query acceleration
  - Automatic scaling
- **Best for**: Production runtime, API routes, serverless functions

### Pooled Connection (Alternative for app runtime)
- **URL**: `ep-mute-thunder-ahui2n87-pooler.c-3.us-east-1.aws.neon.tech`
- **Port**: `5432`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **SSL Mode**: `require`
- **PgBouncer**: Enabled (for connection pooling)
- **Best for**: Direct database access without Accelerate

### Direct Connection (Use for migrations only)
- **URL**: `ep-mute-thunder-ahui2n87.us-east-1.aws.neon.tech`
- **Port**: `5432`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **SSL Mode**: `require`
- **Best for**: Prisma migrations, database management, schema changes

## ⚠️ Important Notes

1. **Prisma Accelerate**: Now using Prisma Accelerate for global edge caching and improved performance
   - Automatically handles connection pooling
   - Caches queries at the edge for faster response times
   - Better suited for serverless environments
2. **Migrations**: Use `POSTGRES_URL_NON_POOLING` for Prisma migrations in CI/CD (not Accelerate URL)
3. **Auto-Sleep**: Neon compute auto-sleeps after inactivity (wakes in ~1-2 seconds on first request)
4. **Branch Limits**: You're on 3/10 child branches - plenty of room for staging/preview environments
5. **Security**: These credentials are already exposed in this conversation - consider rotating them after setup
6. **Prisma Client**: Ensure you have `@prisma/client` and `@prisma/extension-accelerate` installed for Accelerate support

## 🚀 Next Steps

1. **Add to Vercel**:
   - Go to https://vercel.com/your-project/settings/environment-variables
   - Add `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, and `DATABASE_URL`
   - Apply to: Production, Preview, Development (or as needed)

2. **Test Deployment**:
   ```bash
   vercel --prod
   ```

3. **Verify in Vercel Logs**:
   - Check that Prisma can connect
   - Look for successful database queries

4. **Monitor in Neon**:
   - Track usage in Neon dashboard
   - Monitor compute hours, storage, and data transfer

## 📊 Current Neon Usage (as of Nov 14, 2025)

- **Compute**: 0.09 CU-hrs
- **Storage**: 34.64 MB
- **Data Transfer**: 537.27 kB
- **Status**: Well within free tier limits ✅

---

Generated: 2025-11-14
Database: Neon PostgreSQL (Serverless)
Region: AWS us-east-1
