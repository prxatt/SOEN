# Bug Fix: Missing RPC Function `increment_ai_requests`

## Problem Description
The AI Orchestrator was calling the `increment_ai_requests` RPC function to update user AI request counts, but this function was not defined in the database schema. This caused runtime errors and prevented user request counts from updating properly.

## Error Details
```typescript
// In api/ai/chat.ts (line 142)
await supabase.rpc('increment_ai_requests', { p_user_id: userId });
```

**Error**: `function increment_ai_requests(uuid) does not exist`

## Root Cause
The database schema (`soen-enhanced-schema.sql`) was missing the `increment_ai_requests` RPC function, even though the application code was trying to call it.

## Solution Implemented

### 1. Added Missing RPC Function
Added the `increment_ai_requests` function to the database schema:

```sql
CREATE OR REPLACE FUNCTION increment_ai_requests(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    -- First, reset daily counter if needed
    PERFORM reset_daily_ai_requests();
    
    -- Increment the user's daily AI request count
    UPDATE profiles
    SET daily_ai_requests = daily_ai_requests + 1,
        monthly_ai_requests = monthly_ai_requests + 1,
        last_activity_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    
    -- If no rows were updated, the user doesn't exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found', p_user_id;
    END IF;
END;
$$;
```

### 2. Function Features
- **Automatic Reset**: Calls `reset_daily_ai_requests()` to reset daily counters if needed
- **Dual Increment**: Increments both `daily_ai_requests` and `monthly_ai_requests`
- **Activity Tracking**: Updates `last_activity_date` for streak calculation
- **Error Handling**: Raises exception if user doesn't exist
- **Security**: Uses `SECURITY DEFINER` for proper permissions

### 3. Created Migration Script
- **File**: `migrations/add_increment_ai_requests_function.sql`
- **Purpose**: Apply the function to existing databases
- **Includes**: Function definition, permissions, and documentation

### 4. Added Test Script
- **File**: `test-increment-function.js`
- **Purpose**: Verify the RPC function works correctly
- **Usage**: `npm run test:rpc`

## Files Modified

### Updated Files:
- `soen-enhanced-schema.sql` - Added `increment_ai_requests` function
- `package.json` - Added `test:rpc` script

### Created Files:
- `migrations/add_increment_ai_requests_function.sql` - Migration script
- `test-increment-function.js` - Test script

## How to Apply the Fix

### For New Databases:
The function is now included in the main schema file, so new databases will have it automatically.

### For Existing Databases:
Run the migration script:
```sql
-- Execute the migration
\i migrations/add_increment_ai_requests_function.sql
```

### Testing the Fix:
```bash
# Test the RPC function
npm run test:rpc
```

## Verification Steps

1. **Check Function Exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'increment_ai_requests';
   ```

2. **Test Function Call**:
   ```sql
   SELECT increment_ai_requests('your-user-id-here');
   ```

3. **Verify Counts Updated**:
   ```sql
   SELECT daily_ai_requests, monthly_ai_requests 
   FROM profiles 
   WHERE user_id = 'your-user-id-here';
   ```

## Impact
- ✅ **AI request counting now works properly**
- ✅ **User quota enforcement functions correctly**
- ✅ **Monthly usage tracking is accurate**
- ✅ **No more runtime errors from missing RPC function**

## Related Functions
The `increment_ai_requests` function works in conjunction with:
- `reset_daily_ai_requests()` - Resets daily counters
- `update_user_streak()` - Calculates user streaks
- `create_user_profile()` - Creates user profiles

## Security Considerations
- Function uses `SECURITY DEFINER` for proper permissions
- Only authenticated users can execute the function
- Function validates user existence before updating
- Uses parameterized queries to prevent SQL injection
