// Health Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { HealthDataSchema } from '../types/ai';

// Health input schemas
const CreateHealthDataSchema = z.object({
  date: z.string(),
  steps: z.number().min(0).max(100000).optional(),
  sleep: z.number().min(0).max(24).optional(),
  water: z.number().min(0).max(20).optional(),
  heartRate: z.number().min(30).max(300).optional(),
  caloriesBurned: z.number().min(0).max(10000).optional(),
  workouts: z.array(z.object({
    type: z.string(),
    duration: z.number().min(1).max(1440), // minutes
    calories: z.number().min(0).max(5000),
  })).default([]),
  mood: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
});

const UpdateHealthDataSchema = z.object({
  healthDataId: z.string(),
  steps: z.number().min(0).max(100000).optional(),
  sleep: z.number().min(0).max(24).optional(),
  water: z.number().min(0).max(20).optional(),
  heartRate: z.number().min(30).max(300).optional(),
  caloriesBurned: z.number().min(0).max(10000).optional(),
  workouts: z.array(z.object({
    type: z.string(),
    duration: z.number().min(1).max(1440),
    calories: z.number().min(0).max(5000),
  })).optional(),
  mood: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
});

const GetHealthDataSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  metric: z.enum(['steps', 'sleep', 'water', 'heartRate', 'caloriesBurned', 'mood', 'energy', 'all']).default('all'),
});

const CreateWorkoutSchema = z.object({
  type: z.string().min(1).max(100),
  duration: z.number().min(1).max(1440),
  calories: z.number().min(0).max(5000),
  date: z.string(),
  notes: z.string().optional(),
});

