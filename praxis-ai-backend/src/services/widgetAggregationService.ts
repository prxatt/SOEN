// Widget Data Aggregation Service for Praxis-AI
import { WidgetData, ScheduleWidget, CalendarWidget, WeatherWidget, ActionsWidget, InsightsWidget, HealthWidget, FlowWidget } from '../types/widgets';
import { EnhancedAIServiceManager } from './enhancedAIServiceManager';

export interface WidgetAggregationService {
  aggregateDashboardData(userId: string, date: Date): Promise<WidgetData>;
  getScheduleWidget(userId: string, date: Date): Promise<ScheduleWidget['data']>;
  getCalendarWidget(userId: string, date: Date): Promise<CalendarWidget['data']>;
  getWeatherWidget(userId: string): Promise<WeatherWidget['data']>;
  getActionsWidget(userId: string): Promise<ActionsWidget['data']>;
  getInsightsWidget(userId: string, date: Date): Promise<InsightsWidget['data']>;
  getHealthWidget(userId: string, date: Date): Promise<HealthWidget['data']>;
  getFlowWidget(userId: string, date: Date): Promise<FlowWidget['data']>;
}

export class PraxisWidgetAggregationService implements WidgetAggregationService {
  constructor(
    private supabase: any,
    private aiService: EnhancedAIServiceManager
  ) {}

  async aggregateDashboardData(userId: string, date: Date): Promise<WidgetData> {
    const [
      schedule,
      calendar,
      weather,
      actions,
      insights,
      health,
      flow
    ] = await Promise.all([
      this.getScheduleWidget(userId, date),
      this.getCalendarWidget(userId, date),
      this.getWeatherWidget(userId),
      this.getActionsWidget(userId),
      this.getInsightsWidget(userId, date),
      this.getHealthWidget(userId, date),
      this.getFlowWidget(userId, date),
    ]);

    return {
      schedule,
      calendar,
      weather,
      actions,
      insights,
      health,
      flow,
    };
  }

