# Soen Environment Configuration Guide

This comprehensive environment configuration file (`soen.env.example`) provides all necessary environment variables for the Soen backend with Mira AI integration.

## 🎯 **Configuration Overview**

The environment file includes configuration for:
- **Mira AI Services** (OpenAI, Gemini, Claude, Grok, Perplexity)
- **Voice Services** (ElevenLabs, Deepgram, OpenAI Realtime)
- **Vision AI** (OpenAI Vision, Google Vision)
- **Integrations** (Gmail, Notion, Google Calendar, Google Drive)
- **Security** (JWT, Encryption, CORS, Rate Limiting)
- **Cloudflare Workers** (KV, R2, Durable Objects)
- **Monitoring** (Sentry, Analytics, Logging)

## 🚀 **Quick Setup**

### **1. Copy Environment File**
```bash
cp soen.env.example .env
```

### **2. Fill in Required Values**
Edit `.env` with your actual API keys and configuration values.

### **3. Set Environment**
```bash
# Development
export NODE_ENV=development

# Production
export NODE_ENV=production
```

## 📋 **Required API Keys**

### **Essential Services**
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **OpenAI**: `OPENAI_API_KEY` (Primary AI service)
- **JWT Secret**: `JWT_SECRET` (Minimum 32 characters)

### **Mira AI Services**
- **OpenAI**: `OPENAI_API_KEY` (Required)
- **Gemini**: `GEMINI_API_KEY` (Optional)
- **Anthropic**: `ANTHROPIC_API_KEY` (Optional)
- **Grok**: `GROK_API_KEY` (Optional)
- **Perplexity**: `PERPLEXITY_API_KEY` (Optional)

### **Voice Services**
- **ElevenLabs**: `ELEVENLABS_API_KEY` (Voice synthesis)
- **Deepgram**: `DEEPGRAM_API_KEY` (Speech recognition)
- **OpenAI Realtime**: `OPENAI_REALTIME_API_KEY` (Voice conversation)

### **Integrations**
- **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Notion**: `NOTION_API_KEY`
- **Google Calendar**: `GOOGLE_CALENDAR_API_KEY`
- **Google Drive**: `GOOGLE_DRIVE_API_KEY`

## 🔧 **Service-Specific Configuration**

### **Mira AI Configuration**
```env
# Personality Settings
MIRA_PERSONALITY_MODES=supportive,tough_love,analytical,motivational
MIRA_VOICE_PREFERENCES=neutral,energetic,calm,professional
MIRA_DEFAULT_PERSONALITY=supportive
MIRA_DEFAULT_VOICE=neutral

# Response Configuration
MIRA_MAX_CONVERSATION_LENGTH=50
MIRA_RESPONSE_TIMEOUT=30000
MIRA_MAX_RETRIES=3
MIRA_CONFIDENCE_THRESHOLD=0.8
```

### **Voice Services Configuration**
```env
# ElevenLabs Settings
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.5

# Deepgram Settings
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US
DEEPGRAM_ENCODING=linear16
DEEPGRAM_SAMPLE_RATE=16000
```

### **Security Configuration**
```env
# JWT Settings
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Encryption Settings
ENCRYPTION_MASTER_KEY=your-master-encryption-key-32-chars-min
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_IV_LENGTH=12

# CORS Settings
CORS_ORIGIN=https://soen.app,https://app.soen.com,https://localhost:3000
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

## 🌐 **Environment-Specific Settings**

### **Development Environment**
```env
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug
SENTRY_SAMPLE_RATE=1.0
PERFORMANCE_SAMPLE_RATE=0.1
```

### **Staging Environment**
```env
NODE_ENV=staging
DEBUG_MODE=true
LOG_LEVEL=info
SENTRY_SAMPLE_RATE=0.5
PERFORMANCE_SAMPLE_RATE=0.05
```

### **Production Environment**
```env
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=warn
SENTRY_SAMPLE_RATE=0.1
PERFORMANCE_SAMPLE_RATE=0.01
```

## 🔐 **Security Best Practices**

### **API Key Management**
- **Never commit** `.env` files to version control
- **Use environment-specific** keys for different environments
- **Rotate keys regularly** for security
- **Use least privilege** principle for API permissions

### **Secret Generation**
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate encryption key
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

### **Environment Isolation**
- **Separate keys** for development, staging, and production
- **Different databases** for each environment
- **Isolated API quotas** per environment
- **Environment-specific monitoring**

## 📊 **Monitoring Configuration**

### **Sentry Error Monitoring**
```env
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0
SENTRY_SAMPLE_RATE=1.0
```

### **Analytics Configuration**
```env
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=60000
```

### **Logging Configuration**
```env
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

## 🚀 **Cloudflare Workers Configuration**

### **KV Namespaces**
```env
CLOUDFLARE_SOEN_CACHE_KV_ID=your-kv-namespace-id
CLOUDFLARE_MIRA_SESSIONS_KV_ID=your-sessions-kv-id
CLOUDFLARE_USER_PREFERENCES_KV_ID=your-preferences-kv-id
CLOUDFLARE_RATE_LIMITS_KV_ID=your-rate-limits-kv-id
```

