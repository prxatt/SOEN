// Insights Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { MindMapSchema, StrategicBriefingSchema } from '../types/ai';
import { AIServiceManager } from '../services/aiService';

// Insights input schemas
const GenerateInsightsSchema = z.object({
  dataSource: z.enum(['tasks', 'notes', 'projects', 'health', 'all']).default('all'),
  insightType: z.enum(['strategic_briefing', 'mind_map', 'actionable_insights', 'all']).default('all'),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

const CreateMindMapSchema = z.object({
  title: z.string().min(1).max(200),
  data: z.any(),
  isTemplate: z.boolean().default(false),
});

const UpdateMindMapSchema = z.object({
  mindMapId: z.string(),
  title: z.string().min(1).max(200).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

const GetInsightsSchema = z.object({
  type: z.enum(['strategic_briefing', 'mind_map', 'actionable_insights']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const insightsRouter = router({
  // Generate comprehensive insights
  generateInsights: protectedProcedure
    .input(GenerateInsightsSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Collect data based on dataSource
      let contextData: any = {};
      
      if (input.dataSource === 'tasks' || input.dataSource === 'all') {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);
        
        if (input.dateRange) {
          const startDate = new Date(input.dateRange.start);
          const endDate = new Date(input.dateRange.end);
          contextData.tasks = tasks?.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
          }) || [];
        } else {
          contextData.tasks = tasks || [];
        }
      }
      
      if (input.dataSource === 'notes' || input.dataSource === 'all') {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (input.dateRange) {
          const startDate = new Date(input.dateRange.start);
          const endDate = new Date(input.dateRange.end);
          contextData.notes = notes?.filter(note => {
            const noteDate = new Date(note.created_at);
            return noteDate >= startDate && noteDate <= endDate;
          }) || [];
        } else {
          contextData.notes = notes || [];
        }
      }
      
      if (input.dataSource === 'projects' || input.dataSource === 'all') {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        
        contextData.projects = projects || [];
      }
      
      if (input.dataSource === 'health' || input.dataSource === 'all') {
        const { data: healthData } = await supabase
          .from('health_data')
          .select('*')
          .eq('user_id', user.id);
        
        if (input.dateRange) {
          const startDate = new Date(input.dateRange.start);
          const endDate = new Date(input.dateRange.end);
          contextData.health = healthData?.filter(health => {
            const healthDate = new Date(health.date);
            return healthDate >= startDate && healthDate <= endDate;
          }) || [];
        } else {
          contextData.health = healthData || [];
        }
      }

      const aiService = new AIServiceManager({
        grok: { apiKey: process.env.GROK_API_KEY! },
        gemini: { apiKey: process.env.GEMINI_API_KEY! },
        openai: { apiKey: process.env.OPENAI_API_KEY! },
      });

      const results: any = {};

      // Generate strategic briefing
      if (input.insightType === 'strategic_briefing' || input.insightType === 'all') {
        const briefing = await aiService.generateStrategicBriefing(JSON.stringify(contextData));
        const briefingData = JSON.parse(briefing);
        
        const { data: savedBriefing } = await supabase
          .from('strategic_briefings')
          .insert({
            user_id: user.id,
            title: briefingData.title,
            summary: briefingData.summary,
            key_insights: briefingData.keyInsights,
            suggested_actions: briefingData.suggestedActions,
            data_source: input.dataSource,
          })
          .select()
          .single();
        
        results.strategicBriefing = savedBriefing;
      }

      // Generate mind map
      if (input.insightType === 'mind_map' || input.insightType === 'all') {
        const mindMapData = await aiService.generateMindMap(contextData);
        
        const { data: savedMindMap } = await supabase
          .from('mind_maps')
          .insert({
            user_id: user.id,
            title: `Insights Map - ${new Date().toLocaleDateString()}`,
            nodes: mindMapData.nodes,
            edges: mindMapData.edges,
          })
          .select()
          .single();
        
        results.mindMap = savedMindMap;
      }

      // Generate actionable insights
      if (input.insightType === 'actionable_insights' || input.insightType === 'all') {
        const insights = await aiService.generateResponse({
          prompt: `Generate 5-10 specific, actionable insights from this data: ${JSON.stringify(contextData)}`,
        });
        
        const { data: savedInsights } = await supabase
          .from('actionable_insights')
          .insert({
            user_id: user.id,
            title: 'AI-Generated Insights',
            description: insights.content,
            priority: 'medium',
            category: 'ai_generated',
            data_source: input.dataSource,
          })
          .select()
          .single();
        
        results.actionableInsights = savedInsights;
      }

      return results;
    }),

  // Create mind map
  createMindMap: protectedProcedure
    .input(CreateMindMapSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newMindMap } = await supabase
        .from('mind_maps')
        .insert({
          user_id: user.id,
          title: input.title,
          nodes: input.data.nodes || [],
          edges: input.data.edges || [],
          is_template: input.isTemplate,
        })
        .select()
        .single();

      return newMindMap;
    }),

  // Update mind map
  updateMindMap: protectedProcedure
    .input(UpdateMindMapSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.nodes !== undefined) updateData.nodes = input.nodes;
      if (input.edges !== undefined) updateData.edges = input.edges;

      const { data: updatedMindMap } = await supabase
        .from('mind_maps')
        .update(updateData)
        .eq('id', input.mindMapId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedMindMap;
    }),

  // Get insights
  getInsights: protectedProcedure
    .input(GetInsightsSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const results: any = {};

      if (!input.type || input.type === 'strategic_briefing') {
        const { data: briefings } = await supabase
          .from('strategic_briefings')
          .select('*')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);
        
        results.strategicBriefings = briefings || [];
      }

      if (!input.type || input.type === 'mind_map') {
        const { data: mindMaps } = await supabase
          .from('mind_maps')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);
        
        results.mindMaps = mindMaps || [];
      }

      if (!input.type || input.type === 'actionable_insights') {
        const { data: insights } = await supabase
          .from('actionable_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);
        
        results.actionableInsights = insights || [];
      }

      return results;
    }),

  // Get single mind map
  getMindMap: protectedProcedure
    .input(z.object({ mindMapId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: mindMap } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('id', input.mindMapId)
        .eq('user_id', user.id)
        .single();

      return mindMap;
    }),

  // Delete mind map
  deleteMindMap: protectedProcedure
    .input(z.object({ mindMapId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('mind_maps')
        .delete()
        .eq('id', input.mindMapId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Get insight templates
  getInsightTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: templates } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      return templates || [];
    }),

  // Generate personalized insights
  generatePersonalizedInsights: protectedProcedure
    .input(z.object({
      focusArea: z.enum(['productivity', 'health', 'learning', 'creativity', 'all']).default('all'),
      timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get user's historical data
      const endDate = new Date();
      const startDate = new Date();
      
      switch (input.timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Collect relevant data
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .is('deleted_at', null);

      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      const context = {
        timeframe: input.timeframe,
        focusArea: input.focusArea,
        tasks: tasks || [],
        notes: notes || [],
        healthData: healthData || [],
      };

      const aiService = new AIServiceManager({
        grok: { apiKey: process.env.GROK_API_KEY! },
        gemini: { apiKey: process.env.GEMINI_API_KEY! },
        openai: { apiKey: process.env.OPENAI_API_KEY! },
      });

      const insights = await aiService.generateResponse({
        prompt: `Generate personalized insights for this user data focusing on ${input.focusArea} over the ${input.timeframe}: ${JSON.stringify(context)}`,
      });

      return {
        insights: insights.content,
        generatedAt: new Date().toISOString(),
        timeframe: input.timeframe,
        focusArea: input.focusArea,
      };
    }),
});