export const healthRouter = router({
  // Create health data entry
  createHealthData: protectedProcedure
    .input(CreateHealthDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newHealthData } = await supabase
        .from('health_data')
        .insert({
          user_id: user.id,
          date: input.date,
          steps: input.steps,
          sleep: input.sleep,
          water: input.water,
          heart_rate: input.heartRate,
          calories_burned: input.caloriesBurned,
          workouts: input.workouts,
          mood: input.mood,
          energy: input.energy,
        })
        .select()
        .single();

      return newHealthData;
    }),

  // Update health data
  updateHealthData: protectedProcedure
    .input(UpdateHealthDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.steps !== undefined) updateData.steps = input.steps;
      if (input.sleep !== undefined) updateData.sleep = input.sleep;
      if (input.water !== undefined) updateData.water = input.water;
      if (input.heartRate !== undefined) updateData.heart_rate = input.heartRate;
      if (input.caloriesBurned !== undefined) updateData.calories_burned = input.caloriesBurned;
      if (input.workouts !== undefined) updateData.workouts = input.workouts;
      if (input.mood !== undefined) updateData.mood = input.mood;
      if (input.energy !== undefined) updateData.energy = input.energy;

      const { data: updatedHealthData } = await supabase
        .from('health_data')
        .update(updateData)
        .eq('id', input.healthDataId)
        .eq('user_id', user.id)
        .select()
        .single();

      return updatedHealthData;
    }),

  // Get health data
  getHealthData: protectedProcedure
    .input(GetHealthDataSchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', input.startDate)
        .lte('date', input.endDate)
        .order('date', { ascending: true });

      return healthData || [];
    }),

  // Get health data for specific date
  getHealthDataByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', input.date)
        .single();

      return healthData;
    }),

  // Create workout
  createWorkout: protectedProcedure
    .input(CreateWorkoutSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newWorkout } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          type: input.type,
          duration: input.duration,
          calories: input.calories,
          date: input.date,
          notes: input.notes,
        })
        .select()
        .single();

      // Award points for workout
      await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: Math.min(Math.floor(input.duration / 10), 50), // Max 50 points
          source: 'health',
          description: `Workout completed: ${input.type}`,
        });

      return newWorkout;
    }),

  // Get workouts
  getWorkouts: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', input.startDate)
        .lte('date', input.endDate)
        .order('date', { ascending: false });

      if (input.type) {
        query = query.eq('type', input.type);
      }

      const { data: workouts } = await query;

      return workouts || [];
    }),

  // Get health statistics
  getHealthStats: protectedProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      const stats = {
        totalDays: healthData?.length || 0,
        averageSteps: 0,
        averageSleep: 0,
        averageWater: 0,
        averageHeartRate: 0,
        totalWorkouts: workouts?.length || 0,
        totalWorkoutMinutes: workouts?.reduce((sum, w) => sum + w.duration, 0) || 0,
        totalCaloriesBurned: workouts?.reduce((sum, w) => sum + w.calories, 0) || 0,
        workoutTypes: {} as Record<string, number>,
        moodDistribution: {} as Record<string, number>,
        energyDistribution: {} as Record<string, number>,
      };

      if (stats.totalDays > 0) {
        stats.averageSteps = healthData?.reduce((sum, h) => sum + (h.steps || 0), 0) / stats.totalDays;
        stats.averageSleep = healthData?.reduce((sum, h) => sum + (h.sleep || 0), 0) / stats.totalDays;
        stats.averageWater = healthData?.reduce((sum, h) => sum + (h.water || 0), 0) / stats.totalDays;
        
        const heartRateData = healthData?.filter(h => h.heart_rate).map(h => h.heart_rate);
        if (heartRateData && heartRateData.length > 0) {
          stats.averageHeartRate = heartRateData.reduce((sum, hr) => sum + hr, 0) / heartRateData.length;
        }

        // Workout type distribution
        workouts?.forEach(workout => {
          stats.workoutTypes[workout.type] = (stats.workoutTypes[workout.type] || 0) + 1;
        });

        // Mood distribution
        healthData?.forEach(health => {
          if (health.mood) {
            stats.moodDistribution[health.mood] = (stats.moodDistribution[health.mood] || 0) + 1;
          }
        });

        // Energy distribution
        healthData?.forEach(health => {
          if (health.energy) {
            stats.energyDistribution[health.energy] = (stats.energyDistribution[health.energy] || 0) + 1;
          }
        });
      }

      return stats;
    }),

  // Get health trends
  getHealthTrends: protectedProcedure
    .input(z.object({
      metric: z.enum(['steps', 'sleep', 'water', 'heartRate', 'caloriesBurned']),
      period: z.enum(['week', 'month', 'quarter']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: healthData } = await supabase
        .from('health_data')
        .select('date, ' + input.metric)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const trends = healthData?.map(data => ({
        date: data.date,
        value: data[input.metric] || 0,
      })) || [];

      return {
        metric: input.period,
        period: input.period,
        trends,
      };
    }),

  // Get health goals
  getHealthGoals: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: goals } = await supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return goals || [];
    }),

  // Create health goal
  createHealthGoal: protectedProcedure
    .input(z.object({
      metric: z.enum(['steps', 'sleep', 'water', 'workouts', 'caloriesBurned']),
      target: z.number().min(0),
      period: z.enum(['daily', 'weekly', 'monthly']),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: newGoal } = await supabase
        .from('health_goals')
        .insert({
          user_id: user.id,
          metric: input.metric,
          target: input.target,
          period: input.period,
          description: input.description,
          is_active: true,
        })
        .select()
        .single();

      return newGoal;
    }),

  // Sync with health apps
  syncHealthApps: protectedProcedure
    .input(z.object({
      app: z.enum(['apple_health', 'google_fit', 'fitbit', 'strava']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // This would integrate with health app APIs
      // For now, return a mock response
      
      return {
        success: true,
        dataSynced: 0,
        lastSync: new Date().toISOString(),
        message: `${input.app} sync not yet implemented`,
      };
    }),

  // Get health insights
  getHealthInsights: protectedProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'quarter']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get health data for the period
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      // Generate basic insights
      const insights = [];
      
      if (healthData && healthData.length > 0) {
        const avgSleep = healthData.reduce((sum, h) => sum + (h.sleep || 0), 0) / healthData.length;
        const avgSteps = healthData.reduce((sum, h) => sum + (h.steps || 0), 0) / healthData.length;
        
        if (avgSleep < 7) {
          insights.push({
            type: 'sleep',
            message: 'Your average sleep is below recommended 7-9 hours. Consider improving your sleep routine.',
            priority: 'high',
          });
        }
        
        if (avgSteps < 8000) {
          insights.push({
            type: 'activity',
            message: 'Your daily step count is below the recommended 10,000 steps. Try to increase your daily activity.',
            priority: 'medium',
          });
        }
      }

      return {
        period: input.period,
        insights,
        generatedAt: new Date().toISOString(),
      };
    }),
});

