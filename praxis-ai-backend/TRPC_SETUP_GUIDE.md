# Praxis-AI tRPC Backend Setup

## 🚀 Complete tRPC Implementation for Praxis-AI

This document outlines the comprehensive tRPC backend setup for Praxis-AI, a hyper-personalized productivity app with AI insights.

## 📋 Overview

The tRPC backend provides a type-safe, end-to-end API for the Praxis-AI frontend, supporting:

- **10 Core Routers**: Dashboard, Kiko AI Chat, Notes, Projects, Insights, Explore, Gamification, Themes, Schedule, and Health
- **AI Integration**: Grok AI (primary), Google Gemini (fallback), OpenAI support
- **Widget System**: Comprehensive data aggregation for dashboard widgets
- **Authentication**: Supabase Auth integration with user management
- **Real-time Features**: Live updates and notifications
- **Gamification**: Points, streaks, achievements, and rewards

## 🏗️ Architecture

```
praxis-ai-backend/
├── src/
│   ├── app.ts                 # Main Hono application
│   ├── trpc.ts               # tRPC handler configuration
│   ├── context.ts            # tRPC context with services
│   ├── types/
│   │   ├── widgets.ts        # Widget type definitions
│   │   ├── ai.ts            # AI service types
│   │   └── database.ts      # Supabase database types
│   ├── services/
│   │   ├── aiService.ts     # AI service manager
│   │   └── widgetAggregationService.ts
│   └── routers/
│       ├── index.ts         # Main router export
│       ├── dashboard.ts     # Dashboard & widget data
│       ├── kiko.ts         # AI chat system
│       ├── notes.ts        # Smart notes with AI
│       ├── projects.ts     # Project management
│       ├── insights.ts     # Mind mapping & insights
│       ├── explore.ts      # Web search & image analysis
│       ├── gamification.ts # Points, streaks, rewards
│       ├── themes.ts       # Custom theme management
│       ├── schedule.ts    # Calendar & task planning
│       └── health.ts      # Health data integration
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Required environment variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services
GROK_API_KEY=your_grok_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# External APIs
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
WEATHER_API_KEY=your_weather_api_key

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Generate TypeScript types from Supabase schema
npm run db:generate-types

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The tRPC API will be available at `http://localhost:3000/trpc`

## 🎯 Router Overview

### 1. Dashboard Router (`/trpc/dashboard`)

**Purpose**: Aggregates widget data and generates strategic briefings

**Key Endpoints**:
- `getDashboardData` - Get all widget data for dashboard
- `getStrategicBriefing` - Generate AI-powered strategic briefing
- `updateWidget` - Update widget configuration
- `createWidget` - Create new dashboard widget

**Features**:
- Real-time widget data aggregation
- AI-generated strategic briefings
- Widget customization and positioning
- Performance optimization with caching

### 2. Kiko Router (`/trpc/kiko`)

**Purpose**: AI chat system with contextual responses

**Key Endpoints**:
- `sendMessage` - Send message to Kiko AI
- `getSessions` - Get chat session history
- `generateContextualResponse` - Get AI response with user context
- `getUsageStats` - Track AI usage and costs

**Features**:
- Multi-model AI support (Grok, Gemini, OpenAI)
- Context-aware responses using user data
- Session management and history
- Usage tracking and cost monitoring

### 3. Notes Router (`/trpc/notes`)

**Purpose**: Smart notes with AI processing

**Key Endpoints**:
- `createNote` - Create new note
- `processNote` - AI processing (summarize, extract actions)
- `searchNotes` - Full-text search with AI
- `getNoteStats` - Note analytics and insights

**Features**:
- AI-powered summarization
- Action item extraction
- Full-text search with semantic understanding
- Note analytics and tagging

### 4. Projects Router (`/trpc/projects`)

**Purpose**: High-level project management

**Key Endpoints**:
- `createProject` - Create new project
- `updateProject` - Update project status and details
- `getProjectStats` - Project analytics and progress
- `generateProjectInsights` - AI-generated project insights

**Features**:
- Project lifecycle management
- Progress tracking and analytics
- AI-generated insights and recommendations
- Integration with tasks and notes

### 5. Insights Router (`/trpc/insights`)

**Purpose**: Mind mapping and actionable insights

