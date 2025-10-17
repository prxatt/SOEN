// api/ai/chat.ts
// Server-side AI chat endpoint

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required for database connection');
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side operations');
}

// AI clients with environment validation
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required for AI functionality');
}

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required for AI functionality');
}

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required for AI functionality');
}

const openai = new OpenAI({ 
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: false 
});

const anthropic = new Anthropic({ 
  apiKey: anthropicApiKey 
});

const gemini = new GoogleGenerativeAI(geminiApiKey);

// User profile cache to reduce database calls
interface CachedProfile {
  subscription_tier: string;
  daily_ai_requests: number;
  cachedAt: number;
  ttl: number;
}

const userProfileCache = new Map<string, CachedProfile>();
const userLocks = new Map<string, Promise<void>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Get user profile with caching
async function getUserProfile(userId: string): Promise<{subscription_tier: string; daily_ai_requests: number}> {
  const cached = userProfileCache.get(userId);
  const now = Date.now();
  
  // Return cached data if still valid
  if (cached && (now - cached.cachedAt) < cached.ttl) {
    return {
      subscription_tier: cached.subscription_tier,
      daily_ai_requests: cached.daily_ai_requests
    };
  }
  
  // Ensure only one in-flight fetch per user (simple per-user mutex)
  const prev = userLocks.get(userId) || Promise.resolve();
  let release: () => void;
  const next = new Promise<void>(resolve => (release = resolve));
  userLocks.set(userId, prev.then(() => next));
  await prev;

  try {
    // Re-check cache after waiting (another request may have filled it)
    const cachedAfterWait = userProfileCache.get(userId);
    if (cachedAfterWait && (Date.now() - cachedAfterWait.cachedAt) < cachedAfterWait.ttl) {
      return {
        subscription_tier: cachedAfterWait.subscription_tier,
        daily_ai_requests: cachedAfterWait.daily_ai_requests
      };
    }

    // Fetch from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, daily_ai_requests')
      .eq('user_id', userId)
      .single();
  
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  // Cache the result
  userProfileCache.set(userId, {
    subscription_tier: profile.subscription_tier,
    daily_ai_requests: profile.daily_ai_requests,
    cachedAt: now,
    ttl: CACHE_TTL
  });
  
  return profile;
  } finally {
    release!();
    // Clean up completed lock chains to avoid memory leaks
    userLocks.delete(userId);
    // On-demand cache cleanup for expired entries
    const now2 = Date.now();
    for (const [uid, cached] of userProfileCache.entries()) {
      if ((now2 - cached.cachedAt) >= cached.ttl) {
        userProfileCache.delete(uid);
      }
    }
  }
}

// Invalidate user profile cache (call this when user profile is updated)
export function invalidateUserProfileCache(userId: string): void {
  userProfileCache.delete(userId);
  console.log(`Cache invalidated for user: ${userId}`);
}

// Get cache statistics for monitoring
export function getCacheStats(): { size: number; entries: Array<{userId: string; cachedAt: number; ttl: number}> } {
  const entries = Array.from(userProfileCache.entries()).map(([userId, cached]) => ({
    userId,
    cachedAt: cached.cachedAt,
    ttl: cached.ttl
  }));
  
  return {
    size: userProfileCache.size,
    entries
  };
}

// Removed setInterval to avoid background timers in serverless environments.

