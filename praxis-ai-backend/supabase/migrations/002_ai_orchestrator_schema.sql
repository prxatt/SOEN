-- AI Orchestrator Database Schema Migration
-- Add AI usage tracking, caching, and quota management

-- =============================================
-- AI USAGE TRACKING
-- =============================================

-- AI usage logs table
CREATE TABLE public.ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'kiko_chat',
    'task_parsing',
    'note_generation',
    'note_summary',
    'note_autofill',
    'mindmap_generation',
    'strategic_briefing',
    'vision_ocr',
    'vision_event_detection',
    'calendar_event_parsing',
    'research_with_sources',
    'gmail_event_extraction',
    'completion_summary',
    'completion_image'
  )),
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  cache_hit BOOLEAN DEFAULT false,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  request_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily AI usage summary table
CREATE TABLE public.daily_ai_usage_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  feature_usage JSONB DEFAULT '{}',
  model_usage JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- AI cache table
CREATE TABLE public.ai_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER QUOTA MANAGEMENT
-- =============================================

-- Add daily AI requests counter to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_ai_requests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kiko_personality_mode TEXT DEFAULT 'supportive' CHECK (kiko_personality_mode IN ('supportive', 'tough_love', 'analytical', 'motivational')),
ADD COLUMN IF NOT EXISTS monthly_ai_budget_cents INTEGER DEFAULT 1500; -- $15 default budget

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- AI usage logs indexes
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_feature_type ON public.ai_usage_logs(feature_type);
CREATE INDEX idx_ai_usage_logs_model_used ON public.ai_usage_logs(model_used);

-- Daily summary indexes
CREATE INDEX idx_daily_ai_usage_user_date ON public.daily_ai_usage_summary(user_id, date);
CREATE INDEX idx_daily_ai_usage_date ON public.daily_ai_usage_summary(date);

-- Cache indexes
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_user_id ON public.ai_cache(user_id);
CREATE INDEX idx_ai_cache_expires_at ON public.ai_cache(expires_at);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to increment daily AI requests
CREATE OR REPLACE FUNCTION public.increment_ai_requests(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET daily_ai_requests = daily_ai_requests + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily AI requests (run daily via cron)
CREATE OR REPLACE FUNCTION public.reset_daily_ai_requests()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET daily_ai_requests = 0,
      updated_at = NOW()
  WHERE daily_ai_requests > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily AI usage summary
CREATE OR REPLACE FUNCTION public.update_daily_ai_usage_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_ai_usage_summary (
    user_id,
    date,
    total_requests,
    total_tokens,
    total_cost_cents,
    cache_hits,
    error_count,
    feature_usage,
    model_usage
  )
  VALUES (
    NEW.user_id,
    CURRENT_DATE,
    1,
    NEW.tokens_used,
    NEW.cost_cents,
    CASE WHEN NEW.cache_hit THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    jsonb_build_object(NEW.feature_type, 1),
    jsonb_build_object(NEW.model_used, 1)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_requests = daily_ai_usage_summary.total_requests + 1,
    total_tokens = daily_ai_usage_summary.total_tokens + NEW.tokens_used,
    total_cost_cents = daily_ai_usage_summary.total_cost_cents + NEW.cost_cents,
    cache_hits = daily_ai_usage_summary.cache_hits + CASE WHEN NEW.cache_hit THEN 1 ELSE 0 END,
    error_count = daily_ai_usage_summary.error_count + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    feature_usage = daily_ai_usage_summary.feature_usage || jsonb_build_object(NEW.feature_type, COALESCE(daily_ai_usage_summary.feature_usage->NEW.feature_type, '0')::int + 1),
    model_usage = daily_ai_usage_summary.model_usage || jsonb_build_object(NEW.model_used, COALESCE(daily_ai_usage_summary.model_usage->NEW.model_used, '0')::int + 1),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update daily summary when AI usage is logged
CREATE TRIGGER trigger_update_daily_ai_usage_summary
  AFTER INSERT ON public.ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_ai_usage_summary();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_ai_cache()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.ai_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all AI tables
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ai_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- AI usage logs policies
CREATE POLICY "Users can view their own AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage logs" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (true);

-- Daily summary policies
CREATE POLICY "Users can view their own daily AI usage summary" ON public.daily_ai_usage_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily AI usage summary" ON public.daily_ai_usage_summary
  FOR ALL USING (true);

-- Cache policies
CREATE POLICY "Users can view their own AI cache" ON public.ai_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage AI cache" ON public.ai_cache
  FOR ALL USING (true);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample AI usage log (for testing)
INSERT INTO public.ai_usage_logs (
  user_id,
  feature_type,
  model_used,
  tokens_used,
  cost_cents,
  processing_time_ms,
  cache_hit,
  success
) VALUES (
  (SELECT id FROM public.profiles LIMIT 1),
  'kiko_chat',
  'gpt-4o-mini',
  150,
  1,
  1200,
  false,
  true
) ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.ai_usage_logs IS 'Tracks all AI API usage for cost monitoring and quota management';
COMMENT ON TABLE public.daily_ai_usage_summary IS 'Daily aggregated AI usage statistics for reporting and analytics';
COMMENT ON TABLE public.ai_cache IS 'Caches AI responses to reduce API costs and improve performance';

COMMENT ON COLUMN public.profiles.daily_ai_requests IS 'Daily counter for AI requests (reset daily)';
COMMENT ON COLUMN public.profiles.kiko_personality_mode IS 'User preference for Kiko AI personality';
COMMENT ON COLUMN public.profiles.monthly_ai_budget_cents IS 'Monthly AI budget in cents (default $15)';
