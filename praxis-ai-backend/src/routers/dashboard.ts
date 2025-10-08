// Dashboard Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { WidgetDataSchema, ScheduleWidgetSchema, CalendarWidgetSchema, WeatherWidgetSchema, ActionsWidgetSchema, InsightsWidgetSchema, HealthWidgetSchema, FlowWidgetSchema } from '../types/widgets';
import { AIServiceManager } from '../services/aiService';

// Dashboard input schemas
const GetDashboardDataSchema = z.object({
  date: z.string().optional(),
  widgets: z.array(z.enum(['schedule', 'calendar', 'weather', 'actions', 'insights', 'health', 'flow'])).optional(),
});

const UpdateWidgetSchema = z.object({
  widgetId: z.string(),
  data: z.any(),
});

const CreateWidgetSchema = z.object({
  type: z.enum(['schedule', 'calendar', 'weather', 'actions', 'insights', 'health', 'flow']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  data: z.any().optional(),
});

export const dashboardRouter = router({
  // Get aggregated dashboard data
  getDashboardData: protectedProcedure
    .input(GetDashboardDataSchema)
    .output(WidgetDataSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      const date = input.date ? new Date(input.date) : new Date();
      
      // Get user's widgets configuration
      const { data: userWidgets } = await supabase
        .from('user_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Aggregate data for each widget type
      const widgetData = {
        schedule: await getScheduleData(supabase, user.id, date),
        calendar: await getCalendarData(supabase, user.id, date),
        weather: await getWeatherData(user.id),
        actions: await getActionsData(supabase, user.id),
        insights: await getInsightsData(supabase, user.id, date),
        health: await getHealthData(supabase, user.id, date),
        flow: await getFlowData(supabase, user.id, date),
      };

      return widgetData;
    }),

  // Get strategic briefing
  getStrategicBriefing: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      dataSource: z.enum(['tasks', 'notes', 'health', 'projects', 'all']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      const date = input.date ? new Date(input.date) : new Date();
      
      // Collect context data based on dataSource
      let context = '';
      
      if (input.dataSource === 'tasks' || input.dataSource === 'all') {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        context += `Recent Tasks: ${JSON.stringify(tasks)}\n`;
      }
      
      if (input.dataSource === 'notes' || input.dataSource === 'all') {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        context += `Recent Notes: ${JSON.stringify(notes)}\n`;
      }
      
      if (input.dataSource === 'health' || input.dataSource === 'all') {
        const { data: healthData } = await supabase
          .from('health_data')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        context += `Health Data: ${JSON.stringify(healthData)}\n`;
      }
      
      if (input.dataSource === 'projects' || input.dataSource === 'all') {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        context += `Active Projects: ${JSON.stringify(projects)}\n`;
      }

      // Generate strategic briefing using AI
      const aiService = new AIServiceManager({
        grok: { apiKey: process.env.GROK_API_KEY! },
        gemini: { apiKey: process.env.GEMINI_API_KEY! },
        openai: { apiKey: process.env.OPENAI_API_KEY! },
      });

      const briefing = await aiService.generateStrategicBriefing(context);
      
      // Save briefing to database
      const { data: savedBriefing } = await supabase
        .from('strategic_briefings')
        .insert({
          user_id: user.id,
          title: JSON.parse(briefing).title,
          summary: JSON.parse(briefing).summary,
          key_insights: JSON.parse(briefing).keyInsights,
          suggested_actions: JSON.parse(briefing).suggestedActions,
          data_source: input.dataSource,
        })
        .select()
        .single();

      return savedBriefing;
    }),

  // Update widget data
  updateWidget: protectedProcedure
    .input(UpdateWidgetSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: updatedWidget } = await supabase
        .from('user_widgets')
        .update({
          data: input.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.widgetId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedWidget;
    }),

  // Create new widget
  createWidget: protectedProcedure
    .input(CreateWidgetSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newWidget } = await supabase
        .from('user_widgets')
        .insert({
          user_id: user.id,
          type: input.type,
          position: input.position,
          size: input.size,
          data: input.data || {},
          is_active: true,
        })
        .select()
        .single();

      return newWidget;
    }),

  // Delete widget
  deleteWidget: protectedProcedure
    .input(z.object({ widgetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('user_widgets')
        .update({ is_active: false })
        .eq('id', input.widgetId)
        .eq('user_id', user.id);

      return { success: true };
    }),
});

// Helper functions for data aggregation
async function getScheduleData(supabase: any, userId: string, date: Date) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', date.toISOString())
    .order('start_time', { ascending: true });

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', date.toISOString())
    .order('start_time', { ascending: true });

  return {
    view: 'today',
    tasks: tasks || [],
    upcomingEvents: events || [],
  };
}

async function getCalendarData(supabase: any, userId: string, date: Date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString());

  return {
    currentDate: date.toISOString(),
    events: events || [],
    holidays: [], // Would integrate with holiday API
  };
}

async function getWeatherData(userId: string) {
  // This would integrate with a weather API
  // For now, return mock data
  return {
    location: 'San Francisco, CA',
    currentTemp: 72,
    condition: 'Partly Cloudy',
    conditionIcon: 'partly-cloudy',
    hourlyForecast: [],
    dailyForecast: [],
  };
}

async function getActionsData(supabase: any, userId: string) {
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  return {
    quickActions: [
      { id: '1', title: 'New Task', icon: 'plus', action: 'create_task' },
      { id: '2', title: 'New Note', icon: 'note', action: 'create_note' },
      { id: '3', title: 'Focus Mode', icon: 'focus', action: 'start_focus' },
    ],
    recentTasks: recentTasks || [],
    suggestedActions: [], // Would be AI-generated
  };
}

async function getInsightsData(supabase: any, userId: string, date: Date) {
  const { data: recentBriefing } = await supabase
    .from('strategic_briefings')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  return {
    strategicBriefing: recentBriefing || {
      title: 'No briefing available',
      summary: 'Generate a strategic briefing to see insights here.',
      keyInsights: [],
      suggestedActions: [],
    },
    mindMap: { nodes: [], edges: [] },
    actionableInsights: [],
  };
}

async function getHealthData(supabase: any, userId: string, date: Date) {
  const { data: healthData } = await supabase
    .from('health_data')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date.toISOString().split('T')[0])
    .single();

  return {
    metrics: {
      steps: healthData?.steps || 0,
      sleep: healthData?.sleep || 0,
      water: healthData?.water || 0,
      heartRate: healthData?.heart_rate,
      caloriesBurned: healthData?.calories_burned,
    },
    healthRings: [
      { name: 'Activity', value: 75, fill: '#3B82F6' },
      { name: 'Energy', value: 60, fill: '#10B981' },
      { name: 'Sleep', value: 80, fill: '#8B5CF6' },
    ],
    recentWorkouts: [],
    sleepData: {
      avgHours: 7.5,
      quality: 'good',
      bedtime: '11:00 PM',
      wakeTime: '6:30 AM',
    },
  };
}

async function getFlowData(supabase: any, userId: string, date: Date) {
  const { data: points } = await supabase
    .from('praxis_points')
    .select('points')
    .eq('user_id', userId);

  const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

  return {
    points: {
      total: totalPoints,
      today: 0, // Would calculate from today's points
      thisWeek: 0, // Would calculate from this week's points
    },
    streaks: {
      current: 0,
      longest: 0,
      type: 'daily',
    },
    level: {
      current: Math.floor(totalPoints / 1000),
      progress: totalPoints % 1000,
      nextLevelPoints: 1000,
    },
    recentRewards: [],
    achievements: [],
  };
}
