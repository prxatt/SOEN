// Kiko Assistant Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';
import { ConversationContext } from '../types/ai';

export interface KikoPersonality {
  traits: string[];
  communicationStyle: string[];
  expertise: string[];
  values: string[];
}

export interface KikoMemory {
  userId: string;
  conversationHistory: ConversationEntry[];
  userPreferences: UserPreferences;
  contextAwareness: ContextAwareness;
}

export interface ConversationEntry {
  timestamp: Date;
  userMessage: string;
  kikoResponse: string;
  context: ConversationContext;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface UserPreferences {
  communicationStyle: 'direct' | 'supportive' | 'analytical' | 'creative';
  detailLevel: 'brief' | 'moderate' | 'detailed';
  focusAreas: string[];
  avoidTopics: string[];
}

export interface ContextAwareness {
  currentGoals: string[];
  activeProjects: string[];
  recentActivities: string[];
  mood: string;
  energyLevel: number;
  stressLevel: number;
}

export class KikoAssistantService {
  private personality: KikoPersonality;
  private memory: Map<string, KikoMemory> = new Map();

  constructor(private grokService: EnhancedGrokService) {
    this.personality = this.initializePersonality();
  }

  async chatWithKiko(
    userId: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    // Update context awareness
    this.updateContextAwareness(userId, context);
    
    // Get user memory
    const userMemory = this.getUserMemory(userId);
    
    // Build conversation context
    const conversationContext = this.buildConversationContext(userMemory, context);
    
    // Generate response
    const response = await this.grokService.chatWithKiko(message, conversationContext);
    
    // Store conversation
    this.storeConversation(userId, message, response, context);
    
    // Enhance response with personality
    const enhancedResponse = this.enhanceResponseWithPersonality(response, userMemory);
    
    return enhancedResponse;
  }

  async generateProactiveInsight(
    userId: string,
    context: ConversationContext
  ): Promise<string> {
    const userMemory = this.getUserMemory(userId);
    
    const insightPrompt = this.buildProactiveInsightPrompt(userMemory, context);
    
    const response = await this.grokService.chatWithKiko(
      insightPrompt,
      this.buildConversationContext(userMemory, context)
    );
    
    return response;
  }

  async suggestOptimizations(
    userId: string,
    context: ConversationContext
  ): Promise<string[]> {
    const userMemory = this.getUserMemory(userId);
    
    const optimizationPrompt = this.buildOptimizationPrompt(userMemory, context);
    
    const response = await this.grokService.chatWithKiko(
      optimizationPrompt,
      this.buildConversationContext(userMemory, context)
    );
    
    // Parse response into actionable suggestions
    return this.parseOptimizationSuggestions(response);
  }

  async provideGoalGuidance(
    userId: string,
    goal: any,
    context: ConversationContext
  ): Promise<string> {
    const userMemory = this.getUserMemory(userId);
    
    const guidancePrompt = this.buildGoalGuidancePrompt(goal, userMemory, context);
    
    const response = await this.grokService.chatWithKiko(
      guidancePrompt,
      this.buildConversationContext(userMemory, context)
    );
    
    return response;
  }

  private initializePersonality(): KikoPersonality {
    return {
      traits: [
        'strategic',
        'empathetic',
        'proactive',
        'curious',
        'results-focused',
        'optimistic',
        'analytical',
        'supportive'
      ],
      communicationStyle: [
        'conversational but professional',
        'asks clarifying questions',
        'provides specific actionable advice',
        'references user goals and progress',
        'uses analogies and frameworks',
        'adapts to user communication style'
      ],
      expertise: [
        'goal setting and achievement',
        'productivity optimization',
        'time management',
        'health and wellness integration',
        'learning and skill development',
        'project management',
        'strategic thinking',
        'decision making',
        'habit formation',
        'energy management'
      ],
      values: [
        'user autonomy and choice',
        'continuous improvement',
        'evidence-based recommendations',
        'holistic approach to productivity',
        'work-life integration',
        'personal growth and development'
      ]
    };
  }

