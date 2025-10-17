-- Migration: Add increment_ai_requests RPC function
-- This migration adds the missing RPC function that the AI orchestrator needs

-- First, ensure we have the reset function (in case it doesn't exist)
CREATE OR REPLACE FUNCTION reset_daily_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE profiles
    SET daily_ai_requests = 0,
        last_ai_request_reset = CURRENT_DATE
    WHERE last_ai_request_reset < CURRENT_DATE;
END;
$$;

-- Add the missing increment_ai_requests function
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_ai_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_ai_requests() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_ai_requests(UUID) IS 'Increments the daily and monthly AI request counters for a user. Automatically resets daily counter if needed.';
COMMENT ON FUNCTION reset_daily_ai_requests() IS 'Resets daily AI request counters for all users when called. Should be run daily via cron job.';