// Encryption utilities (server-side only)
import { encryptText, decryptText, validateEncryptionConfig } from '../lib/encryption';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, message, context, featureType, priority, files } = req.body;

    // Validate request
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user quota (with caching)
    const profile = await getUserProfile(userId);

    const limits: Record<string, number> = {
      'free': 5,
      'pro': 50,
      'enterprise': 200
    };

    const userLimit = limits[profile.subscription_tier] || 5;
    if (profile.daily_ai_requests >= userLimit) {
      return res.status(429).json({ error: 'Daily AI request limit reached' });
    }

    // Select model based on feature type and user tier
    let model = 'gpt-4o-mini'; // Default
    if (featureType === 'strategic_briefing' && profile.subscription_tier !== 'free') {
      model = 'claude-3.5-haiku';
    }

    // Execute AI request
    let aiResponse;
    const startTime = Date.now();

    try {
      switch (model) {
        case 'gpt-4o-mini':
          aiResponse = await executeOpenAI(message, context, files);
          break;
        case 'claude-3.5-haiku':
          aiResponse = await executeClaude(message, context);
          break;
        default:
          aiResponse = await executeGemini(message, context);
      }
    } catch (error) {
      console.error('AI request failed:', error);
      // Fallback to Gemini
      aiResponse = await executeGemini(message, context);
      aiResponse.modelUsed = 'gemini-1.5-flash (fallback)';
    }

    // Log usage and increment request count
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey!);
    await supabaseClient.from('ai_usage_logs').insert({
      user_id: userId,
      model_used: aiResponse.modelUsed,
      operation_type: 'ai_request',
      feature_used: featureType,
      tokens_input: Math.floor(aiResponse.tokensUsed * 0.3),
      tokens_output: Math.floor(aiResponse.tokensUsed * 0.7),
      cost_cents: aiResponse.costCents,
      latency_ms: Date.now() - startTime,
      cache_hit: false
    });

    await supabaseClient.rpc('increment_ai_requests', { p_user_id: userId });
    
    // Update cache with new request count
    const cached = userProfileCache.get(userId);
    if (cached) {
      cached.daily_ai_requests += 1;
      cached.cachedAt = Date.now(); // Reset cache timestamp
    }

    res.status(200).json(aiResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function executeOpenAI(message: string, context: any, files?: any[]): Promise<any> {
  const messages = buildMessages(message, context);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 1000
  });

  return {
    content: completion.choices[0].message.content!,
    modelUsed: 'gpt-4o-mini',
    tokensUsed: completion.usage!.total_tokens,
    confidence: 0.85,
    costCents: calculateCost('gpt-4o-mini', completion.usage!.total_tokens),
    cacheHit: false
  };
}

async function executeClaude(message: string, context: any): Promise<any> {
  const systemPrompt = buildSystemPrompt(context);
  const messages = buildMessages(message, context).filter(msg => msg.role !== 'system');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as Array<{role: 'user' | 'assistant'; content: string}>
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    content,
    modelUsed: 'claude-3.5-haiku',
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    confidence: 0.92,
    costCents: calculateCost('claude-3.5-haiku', response.usage.input_tokens + response.usage.output_tokens),
    cacheHit: false
  };
}

async function executeGemini(message: string, context: any): Promise<any> {
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const chat = model.startChat({
    history: context.conversationHistory?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || []
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;

  return {
    content: response.text(),
    modelUsed: 'gemini-1.5-flash',
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    confidence: 0.80,
    costCents: 0, // Free tier
    cacheHit: false
  };
}

function buildSystemPrompt(context: any): string {
  let basePrompt = `You are Mira, an AI assistant for Soen, a productivity platform. You help users manage tasks, notes, goals, and provide strategic insights.`;

  if (context.userProfile?.mira_personality_mode) {
    const personalityPrompts = {
      supportive: "Be encouraging, empathetic, and supportive. Celebrate wins and offer gentle guidance.",
      tough_love: "Be direct, challenging, and push the user to their potential. Hold them accountable.",
      analytical: "Be logical, data-driven, and focus on optimization. Provide structured analysis.",
      motivational: "Be energetic, inspiring, and action-oriented. Use motivational language."
    };
    basePrompt += `\n\nPersonality: ${personalityPrompts[context.userProfile.mira_personality_mode]}`;
  }

  if (context.userGoals && context.userGoals.length > 0) {
    basePrompt += `\n\nUser's Goals:\n${context.userGoals.map((g: any) => `- ${g.term}: ${g.text}`).join('\n')}`;
  }

  if (context.currentTime) {
    basePrompt += `\n\nCurrent time: ${context.currentTime.toLocaleString()}`;
  }

  return basePrompt;
}

function buildMessages(message: string, context: any): Array<{role: 'user' | 'assistant' | 'system'; content: string}> {
  const messages: Array<{role: 'user' | 'assistant' | 'system'; content: string}> = [];

  if (context.conversationHistory) {
    const recentHistory = context.conversationHistory.slice(-10);
    messages.push(...recentHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    })));
  }

  messages.push({
    role: 'user',
    content: message
  });

  return messages;
}