  private getUserMemory(userId: string): KikoMemory {
    if (!this.memory.has(userId)) {
      this.memory.set(userId, {
        userId,
        conversationHistory: [],
        userPreferences: {
          communicationStyle: 'supportive',
          detailLevel: 'moderate',
          focusAreas: [],
          avoidTopics: []
        },
        contextAwareness: {
          currentGoals: [],
          activeProjects: [],
          recentActivities: [],
          mood: 'neutral',
          energyLevel: 50,
          stressLevel: 50
        }
      });
    }
    
    return this.memory.get(userId)!;
  }

  private updateContextAwareness(userId: string, context: ConversationContext): void {
    const userMemory = this.getUserMemory(userId);
    
    // Update goals
    if (context.goals) {
      userMemory.contextAwareness.currentGoals = context.goals.map(goal => goal.text);
    }
    
    // Update projects
    if (context.recentActivities) {
      userMemory.contextAwareness.activeProjects = context.recentActivities
        .filter(activity => activity.type === 'project')
        .map(activity => activity.title);
    }
    
    // Update recent activities
    userMemory.contextAwareness.recentActivities = context.recentActivities
      ?.map(activity => activity.title) || [];
    
    // Update mood and energy
    if (context.healthStatus) {
      userMemory.contextAwareness.mood = context.healthStatus.mood || 'neutral';
      userMemory.contextAwareness.energyLevel = context.healthStatus.energyLevel || 50;
      userMemory.contextAwareness.stressLevel = context.healthStatus.stressLevel || 50;
    }
  }

  private buildConversationContext(userMemory: KikoMemory, context: ConversationContext): ConversationContext {
    return {
      ...context,
      goals: context.goals || userMemory.contextAwareness.currentGoals.map(text => ({ text, term: 'short', status: 'active' })),
      recentActivities: context.recentActivities || userMemory.contextAwareness.recentActivities.map(title => ({ title, type: 'task' })),
      healthStatus: context.healthStatus || {
        mood: userMemory.contextAwareness.mood,
        energyLevel: userMemory.contextAwareness.energyLevel,
        stressLevel: userMemory.contextAwareness.stressLevel
      },
      learningFocus: context.learningFocus || userMemory.userPreferences.focusAreas.map(area => ({ topic: area, status: 'active' }))
    };
  }

  private storeConversation(
    userId: string,
    userMessage: string,
    kikoResponse: string,
    context: ConversationContext
  ): void {
    const userMemory = this.getUserMemory(userId);
    
    const entry: ConversationEntry = {
      timestamp: new Date(),
      userMessage,
      kikoResponse,
      context,
      topics: this.extractTopics(userMessage),
      sentiment: this.analyzeSentiment(userMessage)
    };
    
    userMemory.conversationHistory.push(entry);
    
    // Keep only last 50 conversations
    if (userMemory.conversationHistory.length > 50) {
      userMemory.conversationHistory = userMemory.conversationHistory.slice(-50);
    }
    
    // Update user preferences based on conversation patterns
    this.updateUserPreferences(userMemory, entry);
  }

  private enhanceResponseWithPersonality(response: string, userMemory: KikoMemory): string {
    // Add personality traits to response
    let enhancedResponse = response;
    
    // Add supportive elements
    if (userMemory.userPreferences.communicationStyle === 'supportive') {
      enhancedResponse = this.addSupportiveElements(enhancedResponse);
    }
    
    // Adjust detail level
    if (userMemory.userPreferences.detailLevel === 'brief') {
      enhancedResponse = this.makeResponseBrief(enhancedResponse);
    } else if (userMemory.userPreferences.detailLevel === 'detailed') {
      enhancedResponse = this.addDetailedElements(enhancedResponse);
    }
    
    return enhancedResponse;
  }

  private buildProactiveInsightPrompt(userMemory: KikoMemory, context: ConversationContext): string {
    return `
Based on the user's current context and conversation history, provide a proactive insight or suggestion.

USER CONTEXT:
- Current goals: ${userMemory.contextAwareness.currentGoals.join(', ')}
- Active projects: ${userMemory.contextAwareness.activeProjects.join(', ')}
- Recent mood: ${userMemory.contextAwareness.mood}
- Energy level: ${userMemory.contextAwareness.energyLevel}/100

RECENT CONVERSATIONS:
${userMemory.conversationHistory.slice(-5).map(entry => 
  `- ${entry.userMessage} (${entry.sentiment})`
).join('\n')}

Provide a helpful, proactive insight that could benefit the user right now.
    `.trim();
  }

