// Schedule Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';

// Schedule input schemas
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string(),
  duration: z.number().min(1).max(1440), // minutes
  category: z.string().default('General'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().optional(),
  location: z.string().optional(),
  linkedUrl: z.string().url().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
});

const UpdateTaskSchema = z.object({
  taskId: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  duration: z.number().min(1).max(1440).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  projectId: z.string().optional(),
  location: z.string().optional(),
  linkedUrl: z.string().url().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
});

const GetTasksSchema = z.object({
  date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const CreateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).default([]),
  source: z.enum(['google_calendar', 'manual']).default('manual'),
  googleCalendarEventId: z.string().optional(),
});

export const scheduleRouter = router({
  // Create task
  createTask: protectedProcedure
    .input(CreateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newTask } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          start_time: input.startTime,
          duration: input.duration,
          category: input.category,
          priority: input.priority,
          project_id: input.projectId,
          location: input.location,
          linked_url: input.linkedUrl,
          repeat: input.repeat,
          status: 'pending',
        })
        .select()
        .single();

      // Award points for task creation
      await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: 5,
          source: 'task_completion',
          description: 'Created a new task',
        });

      return newTask;
    }),

  // Update task
  updateTask: protectedProcedure
    .input(UpdateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.startTime !== undefined) updateData.start_time = input.startTime;
      if (input.duration !== undefined) updateData.duration = input.duration;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.linkedUrl !== undefined) updateData.linked_url = input.linkedUrl;
      if (input.repeat !== undefined) updateData.repeat = input.repeat;

      // If task is completed, set completion time
      if (input.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedTask } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', input.taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      // Award points for task completion
      if (input.status === 'completed') {
        await supabase
          .from('praxis_points')
          .insert({
            user_id: user.id,
            points: 15,
            source: 'task_completion',
            description: `Completed task: ${updatedTask.title}`,
          });
      }

      return updatedTask;
    }),

  // Get tasks
  getTasks: protectedProcedure
    .input(GetTasksSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (input.date) {
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte('start_time', startOfDay.toISOString())
                    .lte('start_time', endOfDay.toISOString());
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.category) {
        query = query.eq('category', input.category);
      }

      if (input.projectId) {
        query = query.eq('project_id', input.projectId);
      }

      const { data: tasks } = await query
        .range(input.offset, input.offset + input.limit - 1);

      return tasks || [];
    }),

  // Get single task
  getTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', input.taskId)
        .eq('user_id', user.id)
        .single();

      return task;
    }),

  // Delete task
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('tasks')
        .delete()
        .eq('id', input.taskId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Create calendar event
  createCalendarEvent: protectedProcedure
    .input(CreateCalendarEventSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newEvent } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          start_time: input.startTime,
          end_time: input.endTime,
          all_day: input.allDay,
          location: input.location,
          attendees: input.attendees,
          source: input.source,
          google_calendar_event_id: input.googleCalendarEventId,
        })
        .select()
        .single();

      return newEvent;
    }),

  // Get calendar events
  getCalendarEvents: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      source: z.enum(['google_calendar', 'manual', 'all']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', input.startDate)
        .lte('end_time', input.endDate)
        .order('start_time', { ascending: true });

      if (input.source !== 'all') {
        query = query.eq('source', input.source);
      }

      const { data: events } = await query;

      return events || [];
    }),

  // Get schedule overview
  getScheduleOverview: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      view: z.enum(['day', 'week', 'month']).default('day'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const date = input.date ? new Date(input.date) : new Date();
      let startDate: Date;
      let endDate: Date;

      switch (input.view) {
        case 'day':
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date(date);
          startDate.setDate(date.getDate() - date.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      // Get tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      // Get calendar events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      return {
        tasks: tasks || [],
        events: events || [],
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        view: input.view,
      };
    }),

  // Get task statistics
  getTaskStats: protectedProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'year']).default('week'),
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
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, category, duration, completed_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const stats = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        pending: tasks?.filter(t => t.status === 'pending').length || 0,
        cancelled: tasks?.filter(t => t.status === 'cancelled').length || 0,
        completionRate: 0,
        totalDuration: tasks?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0,
        averageDuration: 0,
        categoryBreakdown: {} as Record<string, number>,
      };

      if (stats.total > 0) {
        stats.completionRate = (stats.completed / stats.total) * 100;
        stats.averageDuration = stats.totalDuration / stats.total;
        
        // Category breakdown
        tasks?.forEach(task => {
          const category = task.category || 'Uncategorized';
          stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
        });
      }

      return stats;
    }),

  // Sync with Google Calendar
  syncGoogleCalendar: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      // This would integrate with Google Calendar API
      // For now, return a mock response
      
      return {
        success: true,
        eventsSynced: 0,
        lastSync: new Date().toISOString(),
        message: 'Google Calendar sync not yet implemented',
      };
    }),

  // Get upcoming tasks
  getUpcomingTasks: protectedProcedure
    .input(z.object({
      hours: z.number().min(1).max(168).default(24), // Default to next 24 hours
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const now = new Date();
      const futureTime = new Date(now.getTime() + input.hours * 60 * 60 * 1000);

      const { data: upcomingTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('start_time', now.toISOString())
        .lte('start_time', futureTime.toISOString())
        .order('start_time', { ascending: true });

      return upcomingTasks || [];
    }),
});

