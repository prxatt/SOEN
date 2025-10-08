# AI Orchestrator Integration - Praxis-AI Backend

## 🚀 Complete AI Orchestrator Implementation

This document outlines the comprehensive AI orchestrator implementation for Praxis-AI, featuring intelligent model routing, cost optimization, and multi-provider support.

## 📋 Overview

The AI orchestrator provides:

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Grok, Perplexity, Google Gemini
- **Intelligent Routing**: Feature-specific model selection based on complexity and cost
- **Cost Optimization**: Grok's $25 free credits prioritized, intelligent fallbacks
- **Usage Tracking**: Comprehensive analytics and quota management
- **Caching System**: 80% hit rate target with feature-specific TTLs
- **Health Monitoring**: Real-time service health and automatic failover

## 🏗️ Architecture

```
src/services/
├── ai-orchestrator.ts           # Main orchestrator with multi-provider support
├── enhancedAIServiceManager.ts  # Enhanced service manager (existing)
├── enhancedGrokService.ts       # Grok-specific service (existing)
└── [other specialized services] # Strategic briefing, Kiko, etc.

src/routers/
├── aiOrchestrator.ts           # tRPC router for AI orchestrator
└── [other routers]             # Existing routers

supabase/migrations/
└── 002_ai_orchestrator_schema.sql # Database schema for AI tracking
```

## 🤖 AI Orchestrator Features

### **Model Selection Strategy**

```typescript
// Feature-specific routing
switch (featureType) {
  case 'kiko_chat':
    return isSimpleQuery ? 'gpt-4o-mini' : 'claude-3.5-haiku';
  
  case 'task_parsing':
  case 'calendar_event_parsing':
    return 'gpt-4o-mini'; // Fast structured output
  
  case 'vision_ocr':
  case 'vision_event_detection':
    return 'gpt-4o-mini'; // Vision capabilities
  
  case 'strategic_briefing':
  case 'note_generation':
    return userTier === 'free' ? 'gpt-4o-mini' : 'claude-3.5-haiku';
  
  case 'mindmap_generation':
    return monthlyBudget.grokCredits > 0 ? 'grok-4-fast' : 'claude-3.5-haiku';
  
  case 'research_with_sources':
    return userTier === 'free' ? 'gemini-1.5-flash' : 'perplexity-sonar';
}
```

### **Cost Optimization**

- **Grok Priority**: $25 free monthly credits used first
- **Intelligent Fallbacks**: Automatic switching when credits exhausted
- **Caching**: 80% hit rate target with feature-specific TTLs
- **Budget Management**: Real-time cost tracking and limits

### **Usage Tracking**

```typescript
// Comprehensive usage analytics
interface AIUsageLog {
  userId: string;
  featureType: FeatureType;
  modelUsed: string;
  tokensUsed: number;
  costCents: number;
  processingTimeMs: number;
  cacheHit: boolean;
  success: boolean;
}
```

## 🔧 API Endpoints

### **Core AI Processing**

```typescript
// Process any AI request through orchestrator
ai.processRequest({
  message: "Generate a strategic briefing",
  featureType: "strategic_briefing",
  priority: "high",
  context: { userGoals, recentTasks, healthData }
})
```

### **Specialized Endpoints**

```typescript
// Kiko chat with personality
ai.chatWithKiko({
  message: "Help me plan my day",
  conversationHistory: [...],
  personalityMode: "supportive"
})

// Task parsing from natural language
ai.parseTask({
  naturalLanguageInput: "Call mom tomorrow at 2pm",
  context: { currentTime, location }
})

// Strategic briefing generation
ai.generateStrategicBriefing({
  date: new Date(),
  includeHealthData: true,
  includeLearningData: true
})

// Mind map generation
ai.generateMindMap({
  focusArea: "productivity",
  includeOpportunities: true
})

// Research with sources
ai.researchWithSources({
  query: "latest productivity techniques 2024",
  maxResults: 10
})

// Image analysis
ai.analyzeImage({
  imageBase64: "...",
  mimeType: "image/jpeg",
  analysisType: "ocr"
})
```

## 📊 Database Schema

### **AI Usage Tracking**

```sql
-- AI usage logs
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  feature_type TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  cache_hit BOOLEAN DEFAULT false,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily usage summary
CREATE TABLE daily_ai_usage_summary (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- AI cache
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  feature_type TEXT NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

### **User Quota Management**

```sql
-- Enhanced profiles table
ALTER TABLE profiles 
ADD COLUMN daily_ai_requests INTEGER DEFAULT 0,
ADD COLUMN kiko_personality_mode TEXT DEFAULT 'supportive',
ADD COLUMN monthly_ai_budget_cents INTEGER DEFAULT 1500;
```

## 🚀 Local Development Setup

### **1. Environment Variables**

Create `.env` file with required API keys:

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROK_API_KEY=your_grok_api_key
GEMINI_API_KEY=your_gemini_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### **2. Database Setup**

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Generate types
npm run db:generate-types
```

