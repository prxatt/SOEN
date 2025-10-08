# Praxis-AI Backend - Local Development Setup

## 🎉 **SUCCESS! Your backend is now running locally**

The Praxis-AI backend is successfully running at **http://localhost:3000**

## 📋 **Current Status**

✅ **Backend Server**: Running on http://localhost:3000  
✅ **Health Check**: http://localhost:3000/health  
✅ **API Documentation**: http://localhost:3000/docs  
✅ **Basic Endpoints**: Working correctly  

## 🚀 **Available Commands**

### **Quick Start (Current)**
```bash
npm run dev:simple
```
- Runs basic server with health check and docs
- No AI features (no API keys required)
- Perfect for testing basic functionality

### **Full Development (With AI)**
```bash
npm run dev:full
```
- Runs complete tRPC API with AI orchestrator
- Requires API keys in .env file
- Full AI features available

### **Other Commands**
```bash
npm test              # Run tests
npm run build         # Build for production
npm run type-check    # TypeScript checking
npm run lint          # Code linting
```

## 🔧 **Environment Setup**

### **Current .env File**
Your `.env` file is configured with placeholder values. To enable full AI features:

```bash
# Database (Required for full features)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Services (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROK_API_KEY=your_grok_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## 🌐 **Available Endpoints**

### **Basic Endpoints (Currently Working)**
- `GET /` - API information and status
- `GET /health` - Health check endpoint
- `GET /docs` - API documentation

### **Full tRPC API (When configured)**
- `POST /trpc/ai.processRequest` - Process any AI request
- `POST /trpc/ai.chatWithKiko` - Chat with Kiko AI assistant
- `POST /trpc/ai.parseTask` - Parse natural language to structured task
- `POST /trpc/ai.generateStrategicBriefing` - Generate daily strategic briefing
- `POST /trpc/ai.generateMindMap` - Generate mind map from goals/tasks/notes
- `POST /trpc/ai.researchWithSources` - Research with web sources
- `POST /trpc/ai.analyzeImage` - Analyze images with AI
- `GET /trpc/ai.getUsageStats` - Get user AI usage statistics

## 🧪 **Testing Your Setup**

### **Test Basic Functionality**
```bash
# Test root endpoint
curl http://localhost:3000/

# Test health check
curl http://localhost:3000/health

# Test documentation
curl http://localhost:3000/docs
```

### **Test Full AI Features (After API key setup)**
```bash
# Test Kiko chat
curl -X POST http://localhost:3000/trpc/ai.chatWithKiko \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Kiko!", "personalityMode": "supportive"}'

# Test task parsing
curl -X POST http://localhost:3000/trpc/ai.parseTask \
  -H "Content-Type: application/json" \
  -d '{"naturalLanguageInput": "Call mom tomorrow at 2pm"}'
```

## 🔄 **Next Steps**

### **Option 1: Continue with Basic Setup**
- Your backend is working perfectly for basic functionality
- Great for frontend development and testing
- No API keys required

### **Option 2: Enable Full AI Features**
1. **Get API Keys**: Sign up for AI services (OpenAI, Anthropic, etc.)
2. **Update .env**: Add your real API keys
3. **Run Full Server**: `npm run dev:full`
4. **Test AI Features**: Use the tRPC endpoints

### **Option 3: Database Setup (Optional)**
1. **Install Supabase**: `npm install -g supabase`
2. **Start Supabase**: `supabase start`
3. **Run Migrations**: `supabase db reset`
4. **Generate Types**: `npm run db:generate-types`

## 📚 **Documentation**

- **AI Orchestrator Guide**: `./AI_ORCHESTRATOR_GUIDE.md`
- **Enhanced AI Services**: `./ENHANCED_AI_SERVICES_GUIDE.md`
- **tRPC Setup Guide**: `./TRPC_SETUP_GUIDE.md`

## 🎯 **What's Working Right Now**

✅ **Backend Server**: Running on localhost:3000  
✅ **Health Monitoring**: `/health` endpoint  
✅ **API Documentation**: `/docs` endpoint  
✅ **CORS Configuration**: Ready for frontend integration  
✅ **Error Handling**: Proper error responses  
✅ **TypeScript**: Full type safety  
✅ **Testing**: All tests passing  

## 🚀 **Ready for Frontend Integration**

Your backend is now ready to be integrated with your React frontend! The CORS is configured for `http://localhost:5173` (typical Vite dev server port).

---

**🎉 Congratulations! Your Praxis-AI backend is successfully running locally!**
