-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- USER PROFILES & AUTHENTICATION
-- ============================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    
    -- Subscription & Usage
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
    subscription_status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    
    -- Kiko Personality Evolution
    kiko_relationship_level INTEGER DEFAULT 1 CHECK (kiko_relationship_level BETWEEN 1 AND 10),
    kiko_personality_mode TEXT DEFAULT 'supportive' CHECK (kiko_personality_mode IN ('supportive', 'tough_love', 'analytical', 'motivational')),
    kiko_voice_preference TEXT DEFAULT 'neutral' CHECK (kiko_voice_preference IN ('neutral', 'energetic', 'calm', 'professional')),
    interaction_patterns JSONB DEFAULT '{}', -- Learning about user behavior
    
    -- AI Usage Tracking
    daily_ai_requests INTEGER DEFAULT 0,
    monthly_ai_requests INTEGER DEFAULT 0,
    last_ai_request_reset DATE DEFAULT CURRENT_DATE,
    
    -- User Preferences (from your current App.tsx)
    preferences JSONB DEFAULT jsonb_build_object(
        'briefing_time', '07:00',
        'theme', 'obsidian',
        'ui_mode', 'glass',
        'focus_background', 'synthwave',
        'notifications_enabled', true,
        'browser_push_enabled', false
    ),
    
    -- Gamification (from your Rewards system)
    praxis_flow_points INTEGER DEFAULT 500,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    purchased_rewards TEXT[] DEFAULT ARRAY['theme-obsidian', 'focus-synthwave'],
    
    -- Privacy & Security
    encryption_key_hash TEXT,
    data_retention_days INTEGER DEFAULT 365,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    onboarding_completed_at TIMESTAMP
);

-- ============================================
-- KIKO CHAT SYSTEM (Enhanced from PraxisAI.tsx)
-- ============================================

CREATE TABLE kiko_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    
    -- Conversation Context
    context_summary TEXT, -- AI-generated summary after 10+ messages
    topics TEXT[], -- Auto-extracted topics
    referenced_tasks UUID[], -- Tasks discussed
    referenced_notes UUID[], -- Notes discussed
    
    -- Emotional Intelligence
    user_emotional_state TEXT, -- detected: 'stressed', 'motivated', 'confused', 'focused'
    kiko_adaptation_mode TEXT, -- how Kiko adjusted personality
    
    -- Privacy
    is_encrypted BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kiko_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES kiko_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'kiko')),
    
    -- Message Content (encrypted)
    content_encrypted TEXT NOT NULL,
    content_iv TEXT, -- initialization vector for AES-256-GCM
    content_plaintext TEXT, -- Only if user opts out of encryption
    
    -- Attachments (from your ChatMessage type)
    attachment JSONB, -- {type: 'image'|'file', base64: string, mimeType: string, url: string}
    
    -- AI Metadata
    model_used TEXT, -- 'gpt-4o-mini', 'claude-haiku', etc.
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    
    -- Citations & Sources (pill-shaped tabs in UI)
    sources JSONB DEFAULT '[]', -- [{title, url, relevance, icon}]
    
    -- Embeddings for semantic search
    embedding VECTOR(1536),
    
    -- Real-time transcription data (for voice)
    transcription_data JSONB, -- {words: [{text, start, end, confidence}]}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASKS & SCHEDULE (from Schedule.tsx)
-- ============================================

CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Info (from your Task type)
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    category TEXT NOT NULL,
    
    -- Scheduling
    start_time TIMESTAMPTZ,
    planned_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes (after completion)
    end_time TIMESTAMPTZ GENERATED ALWAYS AS (start_time + (planned_duration || ' minutes')::INTERVAL) STORED,
    
    -- Status & Priority
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    
    -- Location & Links
    location TEXT,
    location_coordinates POINT,
    is_virtual BOOLEAN DEFAULT FALSE,
    linked_url TEXT, -- Google Meet, Zoom, etc.
    reference_url TEXT,
    
    -- Relationships
    project_id UUID REFERENCES projects(id),
    linked_note_id BIGINT REFERENCES notes(id),
    
    -- AI Enhancements
    ai_generated_insights JSONB, -- From your triggerInsightGeneration
    ai_suggested_resources JSONB DEFAULT '[]', -- Videos, articles, courses
    ai_key_takeaways TEXT[],
    ai_difficulty_estimate INTEGER CHECK (ai_difficulty_estimate BETWEEN 1 AND 10),
    ai_optimal_time TEXT, -- "Morning when focused", etc.
    is_generating_insights BOOLEAN DEFAULT FALSE,
    
    -- Vision AI extracted data
    extracted_from_image BOOLEAN DEFAULT FALSE,
    source_image_url TEXT,
    ocr_confidence DECIMAL(3,2),
    
    -- Calendar Integration
    google_calendar_event_id TEXT,
    notion_page_id TEXT,
    repeat_pattern TEXT DEFAULT 'none',
    
    -- Completion Data (from your CompletionSummary)
    completed_at TIMESTAMP,
    completion_summary JSONB, -- {achievements, reflections, nextSteps}
    completion_image_url TEXT, -- AI-generated celebration image
    flow_points_earned INTEGER DEFAULT 0,
    
    -- Recipe/Course Context
    recipe_query TEXT,
    course_links TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTES SYSTEM (from Notes.tsx)
-- ============================================

CREATE TABLE notebooks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#F59E0B',
    
    -- Notion Integration
    notion_database_id TEXT,
    notion_sync_enabled BOOLEAN DEFAULT FALSE,
    last_notion_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notebook_id BIGINT REFERENCES notebooks(id) ON DELETE SET NULL,
    
    -- Content (from your Note type)
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML format
    content_encrypted TEXT,
    content_iv TEXT,
    
    -- Metadata
    flagged BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    
    -- AI Features
    ai_summary TEXT,
    ai_key_takeaways TEXT[],
    ai_action_items TEXT[],
    ai_related_resources JSONB DEFAULT '[]', -- Slash command generated
    ai_generated_mindmap JSONB,
    ai_autofill_suggestion TEXT, -- For slash command autofill
    
    -- Learning Context
    course_links TEXT[],
    study_material_type TEXT CHECK (study_material_type IN ('lecture', 'reading', 'course', 'research', 'meeting_notes', 'brainstorm')),
    
    -- Handwriting Recognition
    source_type TEXT DEFAULT 'typed' CHECK (source_type IN ('typed', 'handwritten', 'voice', 'imported')),
    original_image_url TEXT,
    ocr_confidence DECIMAL(3,2),
    ocr_processed_at TIMESTAMP,
    
    -- Notion Sync
    notion_page_id TEXT,
    notion_sync_enabled BOOLEAN DEFAULT FALSE,
    notion_last_synced TIMESTAMP,
    
    -- Vector embeddings for semantic search
    embedding VECTOR(1536),
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PROJECTS & GOALS (from Projects.tsx & Profile.tsx)
-- ============================================

CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Progress
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    
    -- Relationships
    note_ids BIGINT[],
    task_ids UUID[],
    
    -- AI Insights
    ai_generated_ideas JSONB DEFAULT '[]',
    ai_project_analysis JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('short', 'mid', 'long')),
    text TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    
    -- Progress tracking
    milestones JSONB DEFAULT '[]',
    completion_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIND MAPS (AI Generated)
-- ============================================

CREATE TABLE mindmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    
    -- Graph Structure
    nodes JSONB NOT NULL, -- [{id, label, type, position: {x, y}, data, color}]
    edges JSONB NOT NULL, -- [{source, target, type, strength, label}]
    
    -- Generation Context
    ai_generated BOOLEAN DEFAULT TRUE,
    generation_context TEXT,
    source_note_ids BIGINT[],
    source_task_ids UUID[],
    source_goal_ids BIGINT[],
    
    last_regenerated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- VOICE CONVERSATIONS
-- ============================================

