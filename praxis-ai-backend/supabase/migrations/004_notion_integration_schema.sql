-- Migration: Add Notion integration tables
-- File: 004_notion_integration_schema.sql

-- Notion integrations table
CREATE TABLE IF NOT EXISTS notion_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_workspace_id TEXT NOT NULL,
  notion_workspace_name TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  access_token_iv TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, notion_workspace_id)
);

-- Notion databases mapping table
CREATE TABLE IF NOT EXISTS notion_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notebook_id INTEGER NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  notion_database_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, notebook_id),
  UNIQUE(notion_database_id)
);

-- Notion sync log table
CREATE TABLE IF NOT EXISTS notion_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  notion_page_id TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('praxis_to_notion', 'notion_to_praxis')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add notion_page_id column to notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'notion_page_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN notion_page_id TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notion_integrations_user_id ON notion_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_integrations_active ON notion_integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_notion_databases_user_id ON notion_databases(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_databases_notebook_id ON notion_databases(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_log_user_id ON notion_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_log_created_at ON notion_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_notion_page_id ON notes(notion_page_id);

-- Row Level Security (RLS) policies
ALTER TABLE notion_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_sync_log ENABLE ROW LEVEL SECURITY;

-- Policies for notion_integrations
CREATE POLICY "Users can view their own notion integrations" ON notion_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notion integrations" ON notion_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notion integrations" ON notion_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notion integrations" ON notion_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notion_databases
CREATE POLICY "Users can view their own notion databases" ON notion_databases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notion databases" ON notion_databases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notion databases" ON notion_databases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notion databases" ON notion_databases
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notion_sync_log
CREATE POLICY "Users can view their own notion sync logs" ON notion_sync_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notion sync logs" ON notion_sync_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notion_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_notion_integrations_updated_at
  BEFORE UPDATE ON notion_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_notion_integrations_updated_at();

-- Function to clean up old sync logs (keep last 1000 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notion_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notion_sync_log 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM notion_sync_log
    ) ranked
    WHERE rn > 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (this would be set up in Supabase dashboard)
-- For now, we'll create a manual function that can be called

-- Add comments for documentation
COMMENT ON TABLE notion_integrations IS 'Stores encrypted Notion API tokens and workspace information for each user';
COMMENT ON TABLE notion_databases IS 'Maps Praxis notebooks to Notion databases for sync operations';
COMMENT ON TABLE notion_sync_log IS 'Logs all sync operations between Praxis and Notion for debugging and monitoring';
COMMENT ON COLUMN notion_integrations.access_token_encrypted IS 'Encrypted Notion API access token';
COMMENT ON COLUMN notion_integrations.access_token_iv IS 'Initialization vector for token decryption';
COMMENT ON COLUMN notes.notion_page_id IS 'Notion page ID for synced notes';
