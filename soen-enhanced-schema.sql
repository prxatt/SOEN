-- Soen Enhanced Database Schema
-- Comprehensive schema for Soen AI-powered productivity app
-- Based on current implementation with strategic enhancements

-- ============================================
-- EXTENSIONS & SETUP
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- USER PROFILES & AUTHENTICATION (Enhanced)
-- ============================================

-- Enhanced profiles table with Soen-specific features
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    
    -- Subscription & Usage (from our AI routing strategy)
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    
    -- Mira AI Personality Evolution (from our current implementation)
    mira_personality_mode TEXT DEFAULT 'supportive' CHECK (mira_personality_mode IN ('supportive', 'tough_love', 'analytical', 'motivational')),
    mira_voice_preference TEXT DEFAULT 'neutral' CHECK (mira_voice_preference IN ('neutral', 'energetic', 'calm', 'professional')),
    mira_relationship_level INTEGER DEFAULT 1 CHECK (mira_relationship_level BETWEEN 1 AND 10),
    interaction_patterns JSONB DEFAULT '{}', -- Learning about user behavior
    
    -- AI Usage Tracking (from our cost optimization strategy)
    daily_ai_requests INTEGER DEFAULT 0,
    monthly_ai_requests INTEGER DEFAULT 0,
    last_ai_request_reset DATE DEFAULT CURRENT_DATE,
    total_ai_cost_cents INTEGER DEFAULT 0,
    
    -- User Preferences (from our Settings.tsx)
    preferences JSONB DEFAULT jsonb_build_object(
        'briefing_time', '07:00',
        'theme', 'obsidian',
        'ui_mode', 'glass',
        'focus_background', 'synthwave',
        'notifications_enabled', true,
        'browser_push_enabled', false,
        'active_theme', 'obsidian'
    ),
    
    -- Gamification (from our Rewards system)
    soen_flow_points INTEGER DEFAULT 500,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    purchased_rewards TEXT[] DEFAULT ARRAY['theme-obsidian', 'focus-synthwave'],
    
    -- Privacy & Security
    encryption_key_hash TEXT,
    data_retention_days INTEGER DEFAULT 365,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- MIRA AI CHAT SYSTEM (New - Enhanced from our AI services)
-- ============================================

CREATE TABLE IF NOT EXISTS mira_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    
    -- Conversation Context
    context_summary TEXT, -- AI-generated summary after 10+ messages
    topics TEXT[], -- Auto-extracted topics
    referenced_tasks UUID[], -- Tasks discussed
    referenced_notes UUID[], -- Notes discussed
    
    -- Emotional Intelligence
    user_emotional_state TEXT, -- detected: 'stressed', 'motivated', 'confused', 'focused'
    mira_adaptation_mode TEXT, -- how Mira adjusted personality
    
    -- Privacy
    is_encrypted BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mira_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES mira_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'mira')),
    
    -- Message Content (encrypted)
    content_encrypted TEXT NOT NULL,
    content_iv TEXT, -- initialization vector for AES-256-GCM
    content_plaintext TEXT, -- Only if user opts out of encryption
    
    -- Attachments (from our current ChatMessage type)
    attachment JSONB, -- {type: 'image'|'file', base64: string, mimeType: string, url: string}
    
    -- AI Metadata (from our AI routing strategy)
    model_used TEXT, -- 'gpt-4o-mini', 'claude-haiku', etc.
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    cost_cents INTEGER DEFAULT 0,
    
    -- Citations & Sources (pill-shaped tabs in UI)
    sources JSONB DEFAULT '[]', -- [{title, url, relevance, icon}]
    
    -- Embeddings for semantic search
    embedding VECTOR(1536),
    
    -- Real-time transcription data (for voice)
    transcription_data JSONB, -- {words: [{text, start, end, confidence}]}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TASKS & SCHEDULE (Enhanced from our current implementation)
-- ============================================

