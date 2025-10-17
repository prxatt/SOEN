// services/aiService.ts
// Client-side AI service that calls external APIs

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

class ClientAIService {
  private cache: Map<string, {data: AIResponse; expiry: number}> = new Map();

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    // 1. Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Select appropriate API endpoint based on feature type
    const endpoint = this.selectEndpoint(request.featureType);
    
    // 3. Execute request
    let response: AIResponse;
    try {
      response = await this.executeRequest(endpoint, request);
    } catch (error) {
      console.error(`Primary endpoint ${endpoint} failed:`, error);
      // Fallback to Gemini (free tier)
      response = await this.executeGeminiFallback(request);
      response.modelUsed = 'gemini-1.5-flash (fallback)';
    }

    // 4. Cache the response
    this.cacheResponse(cacheKey, response, request.featureType);

    return response;
  }

  private selectEndpoint(featureType: FeatureType): string {
    switch (featureType) {
      case 'mira_chat':
        return '/api/ai/chat';
      case 'task_parsing':
        return '/api/ai/task-parsing';
      case 'note_generation':
        return '/api/ai/note-generation';
      case 'strategic_briefing':
        return '/api/ai/strategic-briefing';
      case 'vision_ocr':
      case 'vision_event_detection':
        return '/api/ai/vision';
      case 'research_with_sources':
        return '/api/ai/research';
      case 'completion_image':
        return '/api/ai/image-generation';
      default:
        return '/api/ai/chat';
    }
  }

  private async executeRequest(endpoint: string, request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      ...result,
      processingTimeMs: Date.now() - startTime
    };
  }

  private async executeGeminiFallback(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Use server-side endpoint to avoid exposing API key
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.buildPrompt(request),
          model: 'gemini-1.5-flash',
          userId: request.userId,
          featureType: request.featureType
        })
      });

      if (!response.ok) {
        throw new Error('Server-side Gemini request failed');
      }

      const result = await response.json();
      const content = result.content || 'No response generated';

      return {
        content,
        modelUsed: 'gemini-1.5-flash',
        tokensUsed: result.tokensUsed || 0,
        processingTimeMs: Date.now() - startTime,
        confidence: 0.80,
        costCents: 0, // Free tier
        cacheHit: false
      };
    } catch (error) {
      console.error('Gemini fallback failed:', error);
      return {
        content: 'I apologize, but I\'m unable to process your request at the moment. Please try again later.',
        modelUsed: 'fallback',
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime,
        confidence: 0.0,
        costCents: 0,
        cacheHit: false
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    let prompt = `You are Mira, an AI assistant for Soen, a productivity platform. You help users manage tasks, notes, goals, and provide strategic insights.\n\n`;

    // Add personality based on user's Mira relationship
    if (request.context.userProfile?.mira_personality_mode) {
      const personalityPrompts = {
        supportive: "Be encouraging, empathetic, and supportive. Celebrate wins and offer gentle guidance.",
        tough_love: "Be direct, challenging, and push the user to their potential. Hold them accountable.",
        analytical: "Be logical, data-driven, and focus on optimization. Provide structured analysis.",
        motivational: "Be energetic, inspiring, and action-oriented. Use motivational language."
      };
      prompt += `Personality: ${personalityPrompts[request.context.userProfile.mira_personality_mode]}\n\n`;
    }

    // Add feature-specific context
    switch (request.featureType) {
      case 'task_parsing':
        prompt += `Your task: Parse the user's natural language input into a structured task. Extract title, date/time, duration, location, and any other relevant details. Return JSON format.\n\n`;
        break;
      
      case 'note_generation':
        prompt += `Your task: Help the user create comprehensive notes. If they provide minimal information, ask clarifying questions first. Then generate well-structured notes with headers, bullet points, and key takeaways.\n\n`;
        break;
      
      case 'strategic_briefing':
        prompt += `Your task: Generate a strategic daily briefing that synthesizes the user's goals, tasks, health data, and recent notes. Provide actionable insights and recommendations.\n\n`;
        break;
    }

    // Add user context
    if (request.context.userGoals && request.context.userGoals.length > 0) {
      prompt += `User's Goals:\n${request.context.userGoals.map(g => `- ${g.term}: ${g.text}`).join('\n')}\n\n`;
    }

    if (request.context.currentTime) {
      prompt += `Current time: ${request.context.currentTime.toLocaleString()}\n\n`;
    }

    // Add conversation history
    if (request.context.conversationHistory && request.context.conversationHistory.length > 0) {
      prompt += `Recent conversation:\n`;
      request.context.conversationHistory.slice(-5).forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    prompt += `User message: ${request.message}`;

    return prompt;
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
}

export const aiService = new ClientAIService();
export type { AIRequest, AIResponse, FeatureType, ConversationContext };
