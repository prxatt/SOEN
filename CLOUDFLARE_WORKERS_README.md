# Cloudflare Workers Configuration for Soen Backend

This `wrangler.toml` configuration file sets up a comprehensive Cloudflare Workers deployment for the Soen backend, featuring Mira AI integration and all the advanced services we've implemented.

## 🎯 **Configuration Overview**

The configuration includes:
- **Soen Backend Service** with Mira AI integration
- **KV Namespaces** for caching and session management
- **R2 Buckets** for file storage and AI processing
- **Durable Objects** for real-time features
- **Cron Triggers** for automated Mira AI tasks
- **Environment-specific** deployments

## 🚀 **Key Features**

### **Service Configuration**
- ✅ **Multi-environment Support** (production, staging, development)
- ✅ **Mira AI Integration** with personality modes and voice preferences
- ✅ **Security Headers** and CORS configuration
- ✅ **Rate Limiting** and performance optimization
- ✅ **Error Handling** and monitoring

### **Storage & Caching**
- ✅ **KV Namespaces** for caching, sessions, preferences, and rate limits
- ✅ **R2 Buckets** for user files, voice cache, vision AI cache, and Notion sync
- ✅ **Durable Objects** for real-time voice sessions and notifications

### **Automated Tasks**
- ✅ **Daily Mira Briefings** at 7 AM
- ✅ **Hourly AI Request Resets**
- ✅ **Daily Cleanup** and backup tasks
- ✅ **Weekly Analytics** and insights generation

## 📋 **Environment Variables**

### **AI Service Configuration**
```toml
OPENAI_API_KEY = ""           # OpenAI API for Mira AI
GOOGLE_API_KEY = ""           # Google Gemini API
ELEVENLABS_API_KEY = ""       # ElevenLabs for voice synthesis
DEEPGRAM_API_KEY = ""         # Deepgram for speech recognition
```

### **Database Configuration**
```toml
SUPABASE_URL = ""             # Supabase project URL
SUPABASE_ANON_KEY = ""       # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY = "" # Supabase service role key
```

### **Integration APIs**
```toml
GOOGLE_CLIENT_ID = ""         # Gmail integration
GOOGLE_CLIENT_SECRET = ""     # Gmail integration
NOTION_API_KEY = ""           # Notion sync integration
```

### **Security Configuration**
```toml
JWT_SECRET = ""               # JWT token signing
ENCRYPTION_KEY = ""           # Data encryption key
```

## 🗄️ **KV Namespaces**

### **SOEN_CACHE**
- **Purpose**: General application caching
- **Usage**: API responses, computed data, temporary storage
- **TTL**: Configurable per key

### **MIRA_SESSIONS**
- **Purpose**: Mira AI conversation sessions
- **Usage**: Voice sessions, chat history, personality states
- **TTL**: Session-based expiration

### **USER_PREFERENCES**
- **Purpose**: User settings and preferences
- **Usage**: Mira personality settings, voice preferences, app settings
- **TTL**: Long-term storage

### **RATE_LIMITS**
- **Purpose**: API rate limiting
- **Usage**: Request counters, user quotas, API limits
- **TTL**: Per-minute/hour expiration

## 🪣 **R2 Buckets**

### **USER_FILES**
- **Purpose**: User-uploaded files
- **Usage**: Images, documents, attachments
- **Access**: User-specific, encrypted

### **MIRA_VOICE_CACHE**
- **Purpose**: Voice synthesis cache
- **Usage**: Generated audio files, voice samples
- **Access**: Mira AI service only

### **VISION_AI_CACHE**
- **Purpose**: Vision AI processing cache
- **Usage**: Processed images, OCR results, analysis data
- **Access**: Vision AI service only

### **NOTION_SYNC_CACHE**
- **Purpose**: Notion synchronization cache
- **Usage**: Sync states, page data, conflict resolution
- **Access**: Notion sync service only

## 🔄 **Durable Objects**

### **VoiceSessionDO**
- **Purpose**: Real-time voice conversation management
- **Features**: WebSocket connections, audio streaming, session state
- **Scaling**: Per-user instances

### **RealtimeNotificationDO**
- **Purpose**: Real-time notification delivery
- **Features**: Push notifications, WebSocket broadcasts, delivery tracking
- **Scaling**: Per-user instances

### **MiraConversationDO**
- **Purpose**: Mira AI conversation state management
- **Features**: Context preservation, personality state, conversation history
- **Scaling**: Per-conversation instances

## ⏰ **Cron Triggers**

### **Daily Tasks**
```toml
"0 7 * * *"    # Daily Mira briefing generation at 7 AM
"0 0 * * *"    # Daily cleanup of expired sessions
"0 2 * * *"    # Daily backup of user data
```

### **Hourly Tasks**
```toml
"0 * * * *"    # Hourly AI request counter reset
```

### **Weekly Tasks**
```toml
"0 6 * * 1"    # Weekly analytics report generation
"0 12 * * 0"   # Weekly Mira insights generation
```

### **Weekday Tasks**
```toml
"0 9 * * 1-5"  # Weekday morning task prioritization
"0 18 * * 1-5" # Weekday evening progress review
```

### **Monthly Tasks**
```toml
"0 0 1 * *"    # Monthly user analytics and insights
```

