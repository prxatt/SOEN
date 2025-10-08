// AI Orchestrator Router for Praxis-AI
import { z } from 'zod';
import { router, aiRequestProcedure } from '../context';
import { AIRequest } from '../services/ai-orchestrator';

// Input schemas
const AIRequestSchema = z.object({
  message: z.string().min(1),
  featureType: z.enum([
    'kiko_chat',
    'task_parsing',
    'note_generation',
    'note_summary',
    'note_autofill',
    'mindmap_generation',
    'strategic_briefing',
    'vision_ocr',
    'vision_event_detection',
    'calendar_event_parsing',
    'research_with_sources',
    'gmail_event_extraction',
    'completion_summary',
    'completion_image'
  ] as const),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  context: z.object({
    conversationHistory: z.array(z.object({
      role: z.string(),
      content: z.string()
    })).optional(),
    userGoals: z.array(z.object({
      id: z.string(),
      text: z.string(),
      term: z.enum(['short', 'mid', 'long']),
      status: z.enum(['active', 'completed', 'paused'])
    })).optional(),
    recentTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
    })).optional(),
    recentNotes: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string())
    })).optional(),
    userProfile: z.object({
      id: z.string(),
      subscription_tier: z.enum(['free', 'pro', 'team']),
      kiko_personality_mode: z.enum(['supportive', 'tough_love', 'analytical', 'motivational']).optional(),
      daily_ai_requests: z.number()
    }).optional(),
    currentTime: z.date().optional(),
    location: z.string().optional()
  }).optional(),
  files: z.array(z.object({
    mimeType: z.string(),
    base64: z.string()
  })).optional()
});

