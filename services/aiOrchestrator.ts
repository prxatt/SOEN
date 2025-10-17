// services/aiOrchestrator.ts
// Complete AI Orchestrator Implementation for Soen

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../src/lib/supabase';

// Enhanced interfaces
interface AIRequest {
  userId: string;
  message: string;
  context: ConversationContext;
  featureType: FeatureType;
  priority: 'low' | 'medium' | 'high';
  files?: FileAttachment[];
}

interface ConversationContext {
  conversationHistory: Array<{role: string; content: string}>;
  userGoals?: Goal[];
  recentTasks?: Task[];
  recentNotes?: Note[];
  userProfile?: UserProfile;
  currentTime?: Date;
  location?: string;
}

type FeatureType = 
  | 'mira_chat'
  | 'task_parsing'
  | 'note_generation'
  | 'note_summary'
  | 'note_autofill'
  | 'mindmap_generation'
  | 'strategic_briefing'
  | 'vision_ocr'
  | 'vision_event_detection'
  | 'calendar_event_parsing'
  | 'research_with_sources'
  | 'gmail_event_extraction'
  | 'completion_summary'
  | 'completion_image';

interface AIResponse {
  content: string;
  sources?: Citation[];
  confidence: number;
  modelUsed: string;
  tokensUsed: number;
  processingTimeMs: number;
  emotions?: {
    detected: string;
    response: string;
  };
  costCents: number;
  cacheHit: boolean;
}

interface Citation {
  number: number;
  url: string;
  title: string;
  relevance: number;
}

interface FileAttachment {
  type: 'image' | 'file';
  base64: string;
  mimeType: string;
  url?: string;
}

interface Goal {
  id: string;
  text: string;
  term: 'Short-term' | 'Medium-term' | 'Long-term';
  status: string;
}

interface Task {
  id: string;
  title: string;
  category: string;
  status: string;
  plannedDuration?: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

interface UserProfile {
  id: string;
  mira_personality_mode: 'supportive' | 'tough_love' | 'analytical' | 'motivational';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  daily_ai_requests: number;
}

type AIModel = 
  | 'gpt-4o-mini'
  | 'claude-3.5-haiku'
  | 'grok-4-fast'
  | 'perplexity-sonar'
  | 'gemini-1.5-flash'
  | 'dall-e-3';

// Usage Tracker Class
class UsageTracker {
  private usageLog: Map<string, any[]> = new Map();

  async logCacheHit(userId: string, featureType: string): Promise<void> {
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        model_used: 'cache',
        operation_type: 'ai_request',
        feature_used: featureType,
        tokens_input: 0,
        tokens_output: 0,
        cost_cents: 0,
        latency_ms: 0,
        cache_hit: true
      });
    } catch (error) {
      console.error('Failed to log cache hit:', error);
    }
  }

  async logUsage(usage: {
    userId: string;
    modelUsed: string;
    featureType: string;
    tokensUsed: number;
    cost: number;
    latencyMs: number;
    cacheHit: boolean;
  }): Promise<void> {
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: usage.userId,
        model_used: usage.modelUsed,
        operation_type: 'ai_request',
        feature_used: usage.featureType,
        tokens_input: Math.floor(usage.tokensUsed * 0.3),
        tokens_output: Math.floor(usage.tokensUsed * 0.7),
        cost_cents: usage.cost,
        latency_ms: usage.latencyMs,
        cache_hit: usage.cacheHit
      });
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }
}

// Quota Exceeded Error
class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

class AIOrchestrator {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private perplexity: OpenAI;
  private grok: OpenAI;
  