CREATE TABLE voice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    conversation_id BIGINT REFERENCES kiko_conversations(id),
    
    -- Audio Data
    audio_url TEXT,
    duration_seconds INTEGER,
    
    -- Transcription
    transcript_encrypted TEXT,
    transcript_iv TEXT,
    transcription_confidence DECIMAL(3,2),
    
    -- Real-time transcription data (word-by-word timing)
    realtime_transcription JSONB, -- [{word, start_ms, end_ms, confidence}]
    
    -- Voice Characteristics
    user_emotion_detected TEXT,
    kiko_voice_emotion TEXT, -- How Kiko responded emotionally
    kiko_animation_states JSONB, -- Timeline of Kiko's visual states
    
    -- Voice Service Used
    voice_service_provider TEXT CHECK (voice_service_provider IN ('openai_realtime', 'elevenlabs', 'deepgram')),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GMAIL AGENT & EMAIL PARSING
-- ============================================

CREATE TABLE gmail_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Gmail OAuth tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    
    -- Sync Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_add_events BOOLEAN DEFAULT FALSE, -- Auto-add or require confirmation
    watch_labels TEXT[] DEFAULT ARRAY['INBOX'],
    
    -- Gmail Watch/Webhook
    gmail_watch_expiration TIMESTAMP,
    gmail_history_id TEXT,
    
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gmail_parsed_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    gmail_message_id TEXT NOT NULL,
    
    -- Email Details
    subject TEXT,
    sender TEXT,
    received_at TIMESTAMP,
    email_body_snippet TEXT,
    
    -- AI Extracted Event Data
    event_detected BOOLEAN DEFAULT FALSE,
    event_title TEXT,
    event_date TIMESTAMPTZ,
    event_location TEXT,
    event_confidence DECIMAL(3,2),
    extracted_details JSONB, -- Full AI analysis
    
    -- User Action
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_added')),
    task_id UUID REFERENCES tasks(id),
    
    -- Agent that processed it
    processed_by_agent TEXT DEFAULT 'kiko_gmail_agent',
    
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ============================================
-- NOTION INTEGRATION
-- ============================================

CREATE TABLE notion_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Notion OAuth
    access_token_encrypted TEXT,
    workspace_name TEXT,
    workspace_id TEXT,
    bot_id TEXT,
    
    -- Sync Configuration
    sync_direction TEXT DEFAULT 'praxis_to_notion' CHECK (sync_direction IN ('praxis_to_notion', 'notion_to_praxis', 'bidirectional')),
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency_minutes INTEGER DEFAULT 15,
    
    -- Notebook → Notion Database mapping
    notebook_mappings JSONB DEFAULT '{}', -- {notebook_id: notion_database_id}
    
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notion_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    note_id BIGINT REFERENCES notes(id),
    
    -- Sync Details
    notion_page_id TEXT NOT NULL,
    sync_direction TEXT NOT NULL,
    sync_status TEXT DEFAULT 'success' CHECK (sync_status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    
    -- Data synced
    content_hash TEXT, -- To detect changes
    
    synced_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AI USAGE & COST TRACKING
-- ============================================

CREATE TABLE ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Request Details
    model_used TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'chat', 'vision', 'voice', 'note_generation', 'task_parsing', etc.
    feature_used TEXT, -- 'kiko_chat', 'slash_command', 'strategic_briefing', 'mindmap', etc.
    
    -- Cost Tracking
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0, -- Actual cost in cents
    
    -- Performance
    latency_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    fallback_used BOOLEAN DEFAULT FALSE, -- If primary model failed
    
    -- Quality Metrics
    user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'neutral')),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily aggregation for dashboard
CREATE TABLE daily_ai_usage_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FILE ATTACHMENTS & STORAGE
-- ============================================