-- Enhanced tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Info (from our current Task type)
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    category TEXT NOT NULL,
    
    -- Scheduling
    start_time TIMESTAMPTZ,
    planned_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes (after completion)
    end_time TIMESTAMPTZ GENERATED ALWAYS AS (start_time + (planned_duration || ' minutes')::INTERVAL) STORED,
    
    -- Status & Priority (from our current implementation)
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Cancelled')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    
    -- Location & Links
    location TEXT,
    location_coordinates POINT,
    is_virtual BOOLEAN DEFAULT FALSE,
    linked_url TEXT, -- Google Meet, Zoom, etc.
    reference_url TEXT,
    
    -- Relationships
    project_id UUID REFERENCES projects(id),
    linked_note_id UUID REFERENCES notes(id),
    
    -- AI Enhancements (from our Mira AI services)
    ai_generated_insights JSONB, -- From our triggerInsightGeneration
    ai_suggested_resources JSONB DEFAULT '[]', -- Videos, articles, courses
    ai_key_takeaways TEXT[],
    ai_difficulty_estimate INTEGER CHECK (ai_difficulty_estimate BETWEEN 1 AND 10),
    ai_optimal_time TEXT, -- "Morning when focused", etc.
    is_generating_insights BOOLEAN DEFAULT FALSE,
    
    -- Vision AI extracted data (from our vision services)
    extracted_from_image BOOLEAN DEFAULT FALSE,
    source_image_url TEXT,
    ocr_confidence DECIMAL(3,2),
    
    -- Calendar Integration
    google_calendar_event_id TEXT,
    notion_page_id TEXT,
    repeat_pattern TEXT DEFAULT 'none',
    
    -- Completion Data (from our CompletionSummary)
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_summary JSONB, -- {achievements, reflections, nextSteps}
    completion_image_url TEXT, -- AI-generated celebration image
    flow_points_earned INTEGER DEFAULT 0,
    
    -- Recipe/Course Context
    recipe_query TEXT,
    course_links TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- NOTES SYSTEM (Enhanced from our current implementation)
-- ============================================

-- Enhanced notebooks table
CREATE TABLE IF NOT EXISTS notebooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    
    -- Notion Integration (from our Notion sync)
    notion_database_id TEXT,
    notion_sync_enabled BOOLEAN DEFAULT FALSE,
    last_notion_sync TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
    
    -- Content (from our current Note type)
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML format
    content_encrypted TEXT,
    content_iv TEXT,
    
    -- Metadata
    flagged BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    
    -- AI Features (from our Mira AI services)
    ai_summary TEXT,
    ai_key_takeaways TEXT[],
    ai_action_items TEXT[],
    ai_related_resources JSONB DEFAULT '[]', -- Slash command generated
    ai_generated_mindmap JSONB,
    ai_autofill_suggestion TEXT, -- For slash command autofill
    
    -- Learning Context
    course_links TEXT[],
    study_material_type TEXT CHECK (study_material_type IN ('lecture', 'reading', 'course', 'research', 'meeting_notes', 'brainstorm')),
    
    -- Handwriting Recognition (from our vision services)
    source_type TEXT DEFAULT 'typed' CHECK (source_type IN ('typed', 'handwritten', 'voice', 'imported')),
    original_image_url TEXT,
    ocr_confidence DECIMAL(3,2),
    ocr_processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Notion Sync (from our Notion integration)
    notion_page_id TEXT,
    notion_sync_enabled BOOLEAN DEFAULT FALSE,
    notion_last_synced TIMESTAMP WITH TIME ZONE,
    
    -- Vector embeddings for semantic search
    embedding VECTOR(1536),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROJECTS & GOALS (Enhanced from our current implementation)
-- ============================================