  private cache: Map<string, {data: AIResponse; expiry: number}>;
  private usageTracker: UsageTracker;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false 
    });
    this.anthropic = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.perplexity = new OpenAI({ 
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });
    this.grok = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    });
    
    this.cache = new Map();
    this.usageTracker = new UsageTracker();
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    // 1. Check cache first (80% hit rate target)
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      await this.usageTracker.logCacheHit(request.userId, request.featureType);
      return cached;
    }

    // 2. Check user quota
    const canProceed = await this.checkUserQuota(request.userId);
    if (!canProceed) {
      throw new QuotaExceededError('Daily AI request limit reached. Upgrade to Pro for more requests.');
    }

    // 3. Select optimal model based on feature and context
    const model = await this.selectModel(request);
    
    // 4. Execute request with selected model
    let response: AIResponse;
    try {
      response = await this.executeRequest(model, request);
    } catch (error) {
      console.error(`Primary model ${model} failed:`, error);
      // Fallback to Gemini Flash (free tier)
      response = await this.executeFallback(request);
      response.modelUsed = 'gemini-1.5-flash (fallback)';
    }

    // 5. Cache the response
    this.cacheResponse(cacheKey, response, request.featureType);

    // 6. Log usage for cost tracking
    await this.usageTracker.logUsage({
      userId: request.userId,
      modelUsed: response.modelUsed,
      featureType: request.featureType,
      tokensUsed: response.tokensUsed,
      cost: response.costCents,
      latencyMs: Date.now() - startTime,
      cacheHit: false
    });

    // 7. Update user's daily request counter
    await this.incrementUserRequestCount(request.userId);

    return response;
  }

  private async selectModel(request: AIRequest): Promise<AIModel> {
    const { featureType, context, priority } = request;
    const userTier = await this.getUserTier(request.userId);
    const monthlyBudget = await this.getRemainingBudget(request.userId);

    // Feature-specific routing
    switch (featureType) {
      // Quick responses (GPT-4o Mini)
      case 'mira_chat':
        if (this.isSimpleQuery(request.message)) {
          return 'gpt-4o-mini';
        }
        return monthlyBudget.remaining > 5 ? 'claude-3.5-haiku' : 'gpt-4o-mini';

      case 'task_parsing':
      case 'calendar_event_parsing':
      case 'gmail_event_extraction':
        return 'gpt-4o-mini';

      // Vision tasks
      case 'vision_ocr':
      case 'vision_event_detection':
        return 'gpt-4o-mini';

      // Strategic thinking (Claude Haiku)
      case 'note_generation':
      case 'note_autofill':
      case 'strategic_briefing':
        return userTier === 'free' ? 'gpt-4o-mini' : 'claude-3.5-haiku';

      // Complex reasoning (Grok with free credits)
      case 'mindmap_generation':
        if (monthlyBudget.grokCredits > 0) {
          return 'grok-4-fast';
        }
        return 'claude-3.5-haiku';

      // Research with sources (Perplexity)
      case 'research_with_sources':
        return userTier === 'free' ? 'gemini-1.5-flash' : 'perplexity-sonar';

      // Completion & images
      case 'completion_summary':
        return 'claude-3.5-haiku';
        
      case 'completion_image':
        return 'dall-e-3';

      default:
        // Default routing based on complexity
        const complexity = this.analyzeComplexity(request);
        if (complexity === 'low') return 'gpt-4o-mini';
        if (complexity === 'medium') return monthlyBudget.remaining > 3 ? 'claude-3.5-haiku' : 'gpt-4o-mini';
        return monthlyBudget.grokCredits > 0 ? 'grok-4-fast' : 'gemini-1.5-flash';
    }
  }

  private async executeRequest(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    switch (model) {
      case 'gpt-4o-mini':
        return await this.executeOpenAI(request);
      
      case 'claude-3.5-haiku':
        return await this.executeClaude(request);
      
      case 'grok-4-fast':
        return await this.executeGrok(request);
      
      case 'perplexity-sonar':
        return await this.executePerplexity(request);
      
      case 'gemini-1.5-flash':
        return await this.executeGemini(request);
      
      case 'dall-e-3':
        return await this.executeDALLE(request);
      
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  // OpenAI Implementation
  private async executeOpenAI(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const messages = this.buildMessages(request);
    
    // Handle vision requests
    if (request.featureType.startsWith('vision_') && request.files) {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: request.message },
              ...request.files.map(file => ({
                type: 'image_url' as const,
                image_url: { url: `data:${file.mimeType};base64,${file.base64}` }
              }))
            ]
          }
        ],
        max_tokens: 1000
      });

      return {
        content: completion.choices[0].message.content!,
        modelUsed: 'gpt-4o-mini',
        tokensUsed: completion.usage!.total_tokens,
        processingTimeMs: Date.now() - startTime,
        confidence: 0.88,
        costCents: this.calculateCost('gpt-4o-mini', completion.usage!.total_tokens),
        cacheHit: false
      };
    }

    // Regular chat
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      content: completion.choices[0].message.content!,
      modelUsed: 'gpt-4o-mini',
      tokensUsed: completion.usage!.total_tokens,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.85,
      costCents: this.calculateCost('gpt-4o-mini', completion.usage!.total_tokens),
      cacheHit: false
    };
  }

  // Claude Implementation
  private async executeClaude(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const systemPrompt = this.buildSystemPrompt(request);
    const messages = this.buildMessages(request);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      content,
      modelUsed: 'claude-3.5-haiku',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.92,
      costCents: this.calculateCost('claude-3.5-haiku', message.usage.input_tokens + message.usage.output_tokens),
      cacheHit: false
    };
  }

  // Grok Implementation
  private async executeGrok(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const completion = await this.grok.chat.completions.create({
      model: 'grok-4-fast',
      messages: this.buildMessages(request),
      temperature: 0.7
    });

    return {
      content: completion.choices[0].message.content!,
      modelUsed: 'grok-4-fast',
      tokensUsed: completion.usage!.total_tokens,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.90,
      costCents: this.calculateCost('grok-4-fast', completion.usage!.total_tokens),
      cacheHit: false
    };
  }

  // Perplexity Implementation (with citations)
  private async executePerplexity(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const completion = await this.perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are Mira, a helpful AI assistant. Provide detailed answers with citations.'
        },
        ...this.buildMessages(request)
      ]
    });

    const content = completion.choices[0].message.content!;
    const sources = this.extractPerplexitySources(content);

    return {
      content,
      sources,
      modelUsed: 'perplexity-sonar',
      tokensUsed: completion.usage!.total_tokens,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.95,
      costCents: this.calculateCost('perplexity-sonar', completion.usage!.total_tokens),
      cacheHit: false
    };
  }

  // Gemini Implementation (Free Tier Fallback)
  private async executeGemini(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const chat = model.startChat({
      history: request.context.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage(request.message);
    const response = await result.response;

    return {
      content: response.text(),
      modelUsed: 'gemini-1.5-flash',
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.80,
      costCents: 0, // Free tier
      cacheHit: false
    };
  }

  // DALL-E Implementation
  private async executeDALLE(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const image = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: request.message,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    return {
      content: image.data[0].url!,
      modelUsed: 'dall-e-3',
      tokensUsed: 0,
      processingTimeMs: Date.now() - startTime,
      confidence: 0.95,
      costCents: 4, // $0.04 per image
      cacheHit: false
    };
  }

  // Helper Methods
  private buildSystemPrompt(request: AIRequest): string {
    const { featureType, context } = request;
    
    let basePrompt = `You are Mira, an AI assistant for Soen, a productivity platform. You help users manage tasks, notes, goals, and provide strategic insights.`;

    // Add personality based on user's Mira relationship
    if (context.userProfile?.mira_personality_mode) {
      const personalityPrompts = {
        supportive: "Be encouraging, empathetic, and supportive. Celebrate wins and offer gentle guidance.",
        tough_love: "Be direct, challenging, and push the user to their potential. Hold them accountable.",
        analytical: "Be logical, data-driven, and focus on optimization. Provide structured analysis.",
        motivational: "Be energetic, inspiring, and action-oriented. Use motivational language."
      };
      basePrompt += `\n\nPersonality: ${personalityPrompts[context.userProfile.mira_personality_mode]}`;
    }

    // Add feature-specific context
    switch (featureType) {
      case 'task_parsing':
        basePrompt += `\n\nYour task: Parse the user's natural language input into a structured task. Extract title, date/time, duration, location, and any other relevant details. Return JSON format.`;
        break;
      
      case 'note_generation':
        basePrompt += `\n\nYour task: Help the user create comprehensive notes. If they provide minimal information, ask clarifying questions first. Then generate well-structured notes with headers, bullet points, and key takeaways.`;
        break;
      
      case 'strategic_briefing':
        basePrompt += `\n\nYour task: Generate a strategic daily briefing that synthesizes the user's goals, tasks, health data, and recent notes. Provide actionable insights and recommendations.`;
        break;

      case 'mindmap_generation':
        basePrompt += `\n\nYour task: Analyze the user's goals, tasks, and notes to create a mind map showing connections and relationships. Return JSON with nodes and edges.`;
        break;
    }

    // Add user context
    if (context.userGoals && context.userGoals.length > 0) {
      basePrompt += `\n\nUser's Goals:\n${context.userGoals.map(g => `- ${g.term}: ${g.text}`).join('\n')}`;
    }

    if (context.currentTime) {
      basePrompt += `\n\nCurrent time: ${context.currentTime.toLocaleString()}`;
    }

    return basePrompt;
  }

  private buildMessages(request: AIRequest): Array<{role: string; content: string}> {
    const messages: Array<{role: string; content: string}> = [];

    // Add conversation history (last 10 messages for context)
    if (request.context.conversationHistory) {
      const recentHistory = request.context.conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: request.message
    });

    return messages;
  }

  private isSimpleQuery(message: string): boolean {
    const simplePatterns = [
      /^(hi|hello|hey|good morning|good afternoon)/i,
      /^(what is|who is|when is|where is)/i,
      /^(yes|no|ok|okay|sure|thanks)/i
    ];
    
    return message.length < 100 && simplePatterns.some(pattern => pattern.test(message));
  }

  private analyzeComplexity(request: AIRequest): 'low' | 'medium' | 'high' {
    const tokens = this.estimateTokens(request.message + JSON.stringify(request.context));
    const hasDeepContext = request.context.conversationHistory?.length > 5;
    const requiresReasoning = /\b(analyze|compare|explain why|how would|strategy|plan)\b/i.test(request.message);

    if (tokens < 500 && !hasDeepContext && !requiresReasoning) return 'low';
    if (tokens < 2000 || (hasDeepContext && requiresReasoning)) return 'medium';
    return 'high';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private extractPerplexitySources(content: string): Citation[] {
    const sources: Citation[] = [];
    const citationRegex = /\[(\d+)\]\s*(https?:\/\/[^\s]+)/g;
    
    let match;
    while ((match = citationRegex.exec(content)) !== null) {
      sources.push({
        number: parseInt(match[1]),
        url: match[2],
        title: '', // Will be fetched separately if needed
        relevance: 0.9
      });
    }
    
    return sources;
  }

  private calculateCost(model: string, tokens: number): number {
    const costs: Record<string, {input: number; output: number}> = {
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'claude-3.5-haiku': { input: 0.80, output: 4.00 },
      'grok-4-fast': { input: 5.00, output: 15.00 },
      'perplexity-sonar': { input: 5.00, output: 5.00 },
      'gemini-1.5-flash': { input: 0.00, output: 0.00 }
    };

    const modelCost = costs[model.split(' ')[0]] || { input: 0, output: 0 };
    const tokensInMillion = tokens / 1_000_000;
    
    // Rough split: 30% input, 70% output
    const costUSD = (tokensInMillion * 0.3 * modelCost.input) + (tokensInMillion * 0.7 * modelCost.output);
    return Math.round(costUSD * 100); // Return cost in cents
  }

  private generateCacheKey(request: AIRequest): string {
    const messageHash = this.simpleHash(request.message);
    return `${request.featureType}:${messageHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResponse(key: string, response: AIResponse, featureType: FeatureType): void {
    const ttls: Record<string, number> = {
      'mira_chat': 3600,          // 1 hour
      'strategic_briefing': 3600,  // 1 hour (regenerate daily)
      'note_summary': 86400,       // 24 hours
      'mindmap_generation': 3600,  // 1 hour
      'research_with_sources': 7200 // 2 hours
    };

    const ttl = ttls[featureType] || 3600;
    
    this.cache.set(key, {
      data: response,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  private async checkUserQuota(userId: string): Promise<boolean> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, daily_ai_requests')
      .eq('user_id', userId)
      .single();

    if (!profile) return false;

    const limits: Record<string, number> = {
      'free': 5,
      'pro': 50,
      'enterprise': 200
    };

    const userLimit = limits[profile.subscription_tier] || 5;
    return profile.daily_ai_requests < userLimit;
  }

  private async incrementUserRequestCount(userId: string): Promise<void> {
    await supabase.rpc('increment_ai_requests', { p_user_id: userId });
  }

  private async getUserTier(userId: string): Promise<string> {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();
    
    return data?.subscription_tier || 'free';
  }

  private async getRemainingBudget(userId: string): Promise<{remaining: number; grokCredits: number}> {
    const { data: usage } = await supabase
      .from('daily_ai_usage_summary')
      .select('total_cost_cents')
      .eq('user_id', userId)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .sum('total_cost_cents');

    const totalSpent = usage?.total_cost_cents || 0;
    
    const { data: grokUsage } = await supabase
      .from('ai_usage_logs')
      .select('cost_cents')
      .eq('user_id', userId)
      .eq('model_used', 'grok-4-fast')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .sum('cost_cents');

    const grokSpent = grokUsage?.cost_cents || 0;
    const grokCreditsRemaining = Math.max(0, 2500 - grokSpent); // $25 in cents

    return {
      remaining: Math.max(0, 1500 - totalSpent), // $15 budget in cents
      grokCredits: grokCreditsRemaining
    };
  }

  private async executeFallback(request: AIRequest): Promise<AIResponse> {
    return await this.executeGemini(request);
  }
}

export const aiOrchestrator = new AIOrchestrator();