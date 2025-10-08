// Enhanced Grok AI Service for Praxis-AI
import { GrokService, UserContext, ConversationContext, NoteInsights, MindMapData, SearchResults, ImageAnalysis, StrategicBriefing } from '../types/ai';

export interface GrokConfig {
  apiKey: string;
  baseUrl: string;
  models: {
    general: string;
    code: string;
    vision: string;
  };
  limits: {
    maxTokens: number;
    contextWindow: number;
    monthlyCredits: number;
  };
}

export interface GrokUsage {
  userId: string;
  tokensUsed: number;
  requestsCount: number;
  creditsRemaining: number;
  lastReset: Date;
}

export interface GrokResponse {
  content: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  usage: GrokUsage;
}

export class EnhancedGrokService implements GrokService {
  private config: GrokConfig;
  private usageCache: Map<string, GrokUsage> = new Map();
  private responseCache: Map<string, GrokResponse> = new Map();

  constructor(config: GrokConfig) {
    this.config = config;
  }

  // Core Grok API integration
  async makeGrokRequest(
    messages: any[],
    model: string = this.config.models.general,
    maxTokens: number = this.config.limits.maxTokens,
    temperature: number = 0.7,
    tools?: any[]
  ): Promise<GrokResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          tools,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.choices[0].model || model,
        tokens: data.usage?.total_tokens || 0,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
        timestamp: new Date(),
        usage: this.updateUsage(data.usage?.total_tokens || 0),
      };
    } catch (error) {
      console.error('Grok API Error:', error);
      throw new Error(`Grok request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Strategic Briefing Service
  async generateBriefing(userContext: UserContext): Promise<StrategicBriefing> {
    const cacheKey = `briefing_${userContext.userId}_${new Date().toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.responseCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp, 24 * 60 * 60 * 1000)) { // 24 hours
      return JSON.parse(cached.content);
    }

    const briefingPrompt = this.buildStrategicBriefingPrompt(userContext);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's strategic briefing generator. Create comprehensive morning briefings that synthesize user data into actionable insights. Focus on:
- Goal progress and alignment
- Health and energy optimization
- Learning and skill development
- Productivity patterns and opportunities
- Strategic recommendations for the day

Format as JSON with: title, summary, keyInsights[], suggestedActions[], healthRecommendations[], learningOpportunities[], productivityTips[]`
      },
      {
        role: 'user',
        content: briefingPrompt
      }
    ], this.config.models.general, 4096);

    const briefing = JSON.parse(response.content);
    
    // Cache the response
    this.responseCache.set(cacheKey, response);
    
    return briefing;
  }

  // Kiko Assistant Service
  async chatWithKiko(message: string, context: ConversationContext): Promise<string> {
    const kikoPersonality = this.buildKikoPersonality(context);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: kikoPersonality
      },
      {
        role: 'user',
        content: message
      }
    ], this.config.models.general, 2048, 0.8);

    return response.content;
  }

  // Smart Notes Service
  async analyzeNotes(notes: Note[]): Promise<NoteInsights> {
    const notesContext = this.buildNotesContext(notes);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's smart notes analyzer. Analyze notes to:
- Extract key themes and patterns
- Identify action items and next steps
- Generate proposals and ideas
- Find connections between different notes
- Suggest knowledge gaps and learning opportunities

Format as JSON with: themes[], actionItems[], proposals[], connections[], knowledgeGaps[]`
      },
      {
        role: 'user',
        content: notesContext
      }
    ], this.config.models.general, 3072);

    return JSON.parse(response.content);
  }

  // Mind Mapping Service
  async generateMindMap(goals: Goal[], tasks: Task[], notes: Note[]): Promise<MindMapData> {
    const mindMapContext = this.buildMindMapContext(goals, tasks, notes);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's mind mapping generator. Create visual mind maps that:
- Connect goals, tasks, and notes
- Show relationships and dependencies
- Identify patterns and themes
- Suggest new connections and opportunities
- Highlight critical paths and bottlenecks

Format as JSON with: nodes[], edges[], themes[], criticalPaths[], opportunities[]`
      },
      {
        role: 'user',
        content: mindMapContext
      }
    ], this.config.models.general, 4096);

    return JSON.parse(response.content);
  }

  // Explore Service with Grounded Search
  async searchAndAnalyze(query: string): Promise<SearchResults> {
    const searchPrompt = this.buildSearchPrompt(query);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's grounded search analyzer. Perform web searches and analyze results to:
- Provide accurate, up-to-date information
- Synthesize multiple sources
- Identify actionable insights
- Suggest related topics and resources
- Ground responses in verifiable facts

Format as JSON with: results[], insights[], relatedTopics[], sources[], actionableItems[]`
      },
      {
        role: 'user',
        content: searchPrompt
      }
    ], this.config.models.general, 3072);

    return JSON.parse(response.content);
  }

  // Image Analysis Service
  async analyzeImage(imageUrl: string, context: string): Promise<ImageAnalysis> {
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's image analysis expert. Analyze images to:
- Describe visual content accurately
- Extract text and data
- Identify patterns and insights
- Suggest actionable next steps
- Connect visual information to user goals

Format as JSON with: description, extractedText, insights[], actionItems[], connections[]`
      },
      {
        role: 'user',
        content: `Analyze this image in the context of: ${context}\n\nImage URL: ${imageUrl}`
      }
    ], this.config.models.vision, 2048);

    return JSON.parse(response.content);
  }

  // Productivity Analysis Service
  async analyzeProductivity(userData: any): Promise<any> {
    const analysisPrompt = this.buildProductivityAnalysisPrompt(userData);
    
    const response = await this.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's productivity analyst. Analyze user patterns to:
- Identify productivity trends and patterns
- Suggest optimization opportunities
- Highlight strengths and areas for improvement
- Recommend personalized strategies
- Predict potential challenges

Format as JSON with: trends[], optimizations[], strengths[], improvements[], strategies[], predictions[]`
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ], this.config.models.general, 4096);

    return JSON.parse(response.content);
  }

  // Helper methods for prompt engineering
  private buildStrategicBriefingPrompt(userContext: UserContext): string {
    return `
Generate a strategic briefing for ${userContext.userId} based on:

GOALS & OBJECTIVES:
${JSON.stringify(userContext.goals)}

RECENT TASKS & ACTIVITIES:
${JSON.stringify(userContext.recentTasks)}

HEALTH & WELLNESS DATA:
${JSON.stringify(userContext.healthData)}

LEARNING & DEVELOPMENT:
${JSON.stringify(userContext.learningData)}

CALENDAR & SCHEDULE:
${JSON.stringify(userContext.calendarData)}

NOTES & INSIGHTS:
${JSON.stringify(userContext.notes)}

Create a comprehensive briefing that synthesizes this data into actionable insights for today and the week ahead.
    `.trim();
  }

  private buildKikoPersonality(context: ConversationContext): string {
    return `
You are Kiko, Praxis-AI's strategic AI partner. Your personality:

CORE TRAITS:
- Strategic thinker who turns knowledge into action
- Empathetic and supportive, but direct and results-focused
- Curious about user goals and helps connect dots
- Proactive in suggesting optimizations and opportunities
- Knowledgeable about productivity, health, and personal development

COMMUNICATION STYLE:
- Conversational but professional
- Ask clarifying questions to better understand context
- Provide specific, actionable advice
- Reference user's goals and progress when relevant
- Use analogies and frameworks to explain complex concepts

EXPERTISE AREAS:
- Goal setting and achievement strategies
- Productivity optimization and time management
- Health and wellness integration
- Learning and skill development
- Project management and execution
- Strategic thinking and decision making

USER CONTEXT:
- Current goals: ${JSON.stringify(context.goals)}
- Recent activities: ${JSON.stringify(context.recentActivities)}
- Health status: ${JSON.stringify(context.healthStatus)}
- Learning focus: ${JSON.stringify(context.learningFocus)}

Always be helpful, insightful, and focused on helping the user achieve their goals and optimize their Praxis Flow.
    `.trim();
  }

  private buildNotesContext(notes: Note[]): string {
    return `
Analyze these notes for insights and actionable items:

${notes.map(note => `
NOTE: ${note.title}
CONTENT: ${note.content}
TAGS: ${note.tags.join(', ')}
CREATED: ${note.createdAt}
`).join('\n')}

Extract themes, action items, proposals, and connections between notes.
    `.trim();
  }

  private buildMindMapContext(goals: Goal[], tasks: Task[], notes: Note[]): string {
    return `
Create a mind map connecting these elements:

GOALS:
${goals.map(goal => `- ${goal.text} (${goal.term} term, ${goal.status})`).join('\n')}

TASKS:
${tasks.map(task => `- ${task.title} (${task.status}, ${task.priority})`).join('\n')}

NOTES:
${notes.map(note => `- ${note.title} (${note.tags.join(', ')})`).join('\n')}

Generate a visual mind map showing relationships, dependencies, and opportunities.
    `.trim();
  }

  private buildSearchPrompt(query: string): string {
    return `
Perform a grounded web search and analysis for: "${query}"

Provide accurate, up-to-date information with proper source attribution and actionable insights.
    `.trim();
  }

  private buildProductivityAnalysisPrompt(userData: any): string {
    return `
Analyze this user's productivity patterns:

TASK COMPLETION DATA:
${JSON.stringify(userData.taskData)}

TIME TRACKING DATA:
${JSON.stringify(userData.timeData)}

HEALTH & ENERGY PATTERNS:
${JSON.stringify(userData.healthData)}

GOAL PROGRESS:
${JSON.stringify(userData.goalData)}

Identify patterns, optimization opportunities, and personalized recommendations.
    `.trim();
  }

  // Cost optimization and caching
  private calculateCost(tokens: number): number {
    // Grok pricing: $0.01 per 1K tokens (as of 2024)
    return (tokens / 1000) * 0.01;
  }

  private updateUsage(tokens: number): GrokUsage {
    const userId = 'current_user'; // This would come from context
    const currentUsage = this.usageCache.get(userId) || {
      userId,
      tokensUsed: 0,
      requestsCount: 0,
      creditsRemaining: this.config.limits.monthlyCredits,
      lastReset: new Date(),
    };

    // Reset monthly if needed
    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - currentUsage.lastReset.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceReset >= 30) {
      currentUsage.tokensUsed = 0;
      currentUsage.requestsCount = 0;
      currentUsage.creditsRemaining = this.config.limits.monthlyCredits;
      currentUsage.lastReset = now;
    }

    currentUsage.tokensUsed += tokens;
    currentUsage.requestsCount += 1;
    currentUsage.creditsRemaining = Math.max(0, currentUsage.creditsRemaining - this.calculateCost(tokens));

    this.usageCache.set(userId, currentUsage);
    return currentUsage;
  }

  private isCacheValid(timestamp: Date, maxAge: number): boolean {
    return Date.now() - timestamp.getTime() < maxAge;
  }

  // Public methods for usage tracking
  getUsage(userId: string): GrokUsage | undefined {
    return this.usageCache.get(userId);
  }

  getCreditsRemaining(userId: string): number {
    const usage = this.usageCache.get(userId);
    return usage?.creditsRemaining || this.config.limits.monthlyCredits;
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeGrokRequest([
        { role: 'user', content: 'Hello' }
      ], this.config.models.general, 10);
      return true;
    } catch {
      return false;
    }
  }
}