### **3. Install Dependencies**

```bash
npm install
```

### **4. Run Development Server**

```bash
# Start backend
npm run dev

# In another terminal, start frontend
cd ../frontend
npm run dev
```

### **5. Test AI Orchestrator**

```bash
# Run tests
npm test

# Test specific AI endpoints
curl -X POST http://localhost:3000/trpc/ai.chatWithKiko \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Hello Kiko!", "personalityMode": "supportive"}'
```

## 🔍 Usage Examples

### **Frontend Integration**

```typescript
// React component using tRPC
import { trpc } from '../utils/trpc';

function KikoChat() {
  const chatMutation = trpc.ai.chatWithKiko.useMutation();
  
  const handleSendMessage = async (message: string) => {
    const response = await chatMutation.mutateAsync({
      message,
      personalityMode: 'supportive'
    });
    
    console.log('Kiko response:', response.content);
    console.log('Model used:', response.modelUsed);
    console.log('Confidence:', response.confidence);
  };
  
  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

### **Strategic Briefing Generation**

```typescript
const briefingMutation = trpc.ai.generateStrategicBriefing.useMutation();

const generateBriefing = async () => {
  const briefing = await briefingMutation.mutateAsync({
    date: new Date(),
    includeHealthData: true,
    includeLearningData: true,
    includeProductivityData: true
  });
  
  // Display briefing
  setBriefing(briefing.briefing);
};
```

### **Task Parsing**

```typescript
const parseTaskMutation = trpc.ai.parseTask.useMutation();

const parseNaturalLanguage = async (input: string) => {
  const parsed = await parseTaskMutation.mutateAsync({
    naturalLanguageInput: input,
    context: {
      currentTime: new Date(),
      location: 'San Francisco'
    }
  });
  
  // Create task from parsed data
  const task = JSON.parse(parsed.parsedTask);
  createTask(task);
};
```

## 📈 Performance & Monitoring

### **Caching Strategy**

- **Kiko Chat**: 1 hour TTL
- **Strategic Briefing**: 1 hour TTL (regenerate daily)
- **Note Summary**: 24 hours TTL
- **Mind Map**: 1 hour TTL
- **Research**: 2 hours TTL

### **Cost Management**

- **Free Tier**: 5 requests/day, Gemini Flash fallback
- **Pro Tier**: 50 requests/day, Claude Haiku access
- **Team Tier**: 500 requests/day, full model access
- **Budget Tracking**: Real-time cost monitoring

### **Health Monitoring**

```typescript
// Service health check
const health = await aiOrchestrator.getServiceHealth();

// Usage metrics
const metrics = await aiOrchestrator.getUsageMetrics(userId);
```

## 🔒 Security & Privacy

- **No Data Persistence**: AI services don't store user data
- **Secure API Keys**: Environment variable management
- **Request Sanitization**: Input validation and sanitization
- **Audit Logging**: Comprehensive usage tracking
- **Rate Limiting**: Per-user request limits

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific AI functionality
npm test -- --grep "AI Orchestrator"
```

## 📚 API Documentation

### **Available Feature Types**

- `kiko_chat` - Conversational AI with personality
- `task_parsing` - Natural language to structured task
- `note_generation` - AI-assisted note creation
- `note_summary` - Note summarization
- `note_autofill` - Note content expansion
- `mindmap_generation` - Visual mind map creation
- `strategic_briefing` - Daily strategic reports
- `vision_ocr` - Text extraction from images
- `vision_event_detection` - Event detection in images
- `calendar_event_parsing` - Calendar event extraction
- `research_with_sources` - Web research with citations
- `gmail_event_extraction` - Email event parsing
- `completion_summary` - Task completion summaries
- `completion_image` - Image generation

### **Model Capabilities**

- **GPT-4o Mini**: Fast responses, vision, structured output
- **Claude 3.5 Haiku**: Strategic thinking, complex reasoning
- **Grok-4 Fast**: Advanced reasoning, free credits
- **Perplexity Sonar**: Web search with citations
- **Gemini 1.5 Flash**: Free tier fallback, general purpose

---

**Built with ❤️ for Praxis-AI - Intelligent AI Orchestration**
