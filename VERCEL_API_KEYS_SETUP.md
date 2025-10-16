# 🚀 Vercel API Keys Setup Guide

## Setting up API Keys on Vercel (Production-Safe)

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com) and sign in
2. Navigate to your Soen project
3. Go to **Settings** → **Environment Variables**

### **Step 2: Add Environment Variables**
Add these environment variables in Vercel:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_SUPABASE_URL=https://afowfefzjonwbqtthacq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3dmZWZ6am9ud2JxdHRoYWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcyMTQsImV4cCI6MjA3MjA5MzIxNH0.3V2q6dfsG-JB8HRxEvwXW0Nt9duVMUMtQrZH-ENSyqg
```

### **Step 3: Environment Settings**
- **Environment**: Select "Production", "Preview", and "Development"
- **Value**: Your actual API key
- **Description**: Brief description of what the key is for

### **Step 4: Redeploy**
After adding the environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

### **Step 5: Verify API Keys Work**
After deployment, check your app's console for:
- ✅ No more "API key not found" errors
- ✅ AI services working properly
- ✅ Enhanced fallback only used when needed

## 🔐 Security Best Practices

### **Never Commit API Keys**
- ✅ Use Vercel environment variables
- ✅ Use `VITE_` prefix for client-side variables
- ❌ Never put API keys in `.env` files that get committed
- ❌ Never put API keys in your code

### **API Key Sources**
- **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Groq**: [Groq Console](https://console.groq.com/keys)

### **Testing Locally**
For local development, create a `.env.local` file (not committed):
```
VITE_GEMINI_API_KEY=your_local_key
VITE_OPENAI_API_KEY=your_local_key
VITE_GROQ_API_KEY=your_local_key
```

## 🎯 Next Steps After Setup

1. **Deploy with API Keys**: Redeploy your Vercel app
2. **Test AI Features**: Try Mira AI chat and strategic briefings
3. **Monitor Usage**: Check AI usage logs in your Supabase dashboard
4. **Optimize Costs**: Review AI usage patterns and optimize

## 📊 Expected Results

After setting up API keys:
- ✅ Strategic briefings will work with real AI
- ✅ Mira AI chat will have intelligent responses
- ✅ Task parsing will be more accurate
- ✅ AI usage tracking will show real costs
- ✅ Enhanced fallback will only trigger on actual failures

Your Soen app will be fully AI-powered! 🚀