export const aiOrchestratorRouter = router({
  // Process AI request through orchestrator
  processRequest: aiRequestProcedure
    .input(AIRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const request: AIRequest = {
        userId: ctx.user.id,
        message: input.message,
        featureType: input.featureType,
        priority: input.priority,
        context: {
          conversationHistory: input.context?.conversationHistory || [],
          ...input.context
        },
        files: input.files?.map(f => ({
          filename: 'file',
          mimeType: f.mimeType,
          base64: f.base64
        }))
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return response;
      } catch (error) {
        console.error('AI Orchestrator error:', error);
        throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Kiko chat endpoint
  chatWithKiko: aiRequestProcedure
    .input(z.object({
      message: z.string().min(1),
      conversationHistory: z.array(z.object({
        role: z.string(),
        content: z.string()
      })).optional(),
      personalityMode: z.enum(['supportive', 'tough_love', 'analytical', 'motivational']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      // Get user profile for context
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('subscription_tier, kiko_personality_mode')
        .eq('id', ctx.user.id)
        .single();

      // Get user goals for context
      const { data: goals } = await ctx.supabase
        .from('goals')
        .select('id, text, term, status')
        .eq('user_id', ctx.user.id)
        .eq('status', 'active')
        .limit(5);

      const request: AIRequest = {
        userId: ctx.user.id,
        message: input.message,
        featureType: 'kiko_chat',
        priority: 'medium',
        context: {
          conversationHistory: input.conversationHistory || [],
          userGoals: goals || [],
          userProfile: {
            id: ctx.user.id,
            subscription_tier: profile?.subscription_tier || 'free',
            kiko_personality_mode: input.personalityMode || profile?.kiko_personality_mode || 'supportive',
            daily_ai_requests: 0 // Will be fetched by orchestrator
          },
          currentTime: new Date()
        }
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          content: response.content,
          modelUsed: response.modelUsed,
          confidence: response.confidence,
          processingTimeMs: response.processingTimeMs
        };
      } catch (error) {
        console.error('Kiko chat error:', error);
        throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Task parsing endpoint
  parseTask: aiRequestProcedure
    .input(z.object({
      naturalLanguageInput: z.string().min(1),
      context: z.object({
        currentTime: z.date().optional(),
        location: z.string().optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const request: AIRequest = {
        userId: ctx.user.id,
        message: input.naturalLanguageInput,
        featureType: 'task_parsing',
        priority: 'medium',
        context: {
          conversationHistory: [],
          currentTime: input.context?.currentTime || new Date(),
          location: input.context?.location
        }
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          parsedTask: response.content,
          modelUsed: response.modelUsed,
          confidence: response.confidence
        };
      } catch (error) {
        console.error('Task parsing error:', error);
        throw new Error(`Task parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Strategic briefing endpoint
  generateStrategicBriefing: aiRequestProcedure
    .input(z.object({
      date: z.date().optional(),
      includeHealthData: z.boolean().default(true),
      includeLearningData: z.boolean().default(true),
      includeProductivityData: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const briefingDate = input.date || new Date();

      // Gather briefing data
      const [goals, tasks, notes] = await Promise.all([
        ctx.supabase
          .from('goals')
          .select('id, text, term, status, progress')
          .eq('user_id', ctx.user.id)
          .eq('status', 'active'),
        
        ctx.supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date')
          .eq('user_id', ctx.user.id)
          .gte('created_at', new Date(briefingDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        ctx.supabase
          .from('notes')
          .select('id, title, content, tags')
          .eq('user_id', ctx.user.id)
          .gte('created_at', new Date(briefingDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const briefingMessage = `Generate a strategic briefing for ${briefingDate.toDateString()} based on:
Goals: ${JSON.stringify(goals.data || [])}
Recent Tasks: ${JSON.stringify(tasks.data || [])}
Recent Notes: ${JSON.stringify(notes.data || [])}

Please provide:
1. Goal progress summary
2. Key insights from recent activity
3. Recommended actions for today
4. Priority focus areas`;

      const request: AIRequest = {
        userId: ctx.user.id,
        message: briefingMessage,
        featureType: 'strategic_briefing',
        priority: 'high',
        context: {
          userGoals: goals.data || [],
          recentTasks: tasks.data || [],
          recentNotes: notes.data || [],
          currentTime: briefingDate
        }
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          briefing: response.content,
          modelUsed: response.modelUsed,
          confidence: response.confidence,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Strategic briefing error:', error);
        throw new Error(`Briefing generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Mind map generation endpoint
  generateMindMap: aiRequestProcedure
    .input(z.object({
      focusArea: z.string().optional(),
      includeOpportunities: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      // Gather data for mind map
      const [goals, tasks, notes] = await Promise.all([
        ctx.supabase
          .from('goals')
          .select('id, text, term, status')
          .eq('user_id', ctx.user.id),
        
        ctx.supabase
          .from('tasks')
          .select('id, title, description, status, priority')
          .eq('user_id', ctx.user.id)
          .eq('status', 'active'),
        
        ctx.supabase
          .from('notes')
          .select('id, title, content, tags')
          .eq('user_id', ctx.user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const mindMapMessage = `Generate a mind map connecting these elements:
Goals: ${JSON.stringify(goals.data || [])}
Tasks: ${JSON.stringify(tasks.data || [])}
Notes: ${JSON.stringify(notes.data || [])}
Focus Area: ${input.focusArea || 'all'}
Include Opportunities: ${input.includeOpportunities}`;

      const request: AIRequest = {
        userId: ctx.user.id,
        message: mindMapMessage,
        featureType: 'mindmap_generation',
        priority: 'medium',
        context: {
          userGoals: goals.data || [],
          recentTasks: tasks.data || [],
          recentNotes: notes.data || []
        }
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          mindMap: response.content,
          modelUsed: response.modelUsed,
          confidence: response.confidence
        };
      } catch (error) {
        console.error('Mind map generation error:', error);
        throw new Error(`Mind map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Research with sources endpoint
  researchWithSources: aiRequestProcedure
    .input(z.object({
      query: z.string().min(1),
      maxResults: z.number().min(1).max(20).default(10)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const request: AIRequest = {
        userId: ctx.user.id,
        message: input.query,
        featureType: 'research_with_sources',
        priority: 'medium',
        context: {
          currentTime: new Date()
        }
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          content: response.content,
          sources: response.sources || [],
          modelUsed: response.modelUsed,
          confidence: response.confidence
        };
      } catch (error) {
        console.error('Research error:', error);
        throw new Error(`Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Vision analysis endpoint
  analyzeImage: aiRequestProcedure
    .input(z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
      analysisType: z.enum(['ocr', 'event_detection']),
      context: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const request: AIRequest = {
        userId: ctx.user.id,
        message: input.context || `Analyze this image for ${input.analysisType}`,
        featureType: input.analysisType === 'ocr' ? 'vision_ocr' : 'vision_event_detection',
        priority: 'medium',
        files: [{
          mimeType: input.mimeType,
          base64: input.imageBase64
        }]
      };

      try {
        const response = await ctx.aiOrchestrator.processRequest(request);
        return {
          analysis: response.content,
          modelUsed: response.modelUsed,
          confidence: response.confidence
        };
      } catch (error) {
        console.error('Image analysis error:', error);
        throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get user's AI usage stats
  getUsageStats: aiRequestProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      // Get user profile
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('subscription_tier, daily_ai_requests')
        .eq('id', ctx.user.id)
        .single();

      // Get monthly usage
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: monthlyUsage } = await ctx.supabase
        .from('ai_usage_logs')
        .select('model_used, cost_cents, tokens_used')
        .eq('user_id', ctx.user.id)
        .gte('created_at', startOfMonth.toISOString());

      const limits = {
        free: 5,
        pro: 50,
        team: 500
      };

      return {
        subscriptionTier: profile?.subscription_tier || 'free',
        dailyRequests: profile?.daily_ai_requests || 0,
        dailyLimit: limits[profile?.subscription_tier as keyof typeof limits] || 5,
        monthlyUsage: monthlyUsage || [],
        remainingDailyRequests: Math.max(0, (limits[profile?.subscription_tier as keyof typeof limits] || 5) - (profile?.daily_ai_requests || 0))
      };
    })
});
