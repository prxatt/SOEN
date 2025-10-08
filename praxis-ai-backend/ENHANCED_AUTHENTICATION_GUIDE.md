# 🔐 Enhanced Authentication System for Praxis-AI

## 🎯 **Overview**

The Praxis-AI authentication system provides comprehensive security, subscription management, and feature gating specifically designed for the productivity platform's unique requirements.

## 🏗️ **Architecture**

### **Core Components**

1. **PraxisUserProfile** - Extended user profiles with Praxis-specific fields
2. **SubscriptionManager** - Handles tier management and usage tracking
3. **FeatureGate** - Controls access to widgets and features
4. **AISecurityService** - Secures AI interactions and data
5. **Enhanced Context** - Provides authentication context to all procedures

### **Authentication Flow**

```
User Request → Token Validation → PraxisAuthContext Creation → Feature Gating → AI Security → Response
```

## 📋 **Subscription Tiers**

### **Free Tier**
- **AI Requests**: 10 per day
- **Projects**: 3 maximum
- **Notes**: 50 maximum
- **Widgets**: schedule, calendar, weather, actions
- **Features**: basic_chat, simple_insights
- **Themes**: default, obsidian

### **Pro Tier**
- **AI Requests**: 100 per day
- **Projects**: 25 maximum
- **Notes**: 1000 maximum
- **Widgets**: All widgets available
- **Features**: advanced_chat, mind_mapping, strategic_briefings, custom_themes
- **Themes**: All themes available
- **Mind Maps**: 50 per month
- **Priority Support**: Yes

### **Team Tier**
- **AI Requests**: 500 per day
- **Projects**: Unlimited
- **Notes**: Unlimited
- **Widgets**: All widgets available
- **Features**: All features available
- **Themes**: All themes available
- **Mind Maps**: Unlimited
- **Priority Support**: Yes

## 🔒 **Security Features**

### **AI Request Security**
- **Prompt Sanitization**: Removes harmful content and jailbreak attempts
- **Request Validation**: Validates user input and file uploads
- **Rate Limiting**: Prevents abuse with daily limits
- **Audit Logging**: Tracks all AI interactions for security

### **Data Encryption**
- **AES-256-GCM**: Encrypts sensitive user data
- **Key Management**: Secure API key storage
- **Field-Level Encryption**: Encrypts specific sensitive fields
- **Key Rotation**: Automatic key rotation every 30 days

### **Access Control**
- **Row Level Security**: Database-level access control
- **Feature Gating**: Subscription-based feature access
- **Widget Access Control**: Tier-based widget availability
- **Theme Unlock System**: Flow points-based theme unlocking

## 🚀 **API Endpoints**

### **Authentication Router (`/trpc/auth.*`)**

#### **Profile Management**
- `getProfile` - Get user profile
- `updateProfile` - Update user profile
- `getGamificationStatus` - Get gamification data

#### **Subscription Management**
- `getSubscription` - Get subscription details
- `upgradeSubscription` - Upgrade subscription tier
- `downgradeSubscription` - Downgrade subscription tier

#### **Feature Access Control**
- `checkFeatureAccess` - Check feature access
- `checkWidgetAccess` - Check widget access
- `getRateLimit` - Get rate limit status

#### **Theme Management**
- `getAvailableThemes` - Get available themes
- `unlockTheme` - Unlock theme with flow points

#### **Integrations**
- `getIntegrations` - Get integration status
- `updateIntegrations` - Update integration settings

### **AI Orchestrator Router (`/trpc/ai.*`)**

All AI endpoints now use `aiRequestProcedure` with:
- **Rate Limiting**: Automatic daily limit checking
- **Security Validation**: Prompt sanitization and validation
- **Audit Logging**: Complete interaction tracking
- **Feature Gating**: Subscription-based access control

## 🛡️ **Security Middleware**

### **Procedures**

#### **`praxisProcedure`**
- Requires PraxisAuthContext
- Provides full authentication context
- Used for general Praxis features

#### **`aiRequestProcedure`**
- Requires authentication
- Checks AI rate limits
- Validates requests
- Logs interactions
- Used for all AI endpoints

#### **`widgetProcedure`**
- Requires authentication
- Checks widget access
- Validates subscription tier
- Used for widget-specific endpoints