-- Enhanced projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Progress
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'On Hold', 'Cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    
    -- Relationships
    note_ids UUID[],
    task_ids UUID[],
    
    -- AI Insights (from our Mira AI services)
    ai_generated_ideas JSONB DEFAULT '[]',
    ai_project_analysis JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    term TEXT DEFAULT 'Short-term' CHECK (term IN ('Short-term', 'Medium-term', 'Long-term')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    target_date DATE,
    
    -- Progress tracking
    milestones JSONB DEFAULT '[]',
    completion_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- AI USAGE & COST TRACKING (From our AI routing strategy)
-- ============================================

-- Create ai_usage_logs table with error handling
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        
        -- Request Details (from our Mira AI services)
        model_used TEXT NOT NULL,
        operation_type TEXT NOT NULL, -- 'chat', 'vision', 'voice', 'note_generation', 'task_parsing', etc.
        feature_used TEXT, -- 'mira_chat', 'slash_command', 'strategic_briefing', 'mindmap', etc.
        
        -- Cost Tracking (from our cost optimization)
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        cost_cents INTEGER DEFAULT 0, -- Actual cost in cents
        
        -- Performance
        latency_ms INTEGER,
        cache_hit BOOLEAN DEFAULT FALSE,
        fallback_used BOOLEAN DEFAULT FALSE, -- If primary model failed
        
        -- Quality Metrics
        user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'neutral')),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'ai_usage_logs table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create ai_usage_logs table: %', SQLERRM;
END $$;

-- Daily aggregation for dashboard
CREATE TABLE IF NOT EXISTS daily_ai_usage_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Aggregated Stats
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    
    -- By Model
    usage_by_model JSONB DEFAULT '{}', -- {model_name: {requests, tokens, cost}}
    
    -- By Feature
    usage_by_feature JSONB DEFAULT '{}',
    
    UNIQUE(user_id, date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STRATEGIC BRIEFINGS (From our Mira AI services)
-- ============================================

CREATE TABLE IF NOT EXISTS strategic_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Briefing Content
    content JSONB NOT NULL, -- Full briefing structure
    
    -- Generation Metadata
    model_used TEXT,
    generation_time_ms INTEGER,
    
    -- Engagement Metrics
    opened_at TIMESTAMP WITH TIME ZONE,
    actions_taken INTEGER DEFAULT 0,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================
-- HEALTH DATA (From our healthDataService)
-- ============================================

CREATE TABLE IF NOT EXISTS health_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    
    -- Workout Data
    total_workouts INTEGER DEFAULT 0,
    total_workout_minutes INTEGER DEFAULT 0,
    workout_types JSONB DEFAULT '{}', -- {type: count}
    
    -- Sleep Data
    avg_sleep_hours DECIMAL(3,1),
    sleep_quality TEXT CHECK (sleep_quality IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Energy & Wellness
    energy_level TEXT CHECK (energy_level IN ('very_high', 'high', 'medium', 'low', 'very_low')),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    mood TEXT,
    
    -- Activity Data
    steps_today INTEGER,
    active_minutes INTEGER,
    calories_burned INTEGER,
    
    -- Biometric Data
    heart_rate INTEGER,
    hrv INTEGER, -- Heart rate variability
    resting_heart_rate INTEGER,
    
    -- Apple Health / Google Fit sync
    data_source TEXT CHECK (data_source IN ('apple_health', 'google_fit', 'manual')),
    last_synced TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'ai_insight')),
    
    -- Action button (optional)
    action_label TEXT,
    action_data JSONB, -- Data needed to execute action
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent_push BOOLEAN DEFAULT FALSE,
    
    -- Delivery
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS (From our current implementation)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Mira Messages
CREATE INDEX IF NOT EXISTS idx_mira_messages_conversation ON mira_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mira_messages_created ON mira_messages(created_at DESC);

-- Create embedding index only if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mira_messages' AND column_name = 'embedding' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_mira_messages_embedding ON mira_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_start ON tasks(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_id ON tasks(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;

-- Create notion index only if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'notion_page_id' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_tasks_notion_id ON tasks(notion_page_id) WHERE notion_page_id IS NOT NULL;
    END IF;
END $$;

-- Notes
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_flagged ON notes(user_id, flagged) WHERE flagged = TRUE AND deleted_at IS NULL;

-- Create embedding index only if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'embedding' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

