// Enhanced AI Service Manager for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';
import { StrategicBriefingService } from './strategicBriefingService';
import { KikoAssistantService } from './kikoAssistantService';
import { SmartNotesService } from './smartNotesService';
import { MindMappingService } from './mindMappingService';
import { InsightsService } from './insightsService';
import { ExploreService } from './exploreService';
import { ProductivityAnalysisService } from './productivityAnalysisService';

export interface AIServiceConfig {
  grok: {
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
  };
  gemini: {
    apiKey: string;
    baseUrl: string;
    models: {
      general: string;
      vision: string;
    };
  };
  openai: {
    apiKey: string;
    baseUrl: string;
    models: {
      general: string;
      code: string;
    };
  };
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

export interface UsageMetrics {
  userId: string;
  service: string;
  requests: number;
  tokens: number;
  cost: number;
  lastReset: Date;
}

export class EnhancedAIServiceManager {
  private grokService: EnhancedGrokService;
  private strategicBriefingService: StrategicBriefingService;
  private kikoAssistantService: KikoAssistantService;
  private smartNotesService: SmartNotesService;
  private mindMappingService: MindMappingService;
  private insightsService: InsightsService;
  private exploreService: ExploreService;
  private productivityAnalysisService: ProductivityAnalysisService;
  
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private usageMetrics: Map<string, UsageMetrics> = new Map();
  private fallbackServices: Map<string, string[]> = new Map();

  constructor(config: AIServiceConfig) {
    // Initialize Grok service
    this.grokService = new EnhancedGrokService({
      apiKey: config.grok.apiKey,
      baseUrl: config.grok.baseUrl,
      models: config.grok.models,
      limits: config.grok.limits,
    });

    // Initialize specialized services
    this.strategicBriefingService = new StrategicBriefingService(this.grokService);
    this.kikoAssistantService = new KikoAssistantService(this.grokService);
    this.smartNotesService = new SmartNotesService(this.grokService);
    this.mindMappingService = new MindMappingService(this.grokService);
    this.insightsService = new InsightsService(this.grokService);
    this.exploreService = new ExploreService(this.grokService);
    this.productivityAnalysisService = new ProductivityAnalysisService(this.grokService);

    // Set up fallback services
    this.setupFallbackServices();
    
    // Initialize health monitoring
    this.initializeHealthMonitoring();
  }

  // Strategic Briefing Service
  async generateStrategicBriefing(userId: string, briefingData: any): Promise<any> {
    try {
      return await this.strategicBriefingService.generateMorningBriefing(userId, briefingData);
    } catch (error) {
      console.error('Strategic briefing service error:', error);
      throw this.handleServiceError('strategicBriefing', error);
    }
  }

  async generateWeeklyBriefing(userId: string, briefingData: any): Promise<any> {
    try {
      return await this.strategicBriefingService.generateWeeklyBriefing(userId, briefingData);
    } catch (error) {
      console.error('Weekly briefing service error:', error);
      throw this.handleServiceError('strategicBriefing', error);
    }
  }

  async generateMonthlyBriefing(userId: string, briefingData: any): Promise<any> {
    try {
      return await this.strategicBriefingService.generateMonthlyBriefing(userId, briefingData);
    } catch (error) {
      console.error('Monthly briefing service error:', error);
      throw this.handleServiceError('strategicBriefing', error);
    }
  }

  // Kiko Assistant Service
  async chatWithKiko(userId: string, message: string, context: any): Promise<string> {
    try {
      return await this.kikoAssistantService.chatWithKiko(userId, message, context);
    } catch (error) {
      console.error('Kiko assistant service error:', error);
      throw this.handleServiceError('kikoAssistant', error);
    }
  }

  async generateProactiveInsight(userId: string, context: any): Promise<string> {
    try {
      return await this.kikoAssistantService.generateProactiveInsight(userId, context);
    } catch (error) {
      console.error('Proactive insight service error:', error);
      throw this.handleServiceError('kikoAssistant', error);
    }
  }

  async suggestOptimizations(userId: string, context: any): Promise<string[]> {
    try {
      return await this.kikoAssistantService.suggestOptimizations(userId, context);
    } catch (error) {
      console.error('Optimization suggestion service error:', error);
      throw this.handleServiceError('kikoAssistant', error);
    }
  }

  // Smart Notes Service
  async analyzeNotes(notes: any[], config?: any): Promise<any> {
    try {
      return await this.smartNotesService.analyzeNotes(notes, config);
    } catch (error) {
      console.error('Smart notes service error:', error);
      throw this.handleServiceError('smartNotes', error);
    }
  }

  async processNote(note: any, processingType?: string): Promise<any> {
    try {
      return await this.smartNotesService.processNote(note, processingType as any);
    } catch (error) {
      console.error('Note processing service error:', error);
      throw this.handleServiceError('smartNotes', error);
    }
  }

