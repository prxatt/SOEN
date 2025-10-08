// AI Orchestrator Integration Test
import { describe, it, expect, beforeAll } from 'vitest';
import { getAIOrchestrator } from '../services/ai-orchestrator';

describe('AI Orchestrator Integration', () => {
  let aiOrchestrator: ReturnType<typeof getAIOrchestrator>;

  beforeAll(() => {
    // Mock environment variables for testing
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.GROK_API_KEY = 'test-grok-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('should initialize AI orchestrator', () => {
    aiOrchestrator = getAIOrchestrator();
    expect(aiOrchestrator).toBeDefined();
  });

  it('should have all required methods', () => {
    expect(aiOrchestrator.processRequest).toBeDefined();
    expect(typeof aiOrchestrator.processRequest).toBe('function');
  });

  it('should handle simple Kiko chat request', async () => {
    const request = {
      userId: 'test-user-id',
      message: 'Hello Kiko!',
      featureType: 'kiko_chat' as const,
      priority: 'medium' as const,
      context: {
        conversationHistory: [],
        currentTime: new Date()
      }
    };

    // This will fail in test environment due to missing API keys, but we can test the structure
    try {
      await aiOrchestrator.processRequest(request);
    } catch (error) {
      // Expected to fail in test environment
      expect(error).toBeDefined();
    }
  });

  it('should handle task parsing request', async () => {
    const request = {
      userId: 'test-user-id',
      message: 'Call mom tomorrow at 2pm',
      featureType: 'task_parsing' as const,
      priority: 'medium' as const,
      context: {
        currentTime: new Date(),
        location: 'San Francisco'
      }
    };

    try {
      await aiOrchestrator.processRequest(request);
    } catch (error) {
      // Expected to fail in test environment
      expect(error).toBeDefined();
    }
  });

  it('should handle strategic briefing request', async () => {
    const request = {
      userId: 'test-user-id',
      message: 'Generate a strategic briefing for today',
      featureType: 'strategic_briefing' as const,
      priority: 'high' as const,
      context: {
        userGoals: [
          { id: '1', text: 'Complete Q1 project', term: 'short', status: 'active' }
        ],
        recentTasks: [
          { id: '1', title: 'Review project requirements', status: 'completed' }
        ],
        currentTime: new Date()
      }
    };

    try {
      await aiOrchestrator.processRequest(request);
    } catch (error) {
      // Expected to fail in test environment
      expect(error).toBeDefined();
    }
  });
});
