// Soen AI Model Selection Strategy
// Cost-optimized AI routing for Mira AI with intelligent model selection

// Cost per 1M tokens - Updated to match exact specifications
export const AI_MODEL_COSTS = {
  'gpt-4o-mini': { 
    input: 0.15, 
    output: 0.60,
    speed: 'very fast',
    capabilities: ['chat', 'vision', 'json'],
    use_cases: ['quick_responses', 'task_parsing', 'calendar_events'],
    reliability: 0.99,
    context_window: 128000
  },
  'claude-3.5-haiku': { 
    input: 0.80, 
    output: 4.00,
    speed: 'fast',
    capabilities: ['chat', 'vision', 'analysis'],
    use_cases: ['strategic_thinking', 'note_generation', 'complex_analysis'],
    reliability: 0.98,
    context_window: 200000
  },
  'grok-4-fast': { 
    input: 5.00, 
    output: 15.00,
    speed: 'fastest',
    capabilities: ['chat', 'search', 'vision'],
    free_credits: 25, // $25/month free
    use_cases: ['research', 'complex_reasoning'],
    reliability: 0.95,
    context_window: 128000
  },
  'perplexity-sonar': { 
    input: 5.00, 
    output: 5.00,
    capabilities: ['search', 'citations'],
    use_cases: ['research_with_sources', 'fact_checking'],
    reliability: 0.97,
    context_window: 128000
  },
  'gemini-1.5-flash': { 
    input: 0.00, 
    output: 0.00,
    speed: 'fast',
    capabilities: ['chat', 'vision', 'large_context'],
    free_tier: true,
    use_cases: ['fallback', 'large_documents'],
    reliability: 0.96,
    context_window: 1000000
  }
};

// Smart routing to stay under $15/month for AI
interface AIRoutingStrategy {
  // 60% → GPT-4o Mini (fast, cheap)
  quick_chat: 'gpt-4o-mini',
  task_parsing: 'gpt-4o-mini',
  calendar_events: 'gpt-4o-mini',
  vision_ocr: 'gpt-4o-mini',
  
  // 20% → Claude Haiku (quality reasoning)
  note_generation: 'claude-3.5-haiku',
  strategic_planning: 'claude-3.5-haiku',
  mindmap_generation: 'claude-3.5-haiku',
  
  // 10% → Perplexity (research with sources)
  research_queries: 'perplexity-sonar',
  fact_checking: 'perplexity-sonar',
  
  // 5% → Grok (using free $25 credits)
  complex_reasoning: 'grok-4-fast',
  advanced_search: 'grok-4-fast',
  
  // 5% → Gemini Flash (free tier)
  fallback: 'gemini-1.5-flash',
  large_documents: 'gemini-1.5-flash'
}

// Smart Routing Strategy for Cost Optimization
export const AI_ROUTING_STRATEGY: AIRoutingStrategy = {
  // 60% → GPT-4o Mini (fast, cheap, reliable)
  quick_chat: 'gpt-4o-mini',
  task_parsing: 'gpt-4o-mini',
  calendar_events: 'gpt-4o-mini',
  vision_ocr: 'gpt-4o-mini',
  
  // 20% → Claude Haiku (quality reasoning)
  note_generation: 'claude-3.5-haiku',
  strategic_planning: 'claude-3.5-haiku',
  mindmap_generation: 'claude-3.5-haiku',
  
  // 10% → Perplexity (research with sources)
  research_queries: 'perplexity-sonar',
  fact_checking: 'perplexity-sonar',
  
  // 5% → Grok (using free $25 credits)
  complex_reasoning: 'grok-4-fast',
  advanced_search: 'grok-4-fast',
  
  // 5% → Gemini Flash (free tier)
  fallback: 'gemini-1.5-flash',
  large_documents: 'gemini-1.5-flash'
};

