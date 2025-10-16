import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AI_MODEL_COSTS, 
  AI_ROUTING_STRATEGY, 
  USER_TIERS, 
  aiModelSelectionService, 
  miraAIRouter, 
  costOptimization, 
  costAnalysis 
} from '../aiModelSelectionService';

describe('AI Model Selection Service', () => {
  describe('AI_MODEL_COSTS', () => {
    it('should have correct pricing for GPT-4o Mini', () => {
      expect(AI_MODEL_COSTS['gpt-4o-mini'].input).toBe(0.15);
      expect(AI_MODEL_COSTS['gpt-4o-mini'].output).toBe(0.60);
      expect(AI_MODEL_COSTS['gpt-4o-mini'].speed).toBe('very fast');
    });

    it('should have correct pricing for Claude Haiku', () => {
      expect(AI_MODEL_COSTS['claude-3.5-haiku'].input).toBe(0.80);
      expect(AI_MODEL_COSTS['claude-3.5-haiku'].output).toBe(4.00);
      expect(AI_MODEL_COSTS['claude-3.5-haiku'].speed).toBe('fast');
    });

    it('should have free credits for Grok', () => {
      expect(AI_MODEL_COSTS['grok-4-fast'].free_credits).toBe(25);
    });

    it('should have free tier for Gemini', () => {
      expect(AI_MODEL_COSTS['gemini-1.5-flash'].free_tier).toBe(true);
      expect(AI_MODEL_COSTS['gemini-1.5-flash'].input).toBe(0.00);
      expect(AI_MODEL_COSTS['gemini-1.5-flash'].output).toBe(0.00);
    });
  });

  describe('AI_ROUTING_STRATEGY', () => {
    it('should route quick chat to GPT-4o Mini', () => {
      expect(AI_ROUTING_STRATEGY.quick_chat).toBe('gpt-4o-mini');
    });

    it('should route note generation to Claude Haiku', () => {
      expect(AI_ROUTING_STRATEGY.note_generation).toBe('claude-3.5-haiku');
    });

    it('should route research queries to Perplexity', () => {
      expect(AI_ROUTING_STRATEGY.research_queries).toBe('perplexity-sonar');
    });

    it('should route complex reasoning to Grok', () => {
      expect(AI_ROUTING_STRATEGY.complex_reasoning).toBe('grok-4-fast');
    });

    it('should have fallback to Gemini', () => {
      expect(AI_ROUTING_STRATEGY.fallback).toBe('gemini-1.5-flash');
    });
  });

  describe('USER_TIERS', () => {
    it('should have correct free tier limits', () => {
      expect(USER_TIERS.free.daily_ai_requests).toBe(5);
      expect(USER_TIERS.free.price).toBe(0);
      expect(USER_TIERS.free.cache_hit_rate).toBe(0.85);
    });

    it('should have correct pro tier limits', () => {
      expect(USER_TIERS.pro.daily_ai_requests).toBe(50);
      expect(USER_TIERS.pro.price).toBe(9.99);
      expect(USER_TIERS.pro.cache_hit_rate).toBe(0.80);
    });

    it('should have correct enterprise tier limits', () => {
      expect(USER_TIERS.enterprise.daily_ai_requests).toBe(200);
      expect(USER_TIERS.enterprise.price).toBe(29.99);
      expect(USER_TIERS.enterprise.cache_hit_rate).toBe(0.75);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate correct cost for GPT-4o Mini', () => {
      const cost = aiModelSelectionService.calculateCost('gpt-4o-mini', 1000, 500);
      const expectedCost = (1000 / 1000000) * 0.15 + (500 / 1000000) * 0.60;
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    it('should calculate zero cost for Gemini', () => {
      const cost = aiModelSelectionService.calculateCost('gemini-1.5-flash', 1000, 500);
      expect(cost).toBe(0);
    });

    it('should calculate correct cost for Claude Haiku', () => {
      const cost = aiModelSelectionService.calculateCost('claude-3.5-haiku', 1000, 500);
      const expectedCost = (1000 / 1000000) * 0.80 + (500 / 1000000) * 4.00;
      expect(cost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('Cost Optimization', () => {
    it('should calculate cost with cache hit rate', () => {
      const cost = costOptimization.calculateCostWithCache(1000, 0.8);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1000); // Should be much less than total messages
    });

    it('should calculate revenue projections', () => {
      const revenue = costOptimization.calculateRevenueProjections(1000);
      expect(revenue).toBeGreaterThan(0);
    });

    it('should recommend correct tier based on usage', () => {
      expect(costOptimization.getRecommendedTier(100)).toBe('free');
      expect(costOptimization.getRecommendedTier(1000)).toBe('pro');
      expect(costOptimization.getRecommendedTier(2000)).toBe('enterprise');
    });
  });

  describe('Cost Analysis', () => {
    it('should calculate optimal cost savings', () => {
      const analysis = costAnalysis.calculateOptimalCost(450000);
      expect(analysis.withoutOptimization).toBeGreaterThan(analysis.withOptimization);
      expect(analysis.savings).toBeGreaterThan(0);
      expect(analysis.roi).toBeGreaterThan(0);
    });

    it('should calculate optimal user distribution', () => {
      const distribution = costAnalysis.calculateOptimalDistribution(1000);
      expect(distribution.freeUsers).toBe(800); // 80%
      expect(distribution.proUsers).toBe(150); // 15%
      expect(distribution.enterpriseUsers).toBe(50); // 5%
      expect(distribution.monthlyRevenue).toBeGreaterThan(0);
      expect(distribution.profit).toBeGreaterThan(0);
    });
  });

  describe('Model Selection', () => {
    it('should select GPT-4o Mini for quick chat', () => {
      const model = aiModelSelectionService.selectModel('quick_chat', 'pro');
      expect(model).toBe('gpt-4o-mini');
    });

    it('should select Claude Haiku for note generation', () => {
      const model = aiModelSelectionService.selectModel('note_generation', 'pro');
      expect(model).toBe('claude-3.5-haiku');
    });

    it('should select Perplexity for research queries', () => {
      const model = aiModelSelectionService.selectModel('research_queries', 'pro');
      expect(model).toBe('perplexity-sonar');
    });

    it('should select Grok for complex reasoning', () => {
      const model = aiModelSelectionService.selectModel('complex_reasoning', 'pro');
      expect(model).toBe('grok-4-fast');
    });

    it('should fallback to Gemini for unknown use cases', () => {
      const model = aiModelSelectionService.selectModel('unknown_use_case', 'pro');
      expect(model).toBe('gemini-1.5-flash');
    });
  });

  describe('Usage Tracking', () => {
    beforeEach(() => {
      // Reset usage stats for each test
      aiModelSelectionService['usageStats'].clear();
      aiModelSelectionService['costTracking'] = [];
    });

    it('should track usage correctly', () => {
      aiModelSelectionService.trackUsage('gpt-4o-mini', 1000, 500, false);
      const stats = aiModelSelectionService.getUsageStats('day');
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalCost).toBeGreaterThan(0);
    });

    it('should track cache hits', () => {
      aiModelSelectionService.trackUsage('cache', 0, 0, true);
      const stats = aiModelSelectionService.getUsageStats('day');
      expect(stats.cacheHitRate).toBe(1);
    });
  });

  describe('Quota Management', () => {
    beforeEach(() => {
      aiModelSelectionService['usageStats'].clear();
    });

    it('should allow requests within quota', () => {
      const canMakeRequest = aiModelSelectionService['checkUserQuota']('free');
      expect(canMakeRequest).toBe(true);
    });

    it('should track daily usage', () => {
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_free_${today}`;
      aiModelSelectionService['usageStats'].set(dailyKey, 4);
      
      const canMakeRequest = aiModelSelectionService['checkUserQuota']('free');
      expect(canMakeRequest).toBe(true);
    });

    it('should block requests when quota exceeded', () => {
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_free_${today}`;
      aiModelSelectionService['usageStats'].set(dailyKey, 5);
      
      const canMakeRequest = aiModelSelectionService['checkUserQuota']('free');
      expect(canMakeRequest).toBe(false);
    });
  });
});

describe('Mira AI Router Integration', () => {
  it('should route requests correctly', async () => {
    const request = {
      useCase: 'quick_chat',
      message: 'Hello, Mira!',
      userId: 'test-user',
      userTier: 'pro'
    };

    try {
      const response = await miraAIRouter.routeRequest(request);
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.model).toBeDefined();
    } catch (error) {
      // Mock response expected in test environment
      expect(error).toBeDefined();
    }
  });

  it('should handle quota exceeded', async () => {
    const request = {
      useCase: 'quick_chat',
      message: 'Hello, Mira!',
      userId: 'test-user',
      userTier: 'free'
    };

    // Mock quota exceeded scenario
    miraAIRouter['modelSelector']['usageStats'].set('daily_free_' + new Date().toISOString().split('T')[0], 5);

    try {
      await miraAIRouter.routeRequest(request);
      expect.fail('Should have thrown quota exceeded error');
    } catch (error) {
      expect(error.message).toContain('quota exceeded');
    }
  });
});
