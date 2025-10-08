# Praxis-AI Database Setup Guide

This guide will help you set up the Supabase database for Praxis-AI with all 12 core tables, pgvector support, RLS policies, and performance indexes.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
3. **PostgreSQL Knowledge**: Basic understanding of SQL and database concepts

## Step 1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

## Step 2: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `praxis-ai-backend`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

## Step 3: Initialize Local Development

```bash
# Navigate to your backend directory
cd praxis-ai-backend

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Start local Supabase (optional for development)
supabase start
```

## Step 4: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Apply migration
supabase db push

# Or run specific migration
supabase migration up
```

## Step 5: Verify Database Setup

Run these queries in the Supabase SQL Editor to verify everything is set up correctly:

```sql
-- Check if extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');

-- Check if all 12 core tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- ai_insights, chat_message_embeddings, chat_messages, chat_sessions, 
-- goals, health_metrics, note_embeddings, notebooks, notes, 
-- profiles, projects, tasks, usage_analytics

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check vector indexes specifically
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexdef LIKE '%vector%' OR indexdef LIKE '%ivfflat%';
```

## Step 6: Load Seed Data (Optional)

```sql
-- Copy and run the contents of supabase/seed.sql
-- This will populate your database with sample data for testing
```

## Step 7: Configure Environment Variables

Update your `.env` file with your Supabase credentials:

```bash
# Get these from your Supabase project settings
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 8: Generate TypeScript Types

```bash
# Generate TypeScript types from your database schema
supabase gen types typescript --local > src/types/database.ts

# Or for remote database
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

## Database Schema Overview

### All 12 Core Tables Created:

1. ✅ **profiles** - User profiles extending Supabase auth
2. ✅ **projects** - Project management with status tracking
3. ✅ **goals** - Short/mid/long term goals
4. ✅ **tasks** - AI-enhanced tasks with embeddings
5. ✅ **notebooks** - Note organization containers
6. ✅ **notes** - Rich text notes with vector search
7. ✅ **note_embeddings** - Vector embeddings for semantic search
8. ✅ **chat_sessions** - AI chat conversations
9. ✅ **chat_messages** - Individual chat messages
10. ✅ **chat_message_embeddings** - Chat message embeddings
11. ✅ **health_metrics** - Daily health tracking
12. ✅ **ai_insights** - Generated AI insights
13. ✅ **usage_analytics** - AI usage tracking

### Key Features Implemented:

- ✅ **pgvector Extension**: Enabled for AI embeddings
- ✅ **VECTOR(1536)**: OpenAI text-embedding-3-small support
- ✅ **IVFFLAT Indexes**: Optimized similarity search
- ✅ **Row Level Security**: All tables protected with RLS policies
- ✅ **Performance Indexes**: 25+ optimized indexes
- ✅ **Foreign Key Constraints**: Proper referential integrity
- ✅ **Soft Deletes**: Support for data recovery
- ✅ **Audit Trail**: Created/updated timestamps on all tables
- ✅ **Triggers**: Auto-update timestamps and default notebooks

## Vector Search Usage

### Creating Embeddings

```sql
-- Insert a note with embedding
INSERT INTO public.notes (user_id, notebook_id, title, content)
VALUES ('user-id', 'notebook-id', 'My Note', 'This is my note content');

-- Generate embedding (you'll do this via your application)
INSERT INTO public.note_embeddings (note_id, embedding)
VALUES ('note-id', '[0.1, 0.2, ...]'::vector);
```

### Semantic Search

```sql
-- Find similar notes using vector similarity
SELECT n.*, ne.embedding <-> '[0.1, 0.2, ...]'::vector AS distance
FROM public.notes n
JOIN public.note_embeddings ne ON n.id = ne.note_id
WHERE n.user_id = 'user-id'
ORDER BY distance
LIMIT 10;

-- Find similar chat messages
SELECT cm.*, cme.embedding <-> query_embedding AS distance
FROM public.chat_messages cm
JOIN public.chat_message_embeddings cme ON cm.id = cme.message_id
JOIN public.chat_sessions cs ON cm.session_id = cs.id
WHERE cs.user_id = 'user-id'
ORDER BY distance
LIMIT 10;
```

## Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Ensure all policies are created correctly
2. **Vector Extension**: Make sure pgvector is enabled
3. **Index Performance**: Monitor query performance and adjust indexes
4. **Foreign Key Constraints**: Check referential integrity

### Useful Queries:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Monitor query performance
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check vector index performance
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE indexdef LIKE '%vector%';
```

## Next Steps

1. **Test the API**: Verify all endpoints work with the database
2. **Implement Vector Search**: Add embedding generation and search
3. **Monitor Performance**: Set up query monitoring
4. **Backup Strategy**: Configure automated backups
5. **Scaling**: Plan for horizontal scaling as you grow

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **pgvector Docs**: [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- **PostgreSQL Docs**: [postgresql.org/docs](https://postgresql.org/docs)