## 🔧 **Environment-Specific Configurations**

### **Production Environment**
```toml
[env.production]
name = "soen-backend-prod"
vars = { ENVIRONMENT = "production", DEBUG_MODE = "false" }
```

### **Staging Environment**
```toml
[env.staging]
name = "soen-backend-staging"
vars = { ENVIRONMENT = "staging", DEBUG_MODE = "true" }
```

### **Development Environment**
```toml
[env.development]
name = "soen-backend-dev"
vars = { ENVIRONMENT = "development", DEBUG_MODE = "true", LOG_LEVEL = "debug" }
```

## 🔐 **Security Configuration**

### **Security Headers**
```toml
[security]
headers = [
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "X-XSS-Protection: 1; mode=block",
  "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  "Content-Security-Policy: default-src 'self'"
]
```

### **CORS Configuration**
```toml
[cors]
allowed_origins = [
  "https://soen.app",
  "https://app.soen.com",
  "https://localhost:3000"
]
allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
allowed_headers = ["Content-Type", "Authorization", "X-Requested-With"]
max_age = 86400
```

### **Rate Limiting**
```toml
[rate_limiting]
enabled = true
requests_per_minute = 100
requests_per_hour = 1000
burst_limit = 50
```

## 🤖 **Mira AI Configuration**

### **Personality Modes**
```toml
[mira_ai]
personality_modes = ["supportive", "tough_love", "analytical", "motivational"]
voice_preferences = ["neutral", "energetic", "calm", "professional"]
max_conversation_length = 50
response_timeout_ms = 30000
max_retries = 3
```

### **Feature Flags**
```toml
ENABLE_VOICE_CONVERSATION = "true"
ENABLE_VISION_AI = "true"
ENABLE_GMAIL_INTEGRATION = "true"
ENABLE_NOTION_SYNC = "true"
```

## 📊 **Performance Configuration**

### **Caching**
```toml
[performance]
enable_compression = true
enable_caching = true
cache_ttl_seconds = 3600
max_concurrent_requests = 1000
timeout_seconds = 30
```

### **File Upload**
```toml
MAX_FILE_SIZE_MB = "10"
ALLOWED_FILE_TYPES = "image/jpeg,image/png,image/gif,application/pdf,text/plain"
```

## 📈 **Analytics Configuration**

### **Tracking**
```toml
[analytics]
enabled = true
retention_days = 90
batch_size = 100
flush_interval_seconds = 60
track_user_behavior = true
track_performance_metrics = true
```

## 🚀 **Deployment Commands**

### **Development Deployment**
```bash
# Deploy to development environment
wrangler deploy --env development

# Deploy with preview
wrangler deploy --env development --compatibility-date 2024-01-01
```

### **Staging Deployment**
```bash
# Deploy to staging environment
wrangler deploy --env staging

# Deploy with specific compatibility date
wrangler deploy --env staging --compatibility-date 2024-01-01
```

### **Production Deployment**
```bash
# Deploy to production environment
wrangler deploy --env production

# Deploy with monitoring
wrangler deploy --env production --compatibility-date 2024-01-01
```

### **KV Namespace Management**
```bash
# Create KV namespaces
wrangler kv:namespace create "SOEN_CACHE"
wrangler kv:namespace create "MIRA_SESSIONS"
wrangler kv:namespace create "USER_PREFERENCES"
wrangler kv:namespace create "RATE_LIMITS"

# Update wrangler.toml with the generated IDs
```

### **R2 Bucket Management**
```bash
# Create R2 buckets
wrangler r2 bucket create soen-user-files
wrangler r2 bucket create mira-voice-cache
wrangler r2 bucket create vision-ai-cache
wrangler r2 bucket create notion-sync-cache
```

## 🔧 **Local Development**

### **Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start local development
wrangler dev
```

### **Testing**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📊 **Monitoring & Observability**

### **Metrics**
- **Request Count**: Total API requests per minute/hour
- **Response Time**: Average response time per endpoint
- **Error Rate**: Percentage of failed requests
- **Mira AI Usage**: AI requests and processing time
- **Storage Usage**: KV and R2 usage statistics

### **Logs**
- **Application Logs**: Service-specific logging
- **Error Logs**: Error tracking and debugging
- **Performance Logs**: Performance metrics and bottlenecks
- **Security Logs**: Authentication and authorization events

### **Traces**
- **Request Tracing**: End-to-end request tracking
- **Service Dependencies**: Inter-service communication
- **Performance Bottlenecks**: Slow query identification

## 🔮 **Future Enhancements**

### **Scaling Improvements**
- **Auto-scaling**: Dynamic scaling based on load
- **Multi-region**: Global deployment for low latency
- **Edge Computing**: Processing closer to users

### **Advanced Features**
- **Real-time Collaboration**: Multi-user real-time features
- **Advanced Analytics**: ML-powered insights
- **Custom Integrations**: User-defined service integrations

### **Security Enhancements**
- **Zero-trust Architecture**: Enhanced security model
- **Advanced Encryption**: End-to-end encryption
- **Compliance**: GDPR, SOC2, HIPAA compliance

This Cloudflare Workers configuration provides a robust, scalable foundation for the Soen backend with Mira AI integration, supporting all the advanced features we've implemented while maintaining high performance, security, and reliability.