CREATE TABLE file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- File Info
    filename TEXT NOT NULL,
    file_size_bytes INTEGER,
    mime_type TEXT,
    
    -- Storage (Supabase Storage)
    storage_bucket TEXT DEFAULT 'user-files',
    storage_path TEXT NOT NULL,
    public_url TEXT,
    
    -- Encryption
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_id TEXT,
    
    -- AI Processing
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_analysis JSONB, -- Vision AI results, OCR data, etc.
    
    -- References
    message_id BIGINT REFERENCES kiko_messages(id),
    note_id BIGINT REFERENCES notes(id),
    task_id UUID REFERENCES tasks(id),
    
    -- Vision AI results
    detected_text TEXT, -- OCR result
    detected_objects JSONB, -- [{label, confidence, bbox}]
    detected_events JSONB, -- Calendar events from images
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STRATEGIC BRIEFINGS (from your MOCKED_BRIEFING)
-- ============================================

CREATE TABLE strategic_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Briefing Content
    content JSONB NOT NULL, -- Full briefing structure
    
    -- Generation Metadata
    model_used TEXT,
    generation_time_ms INTEGER,
    
    -- Engagement Metrics
    opened_at TIMESTAMP,
    actions_taken INTEGER DEFAULT 0,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================
-- HEALTH DATA (from healthDataService)
-- ============================================

CREATE TABLE health_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
    last_synced TIMESTAMP,
    
    UNIQUE(user_id, date),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
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
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Kiko Messages
CREATE INDEX idx_kiko_messages_conversation ON kiko_messages(conversation_id);
CREATE INDEX idx_kiko_messages_embedding ON kiko_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_kiko_messages_created ON kiko_messages(created_at DESC);

-- Tasks
CREATE INDEX idx_tasks_user_start ON tasks(user_id, start_time);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_calendar_id ON tasks(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;
CREATE INDEX idx_tasks_notion_id ON tasks(notion_page_id) WHERE notion_page_id IS NOT NULL;

-- Notes
CREATE INDEX idx_notes_user ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_notebook ON notes(notebook_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_flagged ON notes(user_id, flagged) WHERE flagged = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

-- Gmail Events
CREATE INDEX idx_gmail_events_status ON gmail_parsed_events(user_id, status);
CREATE INDEX idx_gmail_events_date ON gmail_parsed_events(event_date) WHERE event_detected = TRUE;

-- AI Usage
CREATE INDEX idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_model ON ai_usage_logs(model_used, created_at);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiko_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiko_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_parsed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own conversations" ON kiko_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own messages" ON kiko_messages FOR ALL 
  USING (auth.uid() = (SELECT user_id FROM kiko_conversations WHERE id = conversation_id));
CREATE POLICY "Users access own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notebooks" ON notebooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own mindmaps" ON mindmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own voice" ON voice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own gmail" ON gmail_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own gmail events" ON gmail_parsed_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notion" ON notion_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notion logs" ON notion_sync_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own usage" ON ai_usage_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own files" ON file_attachments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own briefings" ON strategic_briefings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own health" ON health_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply to relevant tables
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
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON kiko_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reset daily AI request counter at midnight
CREATE OR REPLACE FUNCTION reset_daily_ai_requests()
RETURNS void AS $
BEGIN
    UPDATE profiles
    SET daily_ai_requests = 0,
        last_ai_request_reset = CURRENT_DATE
    WHERE last_ai_request_reset < CURRENT_DATE;
END;
$ LANGUAGE plpgsql;

-- Function to calculate streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $
DECLARE
    v_last_activity DATE;
    v_current_streak INTEGER;
BEGIN
    SELECT last_activity_date, current_streak 
    INTO v_last_activity, v_current_streak
    FROM profiles 
    WHERE id = p_user_id;
    
    IF v_last_activity = CURRENT_DATE THEN
        -- Already updated today
        RETURN;
    ELSIF v_last_activity = CURRENT_DATE - 1 THEN
        -- Continue streak
        UPDATE profiles 
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = CURRENT_DATE
        WHERE id = p_user_id;
    ELSE
        -- Streak broken
        UPDATE profiles 
        SET current_streak = 1,
            last_activity_date = CURRENT_DATE
        WHERE id = p_user_id;
    END IF;
END;
$ LANGUAGE plpgsql;

-- Automatically update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $
BEGIN
    UPDATE kiko_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message 
    AFTER INSERT ON kiko_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