// User Tier Configuration - Updated to match exact specifications
export const USER_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    daily_ai_requests: 5, // 5 AI requests/day = ~$5/month (mostly cache hits)
    monthly_ai_requests: 150,
    features: ['basic_mira', 'notes', 'tasks', 'basic_insights'],
    cache_hit_rate: 0.85,
    priority: 'low'
  },
  pro: {
    name: 'Pro',
    price: 9.99, // Pro tier ($9.99/month): 50 requests/day
    daily_ai_requests: 50,
    monthly_ai_requests: 1500,
    features: ['full_mira', 'voice_conversation', 'vision_ai', 'gmail_integration', 'notion_sync'],
    cache_hit_rate: 0.80,
    priority: 'high'
  },
  enterprise: {
    name: 'Enterprise',
    price: 29.99,
    daily_ai_requests: 200,
    monthly_ai_requests: 6000,
    features: ['unlimited_mira', 'custom_personalities', 'api_access', 'priority_support'],
    cache_hit_rate: 0.75,
    priority: 'highest'
  }
};

// Cost Calculation Interface
interface CostCalculation {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  actualCost?: number;
  cacheHit: boolean;
  timestamp: Date;
}

// AI Model Selection Service
class AIModelSelectionService {
  private cache: Map<string, any> = new Map();
  private usageStats: Map<string, number> = new Map();
  private costTracking: CostCalculation[] = [];

  // Select optimal model based on use case and user tier
  selectModel(useCase: string, userTier: string, context?: any): string {
    // Check cache first
    const cacheKey = this.generateCacheKey(useCase, context);
    if (this.cache.has(cacheKey)) {
      return 'cache';
    }

    // Check user quota
    if (!this.checkUserQuota(userTier)) {
      return 'quota_exceeded';
    }

    // Select model based on strategy
    const selectedModel = AI_ROUTING_STRATEGY[useCase] || AI_ROUTING_STRATEGY.fallback;
    
    // Apply tier-based overrides
    return this.applyTierOverrides(selectedModel, userTier, useCase);
  }

  // Calculate estimated cost for a request
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelConfig = AI_MODEL_COSTS[model];
    if (!modelConfig) return 0;

    const inputCost = (inputTokens / 1000000) * modelConfig.input;
    const outputCost = (outputTokens / 1000000) * modelConfig.output;
    