### **R2 Buckets**
```env
CLOUDFLARE_USER_FILES_R2_ID=your-user-files-bucket-id
CLOUDFLARE_MIRA_VOICE_CACHE_R2_ID=your-voice-cache-bucket-id
CLOUDFLARE_VISION_AI_CACHE_R2_ID=your-vision-cache-bucket-id
CLOUDFLARE_NOTION_SYNC_CACHE_R2_ID=your-notion-cache-bucket-id
```

## 🔄 **Feature Flags**

### **Enable/Disable Features**
```env
FEATURE_VOICE_CONVERSATION=true
FEATURE_VISION_AI=true
FEATURE_GMAIL_INTEGRATION=true
FEATURE_NOTION_SYNC=true
FEATURE_CALENDAR_INTEGRATION=true
FEATURE_GOOGLE_DRIVE_INTEGRATION=true
FEATURE_PUSH_NOTIFICATIONS=true
FEATURE_EMAIL_NOTIFICATIONS=true
FEATURE_ANALYTICS=true
FEATURE_AUDIT_LOGGING=true
```

### **Mira AI Feature Flags**
```env
MIRA_ENABLE_VOICE_CONVERSATION=true
MIRA_ENABLE_VISION_AI=true
MIRA_ENABLE_GMAIL_INTEGRATION=true
MIRA_ENABLE_NOTION_SYNC=true
MIRA_ENABLE_CALENDAR_INTEGRATION=true
```

## 📈 **Performance Configuration**

### **Database Connection Pool**
```env
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### **Cache Configuration**
```env
CACHE_TTL_SECONDS=3600
CACHE_MAX_SIZE_MB=100
CACHE_CLEANUP_INTERVAL=300000
```

### **Rate Limiting**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

## 🔧 **Integration Configuration**

### **Gmail Integration**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://soen.app/auth/google/callback
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_TOPIC=gmail-notifications
```

### **Notion Integration**
```env
NOTION_API_KEY=secret_your-notion-integration-token
NOTION_VERSION=2022-06-28
NOTION_SYNC_INTERVAL=300000
```

### **Calendar Integration**
```env
GOOGLE_CALENDAR_API_KEY=your-google-calendar-api-key
GOOGLE_CALENDAR_SYNC_INTERVAL=600000
```

## 📧 **Email & Notifications**

### **SMTP Configuration**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Push Notifications**
```env
FCM_SERVER_KEY=your-firebase-server-key
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=your-firebase-client-email
```

## 🔄 **Cron Jobs Configuration**

### **Automated Tasks**
```env
CRON_DAILY_BRIEFING=0 7 * * *
CRON_HOURLY_RESET=0 * * * *
CRON_DAILY_CLEANUP=0 0 * * *
CRON_DAILY_BACKUP=0 2 * * *
CRON_WEEKLY_ANALYTICS=0 6 * * 1
CRON_MONTHLY_INSIGHTS=0 0 1 * *
```

## 🧪 **Testing Configuration**

### **Test Environment**
```env
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/soen_test
TEST_REDIS_URL=redis://localhost:6379/1
```

### **Development Tools**
```env
DEBUG_SQL_QUERIES=false
DEBUG_AI_REQUESTS=true
DEBUG_VOICE_SESSIONS=true
HOT_RELOAD_ENABLED=true
HOT_RELOAD_PORT=3001
```

## 🔒 **Compliance & Security**

### **GDPR Compliance**
```env
GDPR_ENABLED=true
GDPR_DATA_RETENTION_DAYS=2555
GDPR_AUTO_DELETE_ENABLED=true
```

### **Security Headers**
```env
SECURITY_HEADERS_ENABLED=true
SECURITY_CSP_ENABLED=true
SECURITY_HSTS_ENABLED=true
```

### **Audit Logging**
```env
AUDIT_LOGGING_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_LEVEL=info
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All required API keys configured
- [ ] Environment-specific settings applied
- [ ] Security settings enabled
- [ ] Monitoring configured
- [ ] Feature flags set appropriately

### **Production Deployment**
- [ ] `NODE_ENV=production`
- [ ] `DEBUG_MODE=false`
- [ ] `LOG_LEVEL=warn`
- [ ] `SENTRY_SAMPLE_RATE=0.1`
- [ ] `PERFORMANCE_SAMPLE_RATE=0.01`
- [ ] All security headers enabled
- [ ] Rate limiting configured
- [ ] Backup configuration verified

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Check API quotas
- [ ] Verify all integrations working
- [ ] Test Mira AI responses
- [ ] Confirm voice services operational
- [ ] Validate vision AI processing

## 🔮 **Advanced Configuration**

### **Custom AI Models**
```env
# Use specific models for different tasks
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### **Custom Voice Settings**
```env
# Fine-tune voice parameters
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.5
DEEPGRAM_MODEL=nova-2
```

### **Custom Integration Settings**
```env
# Adjust sync intervals
NOTION_SYNC_INTERVAL=300000
GOOGLE_CALENDAR_SYNC_INTERVAL=600000
GOOGLE_DRIVE_SYNC_INTERVAL=300000
```

This comprehensive environment configuration ensures Soen operates securely and efficiently across all environments, with Mira AI providing intelligent assistance to users while maintaining the highest standards of security and performance.
