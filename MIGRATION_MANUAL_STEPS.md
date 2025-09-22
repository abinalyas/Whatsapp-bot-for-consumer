# Manual Migration Steps

Since the automatic migration endpoint might not be deployed yet, here are the manual steps to fix the database schema issues:

## Option 1: Using Database Console (Recommended)

1. **Go to your Neon/Vercel Postgres console**
2. **Run these SQL commands one by one:**

```sql
-- Add payment_reference column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add created_at column to services table  
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add created_at column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
```

## Option 2: Using Migration Endpoint (Once Deployed)

Once the deployment is complete, you can run:

```bash
curl -X POST https://whatsapp-bot-for-consumer.vercel.app/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "migrate_fix_2024"}'
```

## Option 3: Using Local Migration Script

If you have the database URL locally:

```bash
# Set your database URL
export DATABASE_URL="your_neon_postgres_url"

# Run the migration script
npm run migrate up 0004_add_missing_columns
```

## Verification

After running the migration, these errors should disappear from your Vercel logs:
- ❌ `Error fetching today's bookings: error: column "payment_reference" does not exist`
- ❌ `Error fetching services: error: column "created_at" does not exist`  
- ❌ `Error fetching bookings: error: column "payment_reference" does not exist`

## Current Status

✅ **Build Issues Fixed** - Local build should now work without TypeScript errors
✅ **Salon Flow Added** - Complete salon flow with 8 connected nodes
✅ **Connection System Fixed** - Visual connections should render properly
⏳ **Migration Pending** - Database schema needs to be updated manually

## Next Steps

1. **Run the migration** using Option 1 above
2. **Check the salon flow** at: https://whatsapp-bot-for-consumer.vercel.app/bot-flows/current_salon_flow
3. **Test connections** by clicking the link icon and connecting nodes
4. **Verify demo flow** works end-to-end

The salon flow should show as "🟢 Current Salon Flow (ACTIVE)" in the bot flows list once the deployment completes.