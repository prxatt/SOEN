// Projects Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';

// Projects input schemas
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  color: z.string().default('#3B82F6'),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const UpdateProjectSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'paused']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  color: z.string().optional(),
  dueDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

const GetProjectsSchema = z.object({
  status: z.enum(['active', 'completed', 'archived', 'paused']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const projectsRouter = router({
  // Create new project
  createProject: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newProject } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          color: input.color,
          due_date: input.dueDate,
          tags: input.tags,
          progress: 0,
        })
        .select()
        .single();

      // Award points for project creation
      await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: 25,
          source: 'project_creation',
          description: 'Created a new project',
        });

      return newProject;
    }),

  // Update project
  updateProject: protectedProcedure
    .input(UpdateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.progress !== undefined) updateData.progress = input.progress;
      if (input.tags !== undefined) updateData.tags = input.tags;

      // If project is completed, set completion date
      if (input.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }

      const { data: updatedProject } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', input.projectId)
        .eq('user_id', user.id)
        .select()
        .single();

      // Award points for project completion
      if (input.status === 'completed') {
        await supabase
          .from('praxis_points')
          .insert({
            user_id: user.id,
            points: 100,
            source: 'project_completion',
            description: `Completed project: ${updatedProject.title}`,
          });
      }

      return updatedProject;
    }),

  // Get projects
  getProjects: protectedProcedure
    .input(GetProjectsSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.priority) {
        query = query.eq('priority', input.priority);
      }

      if (input.search) {
        query = query.or(`title.ilike.%${input.search}%,description.ilike.%${input.search}%`);
      }

      if (input.tags && input.tags.length > 0) {
        query = query.overlaps('tags', input.tags);
      }

      const { data: projects } = await query
        .range(input.offset, input.offset + input.limit - 1);

      return projects || [];
    }),

  // Get single project
  getProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', input.projectId)
        .eq('user_id', user.id)
        .single();

      return project;
    }),

  // Delete project
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('projects')
        .delete()
        .eq('id', input.projectId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Get project statistics
  getProjectStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: projects } = await supabase
        .from('projects')
        .select('status, priority, created_at, completed_at')
        .eq('user_id', user.id);

      const stats = {
        total: projects?.length || 0,
        active: projects?.filter(p => p.status === 'active').length || 0,
        completed: projects?.filter(p => p.status === 'completed').length || 0,
        archived: projects?.filter(p => p.status === 'archived').length || 0,
        paused: projects?.filter(p => p.status === 'paused').length || 0,
        completionRate: 0,
        averageCompletionTime: 0,
      };

      if (stats.total > 0) {
        stats.completionRate = (stats.completed / stats.total) * 100;
        
        // Calculate average completion time
        const completedProjects = projects?.filter(p => p.status === 'completed' && p.completed_at);
        if (completedProjects && completedProjects.length > 0) {
          const totalDays = completedProjects.reduce((sum, project) => {
            const created = new Date(project.created_at);
            const completed = new Date(project.completed_at!);
            return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0);
          stats.averageCompletionTime = totalDays / completedProjects.length;
        }
      }

      return stats;
    }),

  // Get project progress timeline
  getProjectTimeline: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get project tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Get project milestones
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      return {
        tasks: tasks || [],
        milestones: milestones || [],
      };
    }),

  // Generate project insights
  generateProjectInsights: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get project data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', input.projectId)
        .eq('user_id', user.id)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      // Get related tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('user_id', user.id);

      // Get related notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('user_id', user.id);

      const context = {
        project,
        tasks: tasks || [],
        notes: notes || [],
      };

      // Generate insights using AI
      const insights = await ctx.aiService.generateResponse({
        prompt: `Analyze this project data and provide insights: ${JSON.stringify(context)}`,
      });

      return {
        projectId: input.projectId,
        insights: insights.content,
        generatedAt: new Date().toISOString(),
      };
    }),
});