### **Feature Gating**

```typescript
// Check widget access
await ctx.featureGate.checkWidgetAccess(userId, 'insights');

// Check AI rate limits
await ctx.featureGate.checkAIRateLimit(userId);

// Check project limits
await ctx.featureGate.checkProjectLimit(userId);

// Check feature access
await ctx.featureGate.checkFeatureAccess(userId, 'mind_mapping');
```

## 📊 **Usage Tracking**

### **AI Usage**
- **Daily Limits**: Tracked per user per day
- **Monthly Aggregation**: Summarized usage statistics
- **Cost Tracking**: Monitor AI request costs
- **Model Usage**: Track which models are used

### **Resource Limits**
- **Project Count**: Track active projects
- **Note Count**: Track total notes
- **Mind Map Count**: Track monthly mind maps
- **Theme Unlocks**: Track purchased themes

## 🎮 **Gamification Integration**

### **Flow Points System**
- **Earn Points**: Complete tasks, maintain streaks
- **Spend Points**: Unlock themes, premium features
- **Streak Tracking**: Daily activity streaks
- **Rewards**: Unlockable themes and features

### **Theme Unlock Requirements**
```typescript
const THEME_UNLOCK_REQUIREMENTS = {
  'default': { tier: 'free', flowPoints: 0 },
  'obsidian': { tier: 'free', flowPoints: 0 },
  'synthwave': { tier: 'free', flowPoints: 100 },
  'minimal': { tier: 'pro', flowPoints: 0 },
  'dark-matrix': { tier: 'pro', flowPoints: 500 },
  'neon-cyber': { tier: 'pro', flowPoints: 1000 },
  'custom': { tier: 'pro', flowPoints: 0, requiresPro: true }
};
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROK_API_KEY=your_grok_key
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### **Database Schema**
The authentication system uses the comprehensive database schema with:
- **profiles** table with Praxis-specific fields
- **ai_usage_logs** for tracking AI interactions
- **daily_ai_usage_summary** for rate limiting
- **Row Level Security** policies for data isolation

## 🧪 **Testing**

### **Test Authentication**
```bash
# Test profile access
curl -X POST http://localhost:3000/trpc/auth.getProfile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test subscription status
curl -X POST http://localhost:3000/trpc/auth.getSubscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **Test AI Security**
```bash
# Test AI request with rate limiting
curl -X POST http://localhost:3000/trpc/ai.chatWithKiko \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Kiko!"}'
```

### **Test Feature Gating**
```bash
# Test widget access
curl -X POST http://localhost:3000/trpc/auth.checkWidgetAccess \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"widget": "insights"}'
```

## 🚀 **Deployment**

### **Production Setup**
1. **Configure Environment**: Set all required environment variables
2. **Database Migration**: Run the comprehensive schema migration
3. **Security Review**: Review encryption and access controls
4. **Rate Limiting**: Configure appropriate rate limits
5. **Monitoring**: Set up audit logging and monitoring

### **Security Checklist**
- ✅ Row Level Security enabled
- ✅ Encryption configured
- ✅ Rate limiting active
- ✅ Audit logging enabled
- ✅ Feature gating implemented
- ✅ API key management secure
- ✅ Prompt sanitization active

## 📈 **Monitoring & Analytics**

### **Security Metrics**
- **Failed Authentication Attempts**
- **Rate Limit Violations**
- **Suspicious AI Requests**
- **Data Access Patterns**

### **Usage Analytics**
- **Subscription Tier Distribution**
- **Feature Usage Patterns**
- **AI Request Costs**
- **User Engagement Metrics**

## 🎉 **Success!**

Your Praxis-AI backend now has a **production-ready authentication system** with:

- 🔐 **Enterprise Security** - Encryption, audit logging, access control
- 💳 **Subscription Management** - Tier-based features and limits
- 🚦 **Feature Gating** - Intelligent access control
- 🤖 **AI Security** - Secure AI interactions with rate limiting
- 🎮 **Gamification** - Flow points and theme unlock system
- 📊 **Usage Tracking** - Comprehensive analytics and monitoring

**Your authentication system is ready for production deployment!** 🚀