**Key Endpoints**:
- `generateInsights` - Generate comprehensive insights
- `createMindMap` - Create interactive mind map
- `generatePersonalizedInsights` - User-specific insights
- `getInsightTemplates` - Pre-built insight templates

**Features**:
- AI-powered mind map generation
- Strategic briefing creation
- Personalized insight generation
- Template system for common patterns

### 6. Explore Router (`/trpc/explore`)

**Purpose**: Web search and image analysis

**Key Endpoints**:
- `webSearch` - Perform web searches
- `analyzeImage` - AI-powered image analysis
- `getSearchHistory` - Search history and trends
- `getTrendingTopics` - Trending topics by category

**Features**:
- Web search integration
- AI image analysis with Gemini Vision
- Search history and analytics
- Trending topics and suggestions

### 7. Gamification Router (`/trpc/gamification`)

**Purpose**: Points, streaks, achievements, and rewards

**Key Endpoints**:
- `awardPoints` - Award points for activities
- `getUserStats` - User progress and statistics
- `getLeaderboard` - Community leaderboards
- `redeemReward` - Redeem points for rewards

**Features**:
- Comprehensive points system
- Streak tracking and maintenance
- Achievement system
- Rewards catalog and redemption

### 8. Themes Router (`/trpc/themes`)

**Purpose**: Custom theme management

**Key Endpoints**:
- `createTheme` - Create custom theme
- `applyTheme` - Apply theme to user interface
- `exportTheme` - Export theme configuration
- `importTheme` - Import theme from file

**Features**:
- Custom theme creation
- Theme sharing and import/export
- Preset theme library
- Theme analytics and usage

### 9. Schedule Router (`/trpc/schedule`)

**Purpose**: Calendar integration and task planning

**Key Endpoints**:
- `createTask` - Create scheduled task
- `getScheduleOverview` - Get schedule for time period
- `syncGoogleCalendar` - Sync with Google Calendar
- `getTaskStats` - Task completion analytics

**Features**:
- Task and event management
- Calendar integration
- Schedule analytics
- Google Calendar sync

### 10. Health Router (`/trpc/health`)

**Purpose**: Health data integration for strategic briefings

**Key Endpoints**:
- `createHealthData` - Record health metrics
- `getHealthStats` - Health analytics and trends
- `getHealthInsights` - AI-generated health insights
- `syncHealthApps` - Sync with health applications

**Features**:
- Health data tracking
- Workout and activity logging
- Health trend analysis
- Integration with health apps

## 🔌 Frontend Integration

### TypeScript Client Setup

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './backend/src/routers';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    }),
  ],
});
```

### Usage Examples

```typescript
// Get dashboard data
const dashboardData = await trpc.dashboard.getDashboardData.query({
  date: '2024-01-15',
  widgets: ['schedule', 'insights', 'health']
});

// Send message to Kiko AI
const response = await trpc.kiko.sendMessage.mutate({
  message: 'Help me plan my day',
  model: 'grok',
  context: 'productivity'
});

// Create a new note
const note = await trpc.notes.createNote.mutate({
  notebookId: 'notebook-1',
  title: 'Meeting Notes',
  content: 'Discussed project timeline...',
  tags: ['work', 'meeting']
});

// Generate insights
const insights = await trpc.insights.generateInsights.mutate({
  dataSource: 'all',
  insightType: 'strategic_briefing'
});
```

## 🛡️ Security Features

- **Authentication**: Supabase Auth integration
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting per user
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests

## 📊 Performance Optimizations

- **Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized database queries
- **Batch Operations**: Efficient data aggregation
- **Connection Pooling**: Database connection optimization
- **Compression**: Response compression for large payloads

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "dashboard"
```

## 🚀 Deployment

### Cloudflare Workers

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoring & Analytics

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **Usage Analytics**: API usage statistics
- **Health Checks**: Service health monitoring

## 🔄 API Versioning

The tRPC setup supports API versioning through:

- **Backward Compatibility**: Maintained through careful schema evolution
- **Deprecation Strategy**: Gradual deprecation of old endpoints
- **Migration Support**: Tools for migrating to new API versions

## 📚 Additional Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Hono Framework](https://hono.dev/)
- [Zod Validation](https://zod.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software owned by Surface Tension LLC.

---

**Built with ❤️ for Praxis-AI**

