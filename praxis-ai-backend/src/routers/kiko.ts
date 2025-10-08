// Kiko AI Chat Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { ChatMessageSchema, ChatSessionSchema, AIRequestSchema } from '../types/ai';
import { AIServiceManager } from '../services/aiService';

// Chat input schemas
const SendMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(4000),
  model: z.enum(['grok', 'gemini', 'openai']).default('grok'),
  context: z.string().optional(),
});

const CreateSessionSchema = z.object({
  title: z.string().optional(),
});

const GetSessionMessagesSchema = z.object({
  sessionId: z.string(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const UpdateSessionSchema = z.object({
  sessionId: z.string(),
  title: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const kikoRouter = router({
  // Send message to Kiko AI
  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get or create session
      let sessionId = input.sessionId;
      if (!sessionId) {
        const { data: newSession } = await supabase
          .from('kiko_conversations')
          .insert({
            user_id: user.id,
            title: input.message.substring(0, 50) + '...',
            is_active: true,
          })
          .select()
          .single();
        
        sessionId = newSession.id;
      }

      // Save user message
      const { data: userMessage } = await supabase
        .from('kiko_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: input.message,
          metadata: {
            model: input.model,
          },
        })
        .select()
        .single();

      // Generate AI response
      const aiService = new AIServiceManager({
        grok: { 
          model: 'grok-beta',
          apiKey: process.env.GROK_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
        gemini: { 
          model: 'gemini-pro',
          apiKey: process.env.GEMINI_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
        openai: { 
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
      });

      const aiResponse = await aiService.generateResponse({
        model: input.model,
        prompt: input.message,
        stream: false,
        maxTokens: 1000,
        temperature: 0.7,
        context: input.context,
      });

      // Save AI response
      const { data: aiMessage } = await supabase
        .from('kiko_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: aiResponse.content,
          metadata: {
            model: aiResponse.model,
            tokens: aiResponse.tokens,
            cost: aiResponse.cost,
          },
        })
        .select()
        .single();

      // Update session timestamp
      await supabase
        .from('kiko_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return {
        sessionId,
        userMessage,
        aiMessage,
        cost: aiResponse.cost,
      };
    }),

  // Get chat sessions
  getSessions: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: sessions } = await supabase
        .from('kiko_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      return sessions || [];
    }),

  // Get session messages
  getSessionMessages: protectedProcedure
    .input(GetSessionMessagesSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: messages } = await supabase
        .from('kiko_messages')
        .select('*')
        .eq('session_id', input.sessionId)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })
        .range(input.offset, input.offset + input.limit - 1);

      return messages || [];
    }),

  // Create new chat session
  createSession: protectedProcedure
    .input(CreateSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newSession } = await supabase
        .from('kiko_conversations')
        .insert({
          user_id: user.id,
          title: input.title || 'New Chat',
          is_active: true,
        })
        .select()
        .single();

      return newSession;
    }),

  // Update chat session
  updateSession: protectedProcedure
    .input(UpdateSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;
      
      updateData.updated_at = new Date().toISOString();

      const { data: updatedSession } = await supabase
        .from('kiko_conversations')
        .update(updateData)
        .eq('id', input.sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedSession;
    }),

  // Delete chat session
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Delete all messages in the session
      await supabase
        .from('kiko_messages')
        .delete()
        .eq('session_id', input.sessionId)
        .eq('user_id', user.id);

      // Delete the session
      await supabase
        .from('kiko_conversations')
        .delete()
        .eq('id', input.sessionId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Get AI usage statistics
  getUsageStats: protectedProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: messages } = await supabase
        .from('kiko_messages')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('role', 'assistant')
        .gte('timestamp', startDate.toISOString());

      const stats = {
        totalMessages: messages?.length || 0,
        totalTokens: messages?.reduce((sum, msg) => sum + (msg.metadata?.tokens || 0), 0) || 0,
        totalCost: messages?.reduce((sum, msg) => sum + (msg.metadata?.cost || 0), 0) || 0,
        modelUsage: {} as Record<string, number>,
      };

      // Count model usage
      messages?.forEach(msg => {
        const model = msg.metadata?.model || 'unknown';
        stats.modelUsage[model] = (stats.modelUsage[model] || 0) + 1;
      });

      return stats;
    }),

  // Generate contextual response based on user data
  generateContextualResponse: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      contextType: z.enum(['tasks', 'notes', 'projects', 'health', 'all']).default('all'),
      model: z.enum(['grok', 'gemini', 'openai']).default('grok'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Gather contextual data
      let context = '';
      
      if (input.contextType === 'tasks' || input.contextType === 'all') {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(10);
        
        context += `Active Tasks: ${JSON.stringify(tasks)}\n`;
      }
      
      if (input.contextType === 'notes' || input.contextType === 'all') {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        
        context += `Recent Notes: ${JSON.stringify(notes)}\n`;
      }
      
      if (input.contextType === 'projects' || input.contextType === 'all') {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        context += `Active Projects: ${JSON.stringify(projects)}\n`;
      }
      
      if (input.contextType === 'health' || input.contextType === 'all') {
        const { data: healthData } = await supabase
          .from('health_data')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(7);
        
        context += `Health Data: ${JSON.stringify(healthData)}\n`;
      }

      // Generate response with context
      const aiService = new AIServiceManager({
        grok: { 
          model: 'grok-beta',
          apiKey: process.env.GROK_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
        gemini: { 
          model: 'gemini-pro',
          apiKey: process.env.GEMINI_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
        openai: { 
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY!,
          maxTokens: 1000,
          temperature: 0.7
        },
      });

      const response = await aiService.generateResponse({
        model: input.model,
        prompt: `${input.prompt}\n\nContext: ${context}`,
        stream: false,
        maxTokens: 1000,
        temperature: 0.7,
      });

      return {
        response: response.content,
        model: response.model,
        tokens: response.tokens,
        cost: response.cost,
      };
    }),
});
