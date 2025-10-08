# Praxis-AI Database Migration Guide

## 🎯 **Overview**

This guide will help you set up the comprehensive Praxis-AI database schema that supports all the features from your frontend components.

## 📋 **What's Included**

### **Core Tables**
- **profiles** - User profiles with Kiko personality evolution, preferences, gamification
- **kiko_conversations** - Chat conversations with emotional intelligence
- **kiko_messages** - Individual messages with AI metadata and embeddings
- **tasks** - Comprehensive task management with AI insights
- **notes** - Smart notes with AI features and handwriting recognition
- **notebooks** - Note organization with Notion sync
- **projects** - Project management with AI analysis
- **goals** - Goal tracking with milestones
- **mindmaps** - AI-generated mind maps

### **AI & Integration Tables**
- **ai_usage_logs** - Detailed AI usage tracking
- **daily_ai_usage_summary** - Aggregated usage statistics
- **strategic_briefings** - Daily AI-generated briefings
- **gmail_integrations** - Gmail OAuth and sync settings
- **gmail_parsed_events** - AI-extracted calendar events from emails
- **notion_integrations** - Notion workspace connections
- **notion_sync_log** - Sync history and error tracking
- **file_attachments** - File storage with AI processing
- **voice_sessions** - Voice conversation data
- **health_data** - Health and wellness tracking
- **notifications** - Notification system

### **Advanced Features**
- **Vector Embeddings** - Semantic search for notes and messages
- **Row Level Security** - Complete data isolation per user
- **Encryption Support** - Optional content encryption
- **AI Processing** - OCR, vision analysis, event detection
- **Real-time Sync** - Notion and Gmail integration
- **Performance Indexes** - Optimized for fast queries

## 🚀 **Setup Instructions**

### **Option 1: Local Supabase (Recommended)**

1. **Install Supabase CLI**
```bash
npm install -g supabase
```

2. **Initialize Supabase**
```bash
cd /Users/prattlove/Desktop/Praxis-AI/praxis-ai-backend
supabase init
```

3. **Start Local Supabase**
```bash
supabase start
```

4. **Run Migrations**
```bash
# Apply the comprehensive schema
supabase db reset

# Or apply individual migrations
supabase migration up
```

5. **Generate Types**
```bash
npm run db:generate-types
```

### **Option 2: Cloud Supabase**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and API keys

2. **Update Environment Variables**
```bash
# Add to your .env file
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. **Run Migrations**
```bash
# Connect to your cloud project
supabase link --project-ref your_project_ref

# Apply migrations
supabase db push
```

### **Option 3: Manual SQL Execution**

1. **Access Your Database**
   - Use Supabase Dashboard SQL Editor
   - Or connect with any PostgreSQL client

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/003_comprehensive_schema.sql`
   - Execute in your database

## 🔧 **Environment Configuration**

Update your `.env` file with the database connection:

```bash
# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROK_API_KEY=your_grok_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Application Configuration
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## 🧪 **Testing the Setup**

### **Test Database Connection**
```bash
# Test with your backend
npm run dev:full

# Check health endpoint
curl http://localhost:3000/health
```

### **Test Database Queries**
```bash
# Test basic profile creation
curl -X POST http://localhost:3000/trpc/profiles.create \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "full_name": "Test User"}'
```

### **Verify Tables**
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 📊 **Database Features**

### **Vector Search**
```sql
-- Search notes by semantic similarity
SELECT title, content 
FROM notes 
WHERE embedding <-> '[0.1, 0.2, ...]' < 0.8
ORDER BY embedding <-> '[0.1, 0.2, ...]'
LIMIT 10;
```

### **AI Usage Tracking**
```sql
-- Get user's AI usage for the month
SELECT 
  model_used,
  COUNT(*) as requests,
  SUM(tokens_used) as total_tokens,
  SUM(cost_cents) as total_cost
FROM ai_usage_logs 
WHERE user_id = 'user-uuid' 
  AND created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY model_used;
```

### **Gamification**
```sql
-- Update user streak
SELECT update_user_streak('user-uuid');

-- Get leaderboard
SELECT 
  full_name,
  current_streak,
  praxis_flow_points
FROM profiles 
ORDER BY current_streak DESC, praxis_flow_points DESC
LIMIT 10;
```

## 🔒 **Security Features**

### **Row Level Security**
- All tables have RLS enabled
- Users can only access their own data
- Policies automatically created for all tables

### **Encryption Support**
- Optional content encryption for sensitive data
- AES-256-GCM encryption for messages and notes
- Encryption keys stored securely

### **Data Retention**
- Configurable data retention periods
- Automatic cleanup of old data
- GDPR compliance ready

## 🚀 **Next Steps**

### **1. Test Basic Functionality**
```bash
# Start your backend with full database support
npm run dev:full

# Test the health endpoint
curl http://localhost:3000/health
```

### **2. Test AI Features**
```bash
# Test Kiko chat
curl -X POST http://localhost:3000/trpc/ai.chatWithKiko \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Kiko!", "personalityMode": "supportive"}'
```

### **3. Test Database Operations**
```bash
# Test task creation
curl -X POST http://localhost:3000/trpc/tasks.create \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "category": "work"}'
```

### **4. Frontend Integration**
- Your backend is now ready for frontend integration
- All tRPC endpoints are available
- Database types are generated and ready

## 📚 **Additional Resources**

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL Vector Extension**: [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- **tRPC Documentation**: [trpc.io](https://trpc.io)

## 🎉 **Success!**

Your Praxis-AI database is now fully configured with:
- ✅ Comprehensive schema for all features
- ✅ AI usage tracking and cost management
- ✅ Vector search capabilities
- ✅ Row level security
- ✅ Integration support (Gmail, Notion)
- ✅ Gamification system
- ✅ Health data tracking
- ✅ Notification system

Your backend is ready for production use! 🚀
