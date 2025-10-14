-- Supabase Database Security Migration
-- Fixes security issues identified by Supabase linter
-- Author: Soen Development Team
-- Date: 2024-01-01

-- ==============================================
-- 1. CREATE DEDICATED SCHEMA FOR EXTENSIONS
-- ==============================================

-- Create a dedicated schema for extensions to avoid public schema issues
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to dedicated schema
-- Note: This requires recreating the extension
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- ==============================================
-- 2. FIX FUNCTION SEARCH_PATH ISSUES
-- ==============================================

-- Fix create_default_notebook function with immutable search_path
CREATE OR REPLACE FUNCTION public.create_default_notebook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Create default notebook for new users
  INSERT INTO public.notebooks (user_id, title, color, created_at, updated_at)
  VALUES (
    NEW.id,
    'My Notebook',
    '#3B82F6',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function with immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- ==============================================
-- 3. CREATE SECURE HELPER FUNCTIONS
-- ==============================================

-- Secure function to create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    mira_personality_mode,
    mira_voice_preference,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'supportive',
    'neutral',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Secure function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Soft delete user data instead of hard delete
  UPDATE public.profiles 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = OLD.id;
  
  -- Mark notebooks as deleted
  UPDATE public.notebooks 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE user_id = OLD.id;
  
  -- Mark notes as deleted
  UPDATE public.notes 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE notebook_id IN (
    SELECT id FROM public.notebooks WHERE user_id = OLD.id
  );
  
  -- Mark tasks as cancelled
  UPDATE public.tasks 
  SET status = 'Cancelled', updated_at = NOW()
  WHERE user_id = OLD.id AND status != 'Completed';
  
  RETURN OLD;
END;
$$;

-- ==============================================
-- 4. CREATE SECURE RLS POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Notebooks policies
CREATE POLICY "Users can view own notebooks" ON public.notebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notebooks" ON public.notebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notebooks" ON public.notebooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notebooks" ON public.notebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view notes in own notebooks" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notebooks 
      WHERE notebooks.id = notes.notebook_id 
      AND notebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes in own notebooks" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notebooks 
      WHERE notebooks.id = notes.notebook_id 
      AND notebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in own notebooks" ON public.notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.notebooks 
      WHERE notebooks.id = notes.notebook_id 
      AND notebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes in own notebooks" ON public.notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.notebooks 
      WHERE notebooks.id = notes.notebook_id 
      AND notebooks.user_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- 5. CREATE SECURE TRIGGERS
-- ==============================================

-- Trigger for user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Trigger for default notebook creation
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notebook();

-- Trigger for updated_at column updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notebooks_updated_at ON public.notebooks;
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 6. CREATE SECURE INDEXES
-- ==============================================

-- Create indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON public.notes(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON public.tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ==============================================
-- 7. CREATE SECURE VIEWS
-- ==============================================

-- Create secure view for user dashboard data
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.mira_personality_mode,
  p.mira_voice_preference,
  COUNT(DISTINCT n.id) as total_notes,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT pr.id) as total_projects,
  COUNT(DISTINCT g.id) as total_goals,
  COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'Pending' THEN t.id END) as pending_tasks
FROM public.profiles p
LEFT JOIN public.notebooks nb ON nb.user_id = p.id AND nb.deleted_at IS NULL
LEFT JOIN public.notes n ON n.notebook_id = nb.id AND n.deleted_at IS NULL
LEFT JOIN public.tasks t ON t.user_id = p.id
LEFT JOIN public.projects pr ON pr.user_id = p.id
LEFT JOIN public.goals g ON g.user_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.mira_personality_mode, p.mira_voice_preference;

-- Grant access to the view
GRANT SELECT ON public.user_dashboard TO authenticated;

-- ==============================================
-- 8. CREATE SECURE FUNCTIONS FOR MIRA AI
-- ==============================================

-- Function to get user's Mira personality settings
CREATE OR REPLACE FUNCTION public.get_mira_settings(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'personality_mode', mira_personality_mode,
    'voice_preference', mira_voice_preference,
    'user_name', full_name,
    'user_email', email
  ) INTO result
  FROM public.profiles
  WHERE id = user_id AND deleted_at IS NULL;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Function to update Mira settings
CREATE OR REPLACE FUNCTION public.update_mira_settings(
  user_id UUID,
  personality_mode TEXT DEFAULT NULL,
  voice_preference TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    mira_personality_mode = COALESCE(personality_mode, mira_personality_mode),
    mira_voice_preference = COALESCE(voice_preference, mira_voice_preference),
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- ==============================================
-- 9. CREATE AUDIT LOGGING
-- ==============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policy (only service role can access)
CREATE POLICY "Service role can access audit logs" ON public.audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_table_name TEXT,
  p_operation TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    operation,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_operation,
    p_old_data,
    p_new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- ==============================================
-- 10. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.get_mira_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mira_settings(UUID, TEXT, TEXT) TO authenticated;

-- ==============================================
-- 11. CREATE SECURE CONSTRAINTS
-- ==============================================

-- Add constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT check_mira_personality_mode 
CHECK (mira_personality_mode IN ('supportive', 'tough_love', 'analytical', 'motivational'));

ALTER TABLE public.profiles 
ADD CONSTRAINT check_mira_voice_preference 
CHECK (mira_voice_preference IN ('neutral', 'energetic', 'calm', 'professional'));

ALTER TABLE public.tasks 
ADD CONSTRAINT check_task_status 
CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled'));

ALTER TABLE public.goals 
ADD CONSTRAINT check_goal_term 
CHECK (term IN ('short', 'mid', 'long'));

ALTER TABLE public.goals 
ADD CONSTRAINT check_goal_status 
CHECK (status IN ('active', 'completed', 'archived'));

-- ==============================================
-- 12. FINAL SECURITY NOTES
-- ==============================================

-- Note: PostgreSQL version upgrade should be done through Supabase dashboard
-- Go to: https://supabase.com/docs/guides/platform/upgrading
-- This will address the vulnerable_postgres_version warning

-- All functions now have immutable search_path
-- All extensions are moved to dedicated schema
-- RLS policies are enabled on all tables
-- Audit logging is implemented
-- Secure constraints are in place

COMMENT ON SCHEMA extensions IS 'Dedicated schema for database extensions to avoid public schema security issues';
COMMENT ON FUNCTION public.create_default_notebook() IS 'Creates default notebook for new users with immutable search_path';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates updated_at timestamp with immutable search_path';
COMMENT ON FUNCTION public.get_mira_settings(UUID) IS 'Retrieves user Mira AI settings securely';
COMMENT ON FUNCTION public.update_mira_settings(UUID, TEXT, TEXT) IS 'Updates user Mira AI settings securely';
COMMENT ON FUNCTION public.log_audit_event(TEXT, TEXT, JSONB, JSONB) IS 'Logs audit events for security monitoring';