  private buildOptimizationPrompt(userMemory: KikoMemory, context: ConversationContext): string {
    return `
Analyze the user's current situation and suggest 3-5 specific optimizations.

USER SITUATION:
- Goals: ${userMemory.contextAwareness.currentGoals.join(', ')}
- Projects: ${userMemory.contextAwareness.activeProjects.join(', ')}
- Energy: ${userMemory.contextAwareness.energyLevel}/100
- Stress: ${userMemory.contextAwareness.stressLevel}/100

Provide specific, actionable optimization suggestions.
    `.trim();
  }

  private buildGoalGuidancePrompt(goal: any, userMemory: KikoMemory, context: ConversationContext): string {
    return `
Provide strategic guidance for this goal: "${goal.text}"

GOAL DETAILS:
- Term: ${goal.term}
- Status: ${goal.status}
- Priority: ${goal.priority || 'medium'}

USER CONTEXT:
- Current energy: ${userMemory.contextAwareness.energyLevel}/100
- Active projects: ${userMemory.contextAwareness.activeProjects.join(', ')}
- Recent mood: ${userMemory.contextAwareness.mood}

Provide specific guidance on how to achieve this goal effectively.
    `.trim();
  }

  private extractTopics(message: string): string[] {
    // Simple topic extraction - would be enhanced with NLP
    const topics: string[] = [];
    
    const topicKeywords = {
      'productivity': ['task', 'work', 'focus', 'efficient', 'time'],
      'health': ['sleep', 'exercise', 'energy', 'wellness', 'health'],
      'learning': ['study', 'learn', 'skill', 'course', 'knowledge'],
      'goals': ['goal', 'objective', 'target', 'achieve', 'plan'],
      'projects': ['project', 'deadline', 'milestone', 'progress'],
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'happy', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'frustrated', 'stressed'];
    
    const messageLower = message.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private updateUserPreferences(userMemory: KikoMemory, entry: ConversationEntry): void {
    // Update communication style based on user responses
    if (entry.sentiment === 'positive' && entry.kikoResponse.includes('?')) {
      // User responds well to questions
      userMemory.userPreferences.communicationStyle = 'supportive';
    }
    
    // Update detail level based on message length
    if (entry.userMessage.length > 200) {
      userMemory.userPreferences.detailLevel = 'detailed';
    } else if (entry.userMessage.length < 50) {
      userMemory.userPreferences.detailLevel = 'brief';
    }
    
    // Update focus areas based on topics
    entry.topics.forEach(topic => {
      if (!userMemory.userPreferences.focusAreas.includes(topic)) {
        userMemory.userPreferences.focusAreas.push(topic);
      }
    });
  }

  private addSupportiveElements(response: string): string {
    const supportivePhrases = [
      "I'm here to help you with that.",
      "Let's work through this together.",
      "You're doing great!",
      "I believe in your ability to achieve this.",
    ];
    
    const randomPhrase = supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)];
    return `${randomPhrase} ${response}`;
  }

  private makeResponseBrief(response: string): string {
    // Truncate response to first sentence or 100 characters
    const sentences = response.split('.');
    return sentences[0] + (sentences.length > 1 ? '.' : '');
  }

  private addDetailedElements(response: string): string {
    // Add more context and examples
    return `${response}\n\nWould you like me to elaborate on any of these points or provide specific examples?`;
  }

  private parseOptimizationSuggestions(response: string): string[] {
    // Parse AI response into actionable suggestions
    const suggestions: string[] = [];
    
    // Look for numbered lists or bullet points
    const lines = response.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        suggestions.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
      }
    });
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  // Public methods for memory management
  getUserPreferences(userId: string): UserPreferences {
    return this.getUserMemory(userId).userPreferences;
  }

  getContextAwareness(userId: string): ContextAwareness {
    return this.getUserMemory(userId).contextAwareness;
  }

  getConversationHistory(userId: string, limit: number = 10): ConversationEntry[] {
    const userMemory = this.getUserMemory(userId);
    return userMemory.conversationHistory.slice(-limit);
  }

  clearUserMemory(userId: string): void {
    this.memory.delete(userId);
  }
}