/**
 * Calculate the cost of AI model usage based on tokens
 * @param model - The AI model name
 * @param tokens - Number of tokens used
 * @returns Cost in cents
 */
function calculateCost(model: string, tokens: number): number {
  // Comprehensive cost mapping for all supported AI models
  const costs: Record<string, {input: number; output: number}> = {
    // OpenAI Models
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    
    // Anthropic Models
    'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3.5-haiku': { input: 0.80, output: 4.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
    'claude-3-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    
    // Google Models
    'gemini-2.5-flash': { input: 0.00, output: 0.00 },
    'gemini-1.5-flash': { input: 0.00, output: 0.00 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-pro': { input: 0.50, output: 1.50 },
    
    // Grok Models
    'grok-beta': { input: 0.00, output: 0.00 },
    'grok-2': { input: 0.00, output: 0.00 },
    
    // Perplexity Models
    'llama-3.1-sonar': { input: 0.20, output: 0.20 },
    'llama-3.1-sonar-large': { input: 0.20, output: 0.20 },
    
    // DALL-E Models
    'dall-e-3': { input: 0.00, output: 0.00 }, // Per image pricing
    'dall-e-2': { input: 0.00, output: 0.00 }, // Per image pricing
  };

  // Robust model name parsing - handle various formats
  const normalizedModel = normalizeModelName(model);
  const modelCost = costs[normalizedModel];
  
  if (!modelCost) {
    console.warn(`Unknown model "${model}" (normalized: "${normalizedModel}"), using default cost`);
    // Default to a reasonable cost for unknown models
    return Math.round((tokens / 1_000_000) * 1.00 * 100); // $1 per million tokens
  }

  const tokensInMillion = tokens / 1_000_000;
  
  // Calculate cost based on typical input/output ratio (30% input, 70% output)
  const costUSD = (tokensInMillion * 0.3 * modelCost.input) + (tokensInMillion * 0.7 * modelCost.output);
  return Math.round(costUSD * 100);
}

/**
 * Normalize model name to match cost mapping
 * @param model - Raw model name from API
 * @returns Normalized model name
 */
function normalizeModelName(model: string): string {
  if (!model) return 'unknown';
  
  // Convert to lowercase and handle common variations
  const normalized = model.toLowerCase().trim();
  
  // Handle OpenAI models with version numbers
  if (normalized.includes('gpt-4o')) {
    if (normalized.includes('mini')) return 'gpt-4o-mini';
    return 'gpt-4o';
  }
  
  // Handle Claude models
  if (normalized.includes('claude-3.5')) {
    if (normalized.includes('sonnet')) return 'claude-3.5-sonnet';
    if (normalized.includes('haiku')) return 'claude-3.5-haiku';
    return 'claude-3.5-sonnet'; // Default to sonnet
  }
  
  if (normalized.includes('claude-3')) {
    if (normalized.includes('opus')) return 'claude-3-opus';
    if (normalized.includes('sonnet')) return 'claude-3-sonnet';
    if (normalized.includes('haiku')) return 'claude-3-haiku';
    return 'claude-3-sonnet'; // Default to sonnet
  }
  
  // Handle Gemini models
  if (normalized.includes('gemini-2.5')) return 'gemini-2.5-flash';
  if (normalized.includes('gemini-1.5')) {
    if (normalized.includes('pro')) return 'gemini-1.5-pro';
    return 'gemini-1.5-flash';
  }
  if (normalized.includes('gemini-pro')) return 'gemini-pro';
  
  // Handle Grok models
  if (normalized.includes('grok-2')) return 'grok-2';
  if (normalized.includes('grok')) return 'grok-beta';
  
  // Handle Perplexity models
  if (normalized.includes('llama-3.1-sonar-large')) return 'llama-3.1-sonar-large';
  if (normalized.includes('llama-3.1-sonar')) return 'llama-3.1-sonar';
  
  // Handle DALL-E models
  if (normalized.includes('dall-e-3')) return 'dall-e-3';
  if (normalized.includes('dall-e-2')) return 'dall-e-2';
  
  // Return the original normalized name if no specific match
  return normalized;
}