    return inputCost + outputCost;
  }

  // Track actual usage and costs
  trackUsage(model: string, inputTokens: number, outputTokens: number, cacheHit: boolean = false) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    
    const usage: CostCalculation = {
      model,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      actualCost: cacheHit ? 0 : cost,
      cacheHit,
      timestamp: new Date()
    };

    this.costTracking.push(usage);
    
    // Update usage stats
    const key = `${model}_${new Date().toISOString().split('T')[0]}`;
    this.usageStats.set(key, (this.usageStats.get(key) || 0) + 1);

    // Clean up old tracking data (keep last 30 days)
    this.cleanupOldTracking();
  }

  // Get usage statistics
  getUsageStats(period: 'day' | 'week' | 'month' = 'month') {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.getPeriodMs(period));
    
    const recentUsage = this.costTracking.filter(usage => usage.timestamp >= cutoff);
    
    const stats = {
      totalRequests: recentUsage.length,
      totalCost: recentUsage.reduce((sum, usage) => sum + (usage.actualCost || 0), 0),
      cacheHitRate: recentUsage.filter(usage => usage.cacheHit).length / recentUsage.length,
      modelBreakdown: this.getModelBreakdown(recentUsage),
      dailyAverage: this.getDailyAverage(recentUsage, period)
    };

    return stats;
  }

  // Check if user has quota remaining
  private checkUserQuota(userTier: string): boolean {
    const tier = USER_TIERS[userTier];
    if (!tier) return false;

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily_${userTier}_${today}`;
    const monthlyKey = `monthly_${userTier}_${new Date().getMonth()}`;

    const dailyUsage = this.usageStats.get(dailyKey) || 0;
    const monthlyUsage = this.usageStats.get(monthlyKey) || 0;

    return dailyUsage < tier.daily_ai_requests && monthlyUsage < tier.monthly_ai_requests;
  }

  // Apply tier-based model overrides
  private applyTierOverrides(selectedModel: string, userTier: string, useCase: string): string {
    const tier = USER_TIERS[userTier];
    
    // Free tier users get more Gemini (free) usage
    if (userTier === 'free' && Math.random() < 0.3) {
      return 'gemini-1.5-flash';
    }

    // Pro tier users get balanced distribution
    if (userTier === 'pro') {
      return selectedModel;
    }

    // Enterprise users get premium models
    if (userTier === 'enterprise' && useCase.includes('complex')) {
      return 'grok-4-fast';
    }

    return selectedModel;
  }

  // Generate cache key for request
  private generateCacheKey(useCase: string, context?: any): string {
    const contextHash = context ? JSON.stringify(context) : '';
    return `${useCase}_${contextHash}`;
  }

  // Get period in milliseconds
  private getPeriodMs(period: string): number {
    switch (period) {
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  // Get model breakdown statistics
  private getModelBreakdown(usage: CostCalculation[]) {
    const breakdown: Record<string, { count: number; cost: number }> = {};
    
    usage.forEach(usage => {
      if (!breakdown[usage.model]) {
        breakdown[usage.model] = { count: 0, cost: 0 };
      }
      breakdown[usage.model].count++;
      breakdown[usage.model].cost += usage.actualCost || 0;
    });

    return breakdown;
  }

  // Get daily average usage
  private getDailyAverage(usage: CostCalculation[], period: string) {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    return {
      requests: usage.length / days,
      cost: usage.reduce((sum, usage) => sum + (usage.actualCost || 0), 0) / days
    };
  }

  // Clean up old tracking data
  private cleanupOldTracking() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.costTracking = this.costTracking.filter(usage => usage.timestamp >= cutoff);
  }

  // Get cost projections - Updated to match exact specifications
  getCostProjections(userCount: number, averageRequestsPerUser: number) {
    const projections = {
      free_tier: {
        users: Math.floor(userCount * 0.8), // 80% free tier
        requests_per_user: averageRequestsPerUser * 0.3, // Reduced usage
        cache_hit_rate: 0.85,
        monthly_cost: 0
      },
      pro_tier: {
        users: Math.floor(userCount * 0.15), // 15% pro tier
        requests_per_user: averageRequestsPerUser * 0.8,
        cache_hit_rate: 0.80,
        monthly_cost: 0
      },
      enterprise_tier: {
        users: Math.floor(userCount * 0.05), // 5% enterprise tier
        requests_per_user: averageRequestsPerUser * 1.2,
        cache_hit_rate: 0.75,
        monthly_cost: 0
      }
    };

    // Calculate costs for each tier - Updated to match exact specifications
    Object.keys(projections).forEach(tier => {
      const tierData = projections[tier];
      const actualRequests = tierData.users * tierData.requests_per_user * (1 - tierData.cache_hit_rate);
      
      // Cost breakdown by model usage - Updated percentages
      const gptCost = actualRequests * 0.6 * 0.001; // 60% GPT-4o Mini
      const claudeCost = actualRequests * 0.2 * 0.005; // 20% Claude Haiku
      const perplexityCost = actualRequests * 0.1 * 0.010; // 10% Perplexity
      const grokCost = Math.max(0, actualRequests * 0.05 * 0.015 - 25); // 5% Grok (with free credits)
      const geminiCost = 0; // 5% Gemini (free)
      
      tierData.monthly_cost = gptCost + claudeCost + perplexityCost + grokCost + geminiCost;
    });

    return projections;
  }
}

// Mira AI Request Router
class MiraAIRouter {
  private modelSelector: AIModelSelectionService;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.modelSelector = new AIModelSelectionService();
  }

  // Route Mira AI request to optimal model
  async routeRequest(request: {
    useCase: string;
    message: string;
    context?: any;
    userId: string;
    userTier: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    const { useCase, message, context, userId, userTier, priority = 'medium' } = request;

    // Check cache first
    const cacheKey = this.generateCacheKey(useCase, message, context);
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse && this.isCacheValid(cachedResponse)) {
      this.modelSelector.trackUsage('cache', 0, 0, true);
      return cachedResponse;
    }

    // Select optimal model
    const selectedModel = this.modelSelector.selectModel(useCase, userTier, context);
    
    if (selectedModel === 'quota_exceeded') {
      throw new Error('AI request quota exceeded. Please upgrade your plan.');
    }

    // Make request to selected model
    const response = await this.makeRequest(selectedModel, request);
    
    // Cache response
    this.cache.set(cacheKey, {
      ...response,
      cachedAt: new Date(),
      ttl: this.getCacheTTL(useCase)
    });

    // Track usage
    this.modelSelector.trackUsage(
      selectedModel,
      this.estimateTokens(message),
      this.estimateTokens(response.content),
      false
    );

    return response;
  }

  // Make request to specific AI model
  private async makeRequest(model: string, request: any) {
    // This would integrate with the actual AI service implementations
    // For now, return a mock response structure
    return {
      content: `Response from ${model} for use case: ${request.useCase}`,
      model,
      usage: {
        inputTokens: this.estimateTokens(request.message),
        outputTokens: this.estimateTokens(`Response from ${model}`)
      },
      timestamp: new Date()
    };
  }

  // Generate cache key
  private generateCacheKey(useCase: string, message: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${useCase}_${message}_${contextStr}`;
  }

  // Check if cache entry is valid
  private isCacheValid(cachedResponse: any): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - cachedResponse.cachedAt.getTime();
    return cacheAge < cachedResponse.ttl;
  }

  // Get cache TTL based on use case
  private getCacheTTL(useCase: string): number {
    const ttlMap: Record<string, number> = {
      'quick_chat': 5 * 60 * 1000, // 5 minutes
      'task_parsing': 60 * 60 * 1000, // 1 hour
      'note_generation': 24 * 60 * 60 * 1000, // 24 hours
      'strategic_planning': 7 * 24 * 60 * 60 * 1000, // 7 days
      'research_queries': 30 * 60 * 1000, // 30 minutes
      'fallback': 60 * 60 * 1000 // 1 hour
    };
    
    return ttlMap[useCase] || 60 * 60 * 1000; // Default 1 hour
  }

  // Estimate token count (simplified)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimation
  }

  // Get usage statistics
  getUsageStats(period: 'day' | 'week' | 'month' = 'month') {
    return this.modelSelector.getUsageStats(period);
  }

  // Get cost projections
  getCostProjections(userCount: number, averageRequestsPerUser: number) {
    return this.modelSelector.getCostProjections(userCount, averageRequestsPerUser);
  }
}

