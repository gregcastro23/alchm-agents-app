#!/bin/bash
# Setup Neon Database for Planetary Agents
# Run this after creating your Neon project

set -e  # Exit on any error

echo "🗄️  Setting up Neon Database for Planetary Agents"
echo "=================================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "❌ ERROR: DATABASE_URL not set"
    echo ""
    echo "Please set it first:"
    echo 'export DATABASE_URL="postgresql://neondb_owner:npg_J8CabeXrf5Od@ep-mute-thunder-ahui2n87-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"'
    echo ""
    exit 1
fi

echo ""
echo "✓ DATABASE_URL is set"
echo ""

# Step 1: Test connection
echo "📡 Step 1: Testing database connection..."
if npx prisma db pull --force > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your DATABASE_URL is correct"
    echo "2. Verify your Neon database is active (not suspended)"
    echo "3. Check your internet connection"
    exit 1
fi

# Step 2: Run migrations
echo ""
echo "🔧 Step 2: Running migrations to create tables..."
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully!"
else
    echo "❌ Migration failed"
    echo ""
    echo "This might happen if:"
    echo "1. Migrations were already applied"
    echo "2. There's a schema conflict"
    echo ""
    echo "Try: npx prisma migrate reset --force"
    exit 1
fi

# Step 3: Generate Prisma Client
echo ""
echo "⚙️  Step 3: Generating Prisma Client..."
if npx prisma generate; then
    echo "✅ Prisma Client generated!"
else
    echo "❌ Prisma Client generation failed"
    exit 1
fi

# Step 4: Verify setup
echo ""
echo "🔍 Step 4: Verifying database setup..."
TABLES=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
EOF
)

echo "✅ Database setup complete!"
echo ""
echo "=================================================="
echo "📊 Database Summary"
echo "=================================================="
echo "Provider: Neon (PostgreSQL)"
echo "Region: US East 1"
echo "Status: ✅ Connected and migrated"
echo ""
echo "Next steps:"
echo "1. Save DATABASE_URL for Render deployment"
echo "2. Continue with Render deployment (Step 3)"
echo ""
echo "Your DATABASE_URL (save this for Render):"
echo "$DATABASE_URL"
echo ""
