// Notes Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { NoteSchema } from '../types/ai';
import { AIServiceManager } from '../services/aiService';

// Notes input schemas
const CreateNoteSchema = z.object({
  notebookId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    type: z.enum(['image', 'pdf', 'link']),
    name: z.string(),
    url: z.string(),
  })).default([]),
});

const UpdateNoteSchema = z.object({
  noteId: z.string(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'pdf', 'link']),
    name: z.string(),
    url: z.string(),
  })).optional(),
});

const GetNotesSchema = z.object({
  notebookId: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const ProcessNoteSchema = z.object({
  noteId: z.string(),
  processType: z.enum(['summarize', 'extract_actions', 'generate_insights', 'all']),
});

export const notesRouter = router({
  // Create new note
  createNote: protectedProcedure
    .input(CreateNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newNote } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          notebook_id: input.notebookId,
          title: input.title,
          content: input.content,
          tags: input.tags,
          attachments: input.attachments,
        })
        .select()
        .single();

      // Award points for note creation
      await supabase
        .from('profiles')
        .update({
          praxis_flow_points: supabase.raw('praxis_flow_points + 10'),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return newNote;
    }),

  // Update note
  updateNote: protectedProcedure
    .input(UpdateNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.attachments !== undefined) updateData.attachments = input.attachments;

      const { data: updatedNote } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', input.noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedNote;
    }),

  // Get notes
  getNotes: protectedProcedure
    .input(GetNotesSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (input.notebookId) {
        query = query.eq('notebook_id', input.notebookId);
      }

      if (input.search) {
        query = query.or(`title.ilike.%${input.search}%,content.ilike.%${input.search}%`);
      }

      if (input.tags && input.tags.length > 0) {
        query = query.overlaps('tags', input.tags);
      }

      const { data: notes } = await query
        .range(input.offset, input.offset + input.limit - 1);

      return notes || [];
    }),

  // Get single note
  getNote: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: note } = await supabase
        .from('notes')
        .select('*')
        .eq('id', input.noteId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      return note;
    }),

  // Delete note (soft delete)
  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', input.noteId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Process note with AI
  processNote: protectedProcedure
    .input(ProcessNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get the note
      const { data: note } = await supabase
        .from('notes')
        .select('*')
        .eq('id', input.noteId)
        .eq('user_id', user.id)
        .single();

      if (!note) {
        throw new Error('Note not found');
      }

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

      const updateData: any = {};

      // Process based on type
      if (input.processType === 'summarize' || input.processType === 'all') {
        const summary = await aiService.summarizeNotes(note.content);
        updateData.ai_summary = summary;
      }

      if (input.processType === 'extract_actions' || input.processType === 'all') {
        const actionItems = await aiService.extractActionItems(note.content);
        updateData.action_items = actionItems.map((item, index) => ({
          id: `action_${index}`,
          text: item,
          completed: false,
          priority: 'medium',
        }));
      }

      if (input.processType === 'generate_insights' || input.processType === 'all') {
        const insights = await aiService.generateResponse({
          model: 'grok',
          prompt: `Generate actionable insights from this note content: ${note.content}`,
          stream: false,
          maxTokens: 500,
          temperature: 0.7,
        });
        updateData.ai_insights = insights.content;
      }

      // Update the note
      const { data: updatedNote } = await supabase
        .from('notes')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedNote;
    }),

  // Search notes
  searchNotes: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      notebookId: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (input.notebookId) {
        query = query.eq('notebook_id', input.notebookId);
      }

      if (input.tags && input.tags.length > 0) {
        query = query.overlaps('tags', input.tags);
      }

      // Full-text search
      query = query.or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%,ai_summary.ilike.%${input.query}%`);

      const { data: notes } = await query
        .order('updated_at', { ascending: false })
        .limit(50);

      return notes || [];
    }),

  // Get note statistics
  getNoteStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: stats } = await supabase
        .from('notes')
        .select('id, created_at, tags')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const totalNotes = stats?.length || 0;
      const totalTags = new Set(stats?.flatMap(note => note.tags || [])).size;
      const notesThisWeek = stats?.filter(note => 
        new Date(note.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      return {
        totalNotes,
        totalTags,
        notesThisWeek,
        averageNotesPerWeek: Math.round(totalNotes / Math.max(1, Math.floor((Date.now() - new Date(stats?.[0]?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)))),
      };
    }),

  // Get popular tags
  getPopularTags: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: notes } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const tagCounts: Record<string, number> = {};
      notes?.forEach(note => {
        note.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, input.limit)
        .map(([tag, count]) => ({ tag, count }));
    }),

  // Export notes
  exportNotes: protectedProcedure
    .input(z.object({
      format: z.enum(['json', 'markdown', 'pdf']).default('json'),
      notebookId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (input.notebookId) {
        query = query.eq('notebook_id', input.notebookId);
      }

      const { data: notes } = await query.order('created_at', { ascending: true });

      switch (input.format) {
        case 'json':
          return { data: notes, format: 'json' };
        case 'markdown':
          const markdown = notes?.map(note => 
            `# ${note.title}\n\n${note.content}\n\n---\n`
          ).join('\n') || '';
          return { data: markdown, format: 'markdown' };
        case 'pdf':
          // Would implement PDF generation here
          return { data: 'PDF export not yet implemented', format: 'pdf' };
        default:
          return { data: notes, format: 'json' };
      }
    }),
});