  async expandNote(note: any, expansionType: string): Promise<string> {
    try {
      return await this.smartNotesService.expandNote(note, expansionType as any);
    } catch (error) {
      console.error('Note expansion service error:', error);
      throw this.handleServiceError('smartNotes', error);
    }
  }

  async generateProposalFromNote(note: any): Promise<any> {
    try {
      return await this.smartNotesService.generateProposalFromNote(note);
    } catch (error) {
      console.error('Proposal generation service error:', error);
      throw this.handleServiceError('smartNotes', error);
    }
  }

  // Mind Mapping Service
  async generateMindMap(goals: any[], tasks: any[], notes: any[], config?: any): Promise<any> {
    try {
      return await this.mindMappingService.generateMindMap(goals, tasks, notes, config);
    } catch (error) {
      console.error('Mind mapping service error:', error);
      throw this.handleServiceError('mindMapping', error);
    }
  }

  async generateFocusedMindMap(focusArea: string, goals: any[], tasks: any[], notes: any[]): Promise<any> {
    try {
      return await this.mindMappingService.generateFocusedMindMap(focusArea, goals, tasks, notes);
    } catch (error) {
      console.error('Focused mind mapping service error:', error);
      throw this.handleServiceError('mindMapping', error);
    }
  }

  async generateDynamicConnections(mindMap: any, userContext: any): Promise<any[]> {
    try {
      return await this.mindMappingService.generateDynamicConnections(mindMap, userContext);
    } catch (error) {
      console.error('Dynamic connections service error:', error);
      throw this.handleServiceError('mindMapping', error);
    }
  }

  // Insights Service
  async generateActionableInsights(learningMaterials: any[], userGoals: any[], userSkills: any[], config?: any): Promise<any> {
    try {
      return await this.insightsService.generateActionableInsights(learningMaterials, userGoals, userSkills, config);
    } catch (error) {
      console.error('Insights service error:', error);
      throw this.handleServiceError('insights', error);
    }
  }

  async generateProjectIdeas(learningMaterials: any[], userGoals: any[], maxIdeas?: number): Promise<any[]> {
    try {
      return await this.insightsService.generateProjectIdeas(learningMaterials, userGoals, maxIdeas);
    } catch (error) {
      console.error('Project ideas service error:', error);
      throw this.handleServiceError('insights', error);
    }
  }

  async analyzeSkills(learningMaterials: any[], userSkills: any[], userGoals: any[]): Promise<any[]> {
    try {
      return await this.insightsService.analyzeSkills(learningMaterials, userSkills, userGoals);
    } catch (error) {
      console.error('Skill analysis service error:', error);
      throw this.handleServiceError('insights', error);
    }
  }

  // Explore Service
  async searchAndAnalyze(query: string, config?: any): Promise<any> {
    try {
      return await this.exploreService.searchAndAnalyze(query, config);
    } catch (error) {
      console.error('Explore service error:', error);
      throw this.handleServiceError('explore', error);
    }
  }

  async analyzeImage(imageUrl: string, context: string, config?: any): Promise<any> {
    try {
      return await this.exploreService.analyzeImage(imageUrl, context, config);
    } catch (error) {
      console.error('Image analysis service error:', error);
      throw this.handleServiceError('explore', error);
    }
  }

  async generateContextualSearch(userContext: any, focusArea: string): Promise<any> {
    try {
      return await this.exploreService.generateContextualSearch(userContext, focusArea);
    } catch (error) {
      console.error('Contextual search service error:', error);
      throw this.handleServiceError('explore', error);
    }
  }

  // Productivity Analysis Service
  async analyzeProductivity(data: any, timeframe?: string): Promise<any> {
    try {
      return await this.productivityAnalysisService.analyzeProductivity(data, timeframe as any);
    } catch (error) {
      console.error('Productivity analysis service error:', error);
      throw this.handleServiceError('productivityAnalysis', error);
    }
  }

  async analyzeFocusPatterns(timeTrackingData: any[]): Promise<any> {
    try {
      return await this.productivityAnalysisService.analyzeFocusPatterns(timeTrackingData);
    } catch (error) {
      console.error('Focus pattern analysis service error:', error);
      throw this.handleServiceError('productivityAnalysis', error);
    }
  }

  async analyzeEnergyPatterns(healthData: any[]): Promise<any> {
    try {
      return await this.productivityAnalysisService.analyzeEnergyPatterns(healthData);
    } catch (error) {
      console.error('Energy pattern analysis service error:', error);
      throw this.handleServiceError('productivityAnalysis', error);
    }
  }

