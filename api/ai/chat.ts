// api/ai/chat.ts
// Server-side AI chat endpoint

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://afowfefzjonwbqtthacq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// AI clients
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false 
});

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// User profile cache to reduce database calls
interface CachedProfile {
  subscription_tier: string;
  daily_ai_requests: number;
  cachedAt: number;
  ttl: number;
}

const userProfileCache = new Map<string, CachedProfile>();
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

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, cached] of userProfileCache.entries()) {
    if ((now - cached.cachedAt) >= cached.ttl) {
      userProfileCache.delete(userId);
    }
  }
}, 60000); // Clean up every minute

// Encryption utilities (server-side only)
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = async (): Promise<Buffer> => {
  const keyString = process.env.ENCRYPTION_KEY;
  const saltString = process.env.ENCRYPTION_SALT;
  
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is required for secure message encryption');
  }
  
  if (!saltString) {
    throw new Error('ENCRYPTION_SALT environment variable is required for secure key derivation');
  }
  
  const scryptAsync = promisify(scrypt);
  return scryptAsync(keyString, saltString, KEY_LENGTH) as Promise<Buffer>;
};

const encryptText = async (text: string): Promise<{ encrypted: string; iv: string }> => {
  try {
    const key = await getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('mira-message', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const encryptedWithTag = encrypted + tag.toString('hex');
    
    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message content');
  }
};

export default async function handler(req: any, res: any) {
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

function calculateCost(model: string, tokens: number): number {
  const costs: Record<string, {input: number; output: number}> = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'claude-3.5-haiku': { input: 0.80, output: 4.00 },
    'gemini-1.5-flash': { input: 0.00, output: 0.00 }
  };

  const modelCost = costs[model.split(' ')[0]] || { input: 0, output: 0 };
  const tokensInMillion = tokens / 1_000_000;
  
  const costUSD = (tokensInMillion * 0.3 * modelCost.input) + (tokensInMillion * 0.7 * modelCost.output);
  return Math.round(costUSD * 100);
}