// Export services
export const aiModelSelectionService = new AIModelSelectionService();
export const miraAIRouter = new MiraAIRouter();

// Cost optimization utilities - Updated to match exact specifications
export const costOptimization = {
  // Calculate monthly cost for user base
  calculateMonthlyCost(userCount: number, averageRequestsPerUser: number): number {
    const projections = miraAIRouter.getCostProjections(userCount, averageRequestsPerUser);
    return Object.values(projections).reduce((sum, tier) => sum + tier.monthly_cost, 0);
  },

  // Get recommended tier for user based on usage
  getRecommendedTier(monthlyRequests: number): string {
    if (monthlyRequests <= 150) return 'free';
    if (monthlyRequests <= 1500) return 'pro';
    return 'enterprise';
  },

  // Calculate ROI for AI usage
  calculateROI(aiCost: number, userRevenue: number): number {
    return ((userRevenue - aiCost) / aiCost) * 100;
  },

  // Calculate cost with 80% cache hit rate
  calculateCostWithCache(totalMessages: number, cacheHitRate: number = 0.8): number {
    const actualAICalls = totalMessages * (1 - cacheHitRate);
    
    // Cost breakdown by model usage percentages
    const gptCost = actualAICalls * 0.6 * 0.001; // 60% GPT-4o Mini
    const claudeCost = actualAICalls * 0.2 * 0.005; // 20% Claude Haiku
    const perplexityCost = actualAICalls * 0.1 * 0.010; // 10% Perplexity
    const grokCost = Math.max(0, actualAICalls * 0.05 * 0.015 - 25); // 5% Grok (with free credits)
    const geminiCost = 0; // 5% Gemini (free)
    
    return gptCost + claudeCost + perplexityCost + grokCost + geminiCost;
  },

  // Calculate revenue projections
  calculateRevenueProjections(userCount: number): number {
    const freeUsers = Math.floor(userCount * 0.8); // 80% free tier
    const proUsers = Math.floor(userCount * 0.15); // 15% pro tier
    const enterpriseUsers = Math.floor(userCount * 0.05); // 5% enterprise tier
    
    const proRevenue = proUsers * 9.99; // $9.99/month
    const enterpriseRevenue = enterpriseUsers * 29.99; // $29.99/month
    
    return proRevenue + enterpriseRevenue;
  }
};