-- AI Usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_logs(model_used, created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optimized
-- ============================================

-- Verify all tables exist before enabling RLS
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY['profiles', 'mira_conversations', 'mira_messages', 'tasks', 'notebooks', 'notes', 'projects', 'goals', 'ai_usage_logs', 'daily_ai_usage_summary', 'strategic_briefings', 'health_data', 'notifications', 'audit_logs'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing tables before RLS setup: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All tables verified before RLS setup';
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ai_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid duplicates (safe approach)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies from all tables we're about to create
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'mira_conversations', 'mira_messages', 'tasks', 'notebooks', 'notes', 'projects', 'goals', 'ai_usage_logs', 'daily_ai_usage_summary', 'strategic_briefings', 'health_data', 'notifications', 'audit_logs')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                policy_record.policyname, 
                policy_record.schemaname, 
                policy_record.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if table doesn't exist
                NULL;
        END;
    END LOOP;
END $$;

-- RLS Policies: Users can only access their own data (optimized with SELECT auth)
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own conversations" ON mira_conversations FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own messages" ON mira_messages FOR ALL 
  USING ((SELECT auth.uid()) = (SELECT user_id FROM mira_conversations WHERE id = conversation_id));
CREATE POLICY "Users access own tasks" ON tasks FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own notebooks" ON notebooks FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own notes" ON notes FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own projects" ON projects FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own goals" ON goals FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own usage" ON ai_usage_logs FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own daily usage" ON daily_ai_usage_summary FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own briefings" ON strategic_briefings FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own health" ON health_data FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own notifications" ON notifications FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users access own audit logs" ON audit_logs FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply to relevant tables (drop existing triggers first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_notebooks_updated_at ON notebooks;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON mira_conversations;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON notebooks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON mira_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enhanced user profile creation with error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Create user profile safely
  BEGIN
    INSERT INTO public.profiles (user_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the signup
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Create default notebook safely
  BEGIN
    INSERT INTO public.notebooks (user_id, title, color, created_at, updated_at)
    VALUES (NEW.id, 'My Notebook', '#3B82F6', NOW(), NOW());
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the signup
      RAISE WARNING 'Failed to create default notebook for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;
CREATE TRIGGER create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Reset daily AI request counter at midnight
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

-- Function to calculate streak (from our gamification)
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_last_activity DATE;
    v_current_streak INTEGER;
BEGIN
    SELECT last_activity_date, current_streak 
    INTO v_last_activity, v_current_streak
    FROM profiles 
    WHERE user_id = p_user_id;
    
    IF v_last_activity = CURRENT_DATE THEN
        -- Already updated today
        RETURN;
    ELSIF v_last_activity = CURRENT_DATE - 1 THEN
        -- Continue streak
        UPDATE profiles 
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = CURRENT_DATE
        WHERE user_id = p_user_id;
    ELSE
        -- Streak broken
        UPDATE profiles 
        SET current_streak = 1,
            last_activity_date = CURRENT_DATE
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- Automatically update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE mira_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_on_message ON mira_messages;
CREATE TRIGGER update_conversation_on_message 
    AFTER INSERT ON mira_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.mira_conversations TO authenticated;
GRANT ALL ON public.mira_messages TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.notebooks TO authenticated;
GRANT ALL ON public.notes TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.goals TO authenticated;
GRANT ALL ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.strategic_briefings TO authenticated;
GRANT ALL ON public.health_data TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Grant permissions to anon users (for signup)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.profiles TO anon;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Soen Enhanced Database Schema created successfully!';
  RAISE NOTICE '🚀 Features implemented:';
  RAISE NOTICE '   - Enhanced user profiles with Mira AI personality';
  RAISE NOTICE '   - Mira AI chat system with conversations and messages';
  RAISE NOTICE '   - Enhanced tasks with AI insights and vision AI';
  RAISE NOTICE '   - Enhanced notes with AI features and embeddings';
  RAISE NOTICE '   - AI usage tracking and cost optimization';
  RAISE NOTICE '   - Strategic briefings and health data';
  RAISE NOTICE '   - Notifications and audit logging';
  RAISE NOTICE '   - Optimized RLS policies for performance';
  RAISE NOTICE '   - Comprehensive indexing for scale';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready for Soen AI-powered productivity!';
END $$;