  async getScheduleWidget(userId: string, date: Date): Promise<ScheduleWidget['data']> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get tasks for the day
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    // Get upcoming events
    const { data: events } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    return {
      view: 'today',
      tasks: tasks?.map(task => ({
        id: task.id,
        title: task.title,
        startTime: task.start_time,
        duration: task.duration,
        category: task.category,
        status: task.status,
        priority: task.priority,
      })) || [],
      upcomingEvents: events?.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        source: event.source,
      })) || [],
    };
  }

  async getCalendarWidget(userId: string, date: Date): Promise<CalendarWidget['data']> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const { data: events } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString())
      .order('start_time', { ascending: true });

    return {
      currentDate: date.toISOString(),
      events: events?.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        color: event.color || '#3B82F6',
      })) || [],
      holidays: [], // Would integrate with holiday API
    };
  }

  async getWeatherWidget(userId: string): Promise<WeatherWidget['data']> {
    // Get user's location preference
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    const location = profile?.preferences?.location || 'San Francisco, CA';

    // This would integrate with a weather API
    // For now, return mock data
    return {
      location,
      currentTemp: 72,
      condition: 'Partly Cloudy',
      conditionIcon: 'partly-cloudy',
      hourlyForecast: [
        { time: '12:00', temp: 72, icon: 'partly-cloudy' },
        { time: '13:00', temp: 74, icon: 'sunny' },
        { time: '14:00', temp: 76, icon: 'sunny' },
        { time: '15:00', temp: 75, icon: 'partly-cloudy' },
      ],
      dailyForecast: [
        { date: '2024-01-15', high: 78, low: 65, condition: 'Sunny', icon: 'sunny' },
        { date: '2024-01-16', high: 76, low: 63, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
        { date: '2024-01-17', high: 74, low: 61, condition: 'Cloudy', icon: 'cloudy' },
      ],
    };
  }

  async getActionsWidget(userId: string): Promise<ActionsWidget['data']> {
    // Get recent completed tasks
    const { data: recentTasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    // Get suggested actions (AI-generated)
    const suggestedActions = await this.generateSuggestedActions(userId);

    return {
      quickActions: [
        { id: '1', title: 'New Task', icon: 'plus', action: 'create_task' },
        { id: '2', title: 'New Note', icon: 'note', action: 'create_note' },
        { id: '3', title: 'Focus Mode', icon: 'focus', action: 'start_focus' },
        { id: '4', title: 'Quick Capture', icon: 'capture', action: 'quick_capture' },
      ],
      recentTasks: recentTasks?.map(task => ({
        id: task.id,
        title: task.title,
        completedAt: task.completed_at,
      })) || [],
      suggestedActions,
    };
  }

  async getInsightsWidget(userId: string, date: Date): Promise<InsightsWidget['data']> {
    // Get latest strategic briefing
    const { data: briefing } = await this.supabase
      .from('strategic_briefings')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest mind map
    const { data: mindMap } = await this.supabase
      .from('mind_maps')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Get actionable insights
    const { data: insights } = await this.supabase
      .from('actionable_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      strategicBriefing: briefing ? {
        title: briefing.title,
        summary: briefing.summary,
        keyInsights: briefing.key_insights || [],
        suggestedActions: briefing.suggested_actions || [],
      } : {
        title: 'No briefing available',
        summary: 'Generate a strategic briefing to see insights here.',
        keyInsights: [],
        suggestedActions: [],
      },
      mindMap: mindMap ? {
        nodes: mindMap.nodes || [],
        edges: mindMap.edges || [],
      } : {
        nodes: [],
        edges: [],
      },
      actionableInsights: insights?.map(insight => ({
        id: insight.id,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        category: insight.category,
      })) || [],
    };
  }

  async getHealthWidget(userId: string, date: Date): Promise<HealthWidget['data']> {
    const dateStr = date.toISOString().split('T')[0];

    // Get today's health data
    const { data: healthData } = await this.supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    // Get recent workouts
    const { data: workouts } = await this.supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', dateStr)
      .order('date', { ascending: false })
      .limit(5);

    // Calculate health rings based on goals
    const healthRings = await this.calculateHealthRings(userId, healthData);

    return {
      metrics: {
        steps: healthData?.steps || 0,
        sleep: healthData?.sleep || 0,
        water: healthData?.water || 0,
        heartRate: healthData?.heart_rate,
        caloriesBurned: healthData?.calories_burned,
      },
      healthRings,
      recentWorkouts: workouts?.map(workout => ({
        id: workout.id,
        type: workout.type,
        duration: workout.duration,
        calories: workout.calories,
        date: workout.date,
      })) || [],
      sleepData: {
        avgHours: healthData?.sleep || 0,
        quality: healthData?.mood === 'excellent' ? 'good' : healthData?.mood === 'good' ? 'good' : 'fair',
        bedtime: '11:00 PM', // Would calculate from sleep data
        wakeTime: '6:30 AM', // Would calculate from sleep data
      },
    };
  }

  async getFlowWidget(userId: string, date: Date): Promise<FlowWidget['data']> {
    // Get user's total points
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    const totalPoints = profile?.total_points || 0;

    // Get points for today
    const today = date.toISOString().split('T')[0];
    const { data: todayPoints } = await this.supabase
      .from('praxis_points')
      .select('points')
      .eq('user_id', userId)
      .gte('earned_at', today)
      .lte('earned_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const todayPointsTotal = todayPoints?.reduce((sum, p) => sum + p.points, 0) || 0;

    // Get points for this week
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const { data: weekPoints } = await this.supabase
      .from('praxis_points')
      .select('points')
      .eq('user_id', userId)
      .gte('earned_at', weekStart.toISOString())
      .lte('earned_at', date.toISOString());

    const weekPointsTotal = weekPoints?.reduce((sum, p) => sum + p.points, 0) || 0;

    // Get current streak
    const { data: streak } = await this.supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily_login')
      .eq('is_active', true)
      .single();

    // Get recent rewards
    const { data: rewards } = await this.supabase
      .from('praxis_points')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(5);

    // Get achievements
    const { data: achievements } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('unlocked', true)
      .order('unlocked_at', { ascending: false })
      .limit(5);

    const currentLevel = Math.floor(totalPoints / 1000);
    const progressToNextLevel = totalPoints % 1000;

    return {
      points: {
        total: totalPoints,
        today: todayPointsTotal,
        thisWeek: weekPointsTotal,
      },
      streaks: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
        type: 'daily',
      },
      level: {
        current: currentLevel,
        progress: progressToNextLevel,
        nextLevelPoints: 1000,
      },
      recentRewards: rewards?.map(reward => ({
        id: reward.id,
        name: reward.description,
        points: reward.points,
        earnedAt: reward.earned_at,
      })) || [],
      achievements: achievements?.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        unlockedAt: achievement.unlocked_at,
      })) || [],
    };
  }

  private async generateSuggestedActions(userId: string): Promise<ActionsWidget['data']['suggestedActions']> {
    try {
      // Get user's recent activity for context
      const { data: recentTasks } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentNotes } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      const context = {
        recentTasks: recentTasks || [],
        recentNotes: recentNotes || [],
      };

      const response = await this.aiService.generateResponse({
        prompt: `Based on this user activity, suggest 3-5 specific, actionable next steps: ${JSON.stringify(context)}`,
      });

      // Parse AI response into action items
      const suggestions = response.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5)
        .map((line, index) => ({
          id: `suggestion_${index}`,
          title: line.replace(/^\d+\.\s*/, '').trim(),
          description: '',
          priority: 'medium' as const,
        }));

      return suggestions;
    } catch (error) {
      console.error('Error generating suggested actions:', error);
      return [];
    }
  }

  private async calculateHealthRings(userId: string, healthData: any): Promise<HealthWidget['data']['healthRings']> {
    // Get user's health goals
    const { data: goals } = await this.supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const rings = [
      { name: 'Activity' as const, value: 0, fill: '#3B82F6' },
      { name: 'Energy' as const, value: 0, fill: '#10B981' },
      { name: 'Sleep' as const, value: 0, fill: '#8B5CF6' },
    ];

    if (healthData) {
      // Calculate activity ring (steps)
      const stepsGoal = goals?.find(g => g.metric === 'steps')?.target || 10000;
      rings[0].value = Math.min((healthData.steps || 0) / stepsGoal * 100, 100);

      // Calculate energy ring (based on mood/energy)
      const energyValue = healthData.energy === 'high' ? 100 : 
                         healthData.energy === 'medium' ? 66 : 
                         healthData.energy === 'low' ? 33 : 0;
      rings[1].value = energyValue;

      // Calculate sleep ring
      const sleepGoal = goals?.find(g => g.metric === 'sleep')?.target || 8;
      rings[2].value = Math.min((healthData.sleep || 0) / sleepGoal * 100, 100);
    }

    return rings;
  }
}

