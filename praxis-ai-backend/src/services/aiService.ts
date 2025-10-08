// AI Services for Praxis-AI Backend
import { AIServiceConfig, AIRequest, AIResponse } from '../types/ai';

export interface AIService {
  generateResponse(request: AIRequest): Promise<AIResponse>;
  generateStrategicBriefing(context: string): Promise<string>;
  generateMindMap(data: any): Promise<any>;
  summarizeNotes(content: string): Promise<string>;
  extractActionItems(content: string): Promise<string[]>;
  analyzeImage(imageUrl: string, prompt: string): Promise<string>;
}

// Grok AI Service Implementation
export class GrokAIService implements AIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are Kiko, an AI assistant for Praxis-AI, a hyper-personalized productivity app. You help users with strategic briefings, mind mapping, smart notes, and actionable insights. Be concise, actionable, and insightful.',
            },
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.7,
          stream: request.stream || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: 'grok-beta',
        tokens: data.usage.total_tokens,
        cost: this.calculateCost(data.usage.total_tokens),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Grok AI Service Error:', error);
      throw new Error(`Grok AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStrategicBriefing(context: string): Promise<string> {
    const prompt = `Generate a strategic briefing based on this context: ${context}

Please provide:
1. A compelling title
2. Executive summary (2-3 sentences)
3. 3-5 key insights
4. 3-5 suggested actions

Format as JSON with keys: title, summary, keyInsights, suggestedActions`;

    const response = await this.generateResponse({ prompt });
    return response.content;
  }

  async generateMindMap(data: any): Promise<any> {
    const prompt = `Create a mind map structure based on this data: ${JSON.stringify(data)}

Return a JSON structure with:
- nodes: array of {id, type, data: {label, category, priority}, position: {x, y}}
- edges: array of {id, source, target, type}

Focus on productivity, insights, and actionable connections.`;

    const response = await this.generateResponse({ prompt });
    return JSON.parse(response.content);
  }

  async summarizeNotes(content: string): Promise<string> {
    const prompt = `Summarize these notes into key insights and actionable items:

${content}

Provide:
1. Executive summary (2-3 sentences)
2. Key insights (bullet points)
3. Action items (numbered list)`;

    const response = await this.generateResponse({ prompt });
    return response.content;
  }

  async extractActionItems(content: string): Promise<string[]> {
    const prompt = `Extract actionable items from this content. Return only a JSON array of strings:

${content}

Focus on specific, actionable tasks that can be completed.`;

    const response = await this.generateResponse({ prompt });
    try {
      return JSON.parse(response.content);
    } catch {
      // Fallback: extract action items manually
      return response.content
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    // Note: Grok doesn't support image analysis yet, this would be a placeholder
    // In production, you'd use a different service or wait for Grok's image capabilities
    throw new Error('Image analysis not yet supported by Grok AI');
  }

  private calculateCost(tokens: number): number {
    // Grok pricing: $0.01 per 1K tokens (as of 2024)
    return (tokens / 1000) * 0.01;
  }
}

// Google Gemini Service Implementation
export class GeminiAIService implements AIService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Kiko, an AI assistant for Praxis-AI, a hyper-personalized productivity app. You help users with strategic briefings, mind mapping, smart notes, and actionable insights. Be concise, actionable, and insightful.

User request: ${request.prompt}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: request.maxTokens || 4096,
            temperature: request.temperature || 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.candidates[0].content.parts[0].text,
        model: 'gemini-pro',
        tokens: data.usageMetadata?.totalTokenCount || 0,
        cost: this.calculateCost(data.usageMetadata?.totalTokenCount || 0),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      throw new Error(`Gemini AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStrategicBriefing(context: string): Promise<string> {
    const prompt = `Generate a strategic briefing based on this context: ${context}

Please provide:
1. A compelling title
2. Executive summary (2-3 sentences)
3. 3-5 key insights
4. 3-5 suggested actions

Format as JSON with keys: title, summary, keyInsights, suggestedActions`;

    const response = await this.generateResponse({ prompt });
    return response.content;
  }

  async generateMindMap(data: any): Promise<any> {
    const prompt = `Create a mind map structure based on this data: ${JSON.stringify(data)}

Return a JSON structure with:
- nodes: array of {id, type, data: {label, category, priority}, position: {x, y}}
- edges: array of {id, source, target, type}

Focus on productivity, insights, and actionable connections.`;

    const response = await this.generateResponse({ prompt });
    return JSON.parse(response.content);
  }

  async summarizeNotes(content: string): Promise<string> {
    const prompt = `Summarize these notes into key insights and actionable items:

${content}

Provide:
1. Executive summary (2-3 sentences)
2. Key insights (bullet points)
3. Action items (numbered list)`;

    const response = await this.generateResponse({ prompt });
    return response.content;
  }

  async extractActionItems(content: string): Promise<string[]> {
    const prompt = `Extract actionable items from this content. Return only a JSON array of strings:

${content}

Focus on specific, actionable tasks that can be completed.`;

    const response = await this.generateResponse({ prompt });
    try {
      return JSON.parse(response.content);
    } catch {
      // Fallback: extract action items manually
      return response.content
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { 
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageUrl.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini Vision API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini Vision Service Error:', error);
      throw new Error(`Gemini image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateCost(tokens: number): number {
    // Gemini pricing: $0.0005 per 1K tokens (as of 2024)
    return (tokens / 1000) * 0.0005;
  }
}

// AI Service Manager
export class AIServiceManager {
  private grokService: GrokAIService;
  private geminiService: GeminiAIService;
  private primaryService: 'grok' | 'gemini';

  constructor(config: AIServiceConfig) {
    this.grokService = new GrokAIService(config.grok.apiKey);
    this.geminiService = new GeminiAIService(config.gemini.apiKey);
    this.primaryService = 'grok'; // Use Grok as primary due to $25 free credits
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      if (request.model === 'grok' || this.primaryService === 'grok') {
        return await this.grokService.generateResponse(request);
      } else {
        return await this.geminiService.generateResponse(request);
      }
    } catch (error) {
      console.error('Primary AI service failed, trying fallback:', error);
      
      // Fallback to secondary service
      try {
        if (request.model === 'grok' || this.primaryService === 'grok') {
          return await this.geminiService.generateResponse(request);
        } else {
          return await this.grokService.generateResponse(request);
        }
      } catch (fallbackError) {
        console.error('All AI services failed:', fallbackError);
        throw new Error('All AI services are currently unavailable');
      }
    }
  }

  async generateStrategicBriefing(context: string): Promise<string> {
    try {
      return await this.grokService.generateStrategicBriefing(context);
    } catch (error) {
      console.error('Grok strategic briefing failed, trying Gemini:', error);
      return await this.geminiService.generateStrategicBriefing(context);
    }
  }

  async generateMindMap(data: any): Promise<any> {
    try {
      return await this.grokService.generateMindMap(data);
    } catch (error) {
      console.error('Grok mind map failed, trying Gemini:', error);
      return await this.geminiService.generateMindMap(data);
    }
  }

  async summarizeNotes(content: string): Promise<string> {
    try {
      return await this.grokService.summarizeNotes(content);
    } catch (error) {
      console.error('Grok summarization failed, trying Gemini:', error);
      return await this.geminiService.summarizeNotes(content);
    }
  }

  async extractActionItems(content: string): Promise<string[]> {
    try {
      return await this.grokService.extractActionItems(content);
    } catch (error) {
      console.error('Grok action extraction failed, trying Gemini:', error);
      return await this.geminiService.extractActionItems(content);
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    // Use Gemini for image analysis since Grok doesn't support it yet
    return await this.geminiService.analyzeImage(imageUrl, prompt);
  }
}
