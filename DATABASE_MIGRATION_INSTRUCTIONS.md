# Database Migration Instructions

## Apply the increment_ai_requests RPC Function

The `increment_ai_requests` RPC function exists in your schema files but needs to be applied to your Supabase database.

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/add_increment_ai_requests_function.sql`
4. Click **Run** to execute the migration

### Option 2: Apply via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase db reset --linked
```

### Option 3: Apply via psql (if you have direct database access)

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/add_increment_ai_requests_function.sql
```

### Verify the Fix

After applying the migration, you can verify it works by running:

```bash
npm run test:rpc
```

Or test manually in the Supabase SQL Editor:

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'increment_ai_requests';

-- Test the function (replace with actual user ID)
SELECT increment_ai_requests('your-user-id-here');
```

### What the Migration Does

The migration creates:
1. `reset_daily_ai_requests()` function - resets daily counters
2. `increment_ai_requests(p_user_id UUID)` function - increments user counters
3. Proper permissions for authenticated users
4. Documentation comments

### Expected Behavior After Fix

- ✅ No more "function does not exist" errors
- ✅ User AI request counts will increment properly
- ✅ Daily counters will reset automatically
- ✅ Monthly counters will accumulate correctly