// Cost Analysis - Updated to match exact specifications
export const costAnalysis = {
  // Cost calculation with 80% cache hit rate
  // 450K messages × 20% (cache miss) = 90K actual AI calls
  // 90K × 60% × $0.001 (GPT) = $54
  // 90K × 20% × $0.005 (Claude) = $90  
  // 90K × 10% × $0.010 (Perplexity) = $90
  // 90K × 5% × $0.015 (Grok) = $67.50 - $25 (free) = $42.50
  // 90K × 5% × $0.00 (Gemini) = $0
  // Total: $276.50/month ❌

  // SOLUTION: Aggressive quotas + caching
  // Free tier: 5 AI requests/day = ~$5/month (mostly cache hits)
  // Pro tier ($9.99/month): 50 requests/day
  // Target: 80% of users on free tier
  // Revenue: 200 users × $9.99 = $2,000/month
  // AI cost: ~$15/month ✅

  calculateOptimalCost(totalMessages: number): {
    withoutOptimization: number;
    withOptimization: number;
    savings: number;
    roi: number;
  } {
    const cacheHitRate = 0.8;
    const actualAICalls = totalMessages * (1 - cacheHitRate);
    
    // Without optimization (your original calculation)
    const gptCost = actualAICalls * 0.6 * 0.001; // $54
    const claudeCost = actualAICalls * 0.2 * 0.005; // $90
    const perplexityCost = actualAICalls * 0.1 * 0.010; // $90
    const grokCost = actualAICalls * 0.05 * 0.015; // $67.50
    const geminiCost = 0; // $0
    
    const withoutOptimization = gptCost + claudeCost + perplexityCost + grokCost + geminiCost;
    
    // With optimization (quota management)
    const withOptimization = 15; // Target: $15/month
    
    const savings = withoutOptimization - withOptimization;
    const roi = (savings / withoutOptimization) * 100;
    
    return {
      withoutOptimization,
      withOptimization,
      savings,
      roi
    };
  },

  // Calculate user tier distribution for optimal cost
  calculateOptimalDistribution(userCount: number): {
    freeUsers: number;
    proUsers: number;
    enterpriseUsers: number;
    monthlyRevenue: number;
    monthlyAICost: number;
    profit: number;
  } {
    const freeUsers = Math.floor(userCount * 0.8); // 80% free tier
    const proUsers = Math.floor(userCount * 0.15); // 15% pro tier
    const enterpriseUsers = Math.floor(userCount * 0.05); // 5% enterprise tier
    
    const monthlyRevenue = (proUsers * 9.99) + (enterpriseUsers * 29.99);
    const monthlyAICost = 15; // Target AI cost
    const profit = monthlyRevenue - monthlyAICost;
    
    return {
      freeUsers,
      proUsers,
      enterpriseUsers,
      monthlyRevenue,
      monthlyAICost,
      profit
    };
  }
};

// Usage examples
export const usageExamples = {
  // Quick chat request
  async quickChat(message: string, userId: string, userTier: string) {
    return await miraAIRouter.routeRequest({
      useCase: 'quick_chat',
      message,
      userId,
      userTier
    });
  },

  // Strategic planning request
  async strategicPlanning(context: any, userId: string, userTier: string) {
    return await miraAIRouter.routeRequest({
      useCase: 'strategic_planning',
      message: 'Generate strategic plan',
      context,
      userId,
      userTier,
      priority: 'high'
    });
  },

  // Research request
  async researchQuery(query: string, userId: string, userTier: string) {
    return await miraAIRouter.routeRequest({
      useCase: 'research_queries',
      message: query,
      userId,
      userTier
    });
  }
};