  // Service management methods
  async getServiceHealth(): Promise<ServiceHealth[]> {
    const healthChecks = await Promise.allSettled([
      this.checkServiceHealth('grok'),
      this.checkServiceHealth('strategicBriefing'),
      this.checkServiceHealth('kikoAssistant'),
      this.checkServiceHealth('smartNotes'),
      this.checkServiceHealth('mindMapping'),
      this.checkServiceHealth('insights'),
      this.checkServiceHealth('explore'),
      this.checkServiceHealth('productivityAnalysis'),
    ]);

    return healthChecks.map((result, index) => {
      const serviceNames = ['grok', 'strategicBriefing', 'kikoAssistant', 'smartNotes', 'mindMapping', 'insights', 'explore', 'productivityAnalysis'];
      const serviceName = serviceNames[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: serviceName,
          status: 'down' as const,
          responseTime: 0,
          lastCheck: new Date(),
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  async getUsageMetrics(userId: string): Promise<UsageMetrics[]> {
    const userMetrics: UsageMetrics[] = [];
    
    // Get metrics for each service
    const serviceNames = ['strategicBriefing', 'kikoAssistant', 'smartNotes', 'mindMapping', 'insights', 'explore', 'productivityAnalysis'];
    
    for (const serviceName of serviceNames) {
      const key = `${userId}_${serviceName}`;
      const metrics = this.usageMetrics.get(key);
      if (metrics) {
        userMetrics.push(metrics);
      }
    }
    
    return userMetrics;
  }

  async resetUsageMetrics(userId: string): Promise<void> {
    const serviceNames = ['strategicBriefing', 'kikoAssistant', 'smartNotes', 'mindMapping', 'insights', 'explore', 'productivityAnalysis'];
    
    for (const serviceName of serviceNames) {
      const key = `${userId}_${serviceName}`;
      this.usageMetrics.delete(key);
    }
  }

  // Cost optimization methods
  async optimizeRequest(userId: string, service: string, request: any): Promise<any> {
    // Check if user has remaining credits
    const creditsRemaining = this.grokService.getCreditsRemaining(userId);
    
    if (creditsRemaining <= 0) {
      // Switch to fallback service
      const fallbackService = this.getFallbackService(service);
      if (fallbackService) {
        return this.routeToFallbackService(fallbackService, request);
      } else {
        throw new Error('No available AI services');
      }
    }
    
    // Use primary service
    return this.routeToPrimaryService(service, request);
  }

  private setupFallbackServices(): void {
    this.fallbackServices.set('strategicBriefing', ['gemini', 'openai']);
    this.fallbackServices.set('kikoAssistant', ['gemini', 'openai']);
    this.fallbackServices.set('smartNotes', ['gemini', 'openai']);
    this.fallbackServices.set('mindMapping', ['gemini', 'openai']);
    this.fallbackServices.set('insights', ['gemini', 'openai']);
    this.fallbackServices.set('explore', ['gemini', 'openai']);
    this.fallbackServices.set('productivityAnalysis', ['gemini', 'openai']);
  }

  private initializeHealthMonitoring(): void {
    // Set up periodic health checks
    setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async performHealthChecks(): Promise<void> {
    const services = ['grok', 'strategicBriefing', 'kikoAssistant', 'smartNotes', 'mindMapping', 'insights', 'explore', 'productivityAnalysis'];
    
    for (const service of services) {
      await this.checkServiceHealth(service);
    }
  }

  private async checkServiceHealth(service: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      let isHealthy = false;
      
      switch (service) {
        case 'grok':
          isHealthy = await this.grokService.healthCheck();
          break;
        case 'strategicBriefing':
          // Test with minimal data
          isHealthy = true; // Would implement actual health check
          break;
        // Add health checks for other services
        default:
          isHealthy = true;
      }
      
      const responseTime = Date.now() - startTime;
      
      const health: ServiceHealth = {
        service,
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
      };
      
      this.serviceHealth.set(service, health);
      return health;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: ServiceHealth = {
        service,
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.serviceHealth.set(service, health);
      return health;
    }
  }

  private handleServiceError(service: string, error: any): Error {
    // Log error for monitoring
    console.error(`Service error in ${service}:`, error);
    
    // Update service health
    const health = this.serviceHealth.get(service);
    if (health) {
      health.status = 'degraded';
      health.error = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set(service, health);
    }
    
    return new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  private getFallbackService(service: string): string | null {
    const fallbacks = this.fallbackServices.get(service);
    return fallbacks ? fallbacks[0] : null;
  }

  private async routeToFallbackService(fallbackService: string, request: any): Promise<any> {
    // Implement fallback routing logic
    throw new Error(`Fallback service ${fallbackService} not implemented`);
  }

  private async routeToPrimaryService(service: string, request: any): Promise<any> {
    // Route to primary service (Grok)
    return request;
  }
}
