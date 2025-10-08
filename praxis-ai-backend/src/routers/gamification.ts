// Gamification Router for Praxis-AI
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { PraxisPointsSchema, AchievementSchema } from '../types/ai';

// Gamification input schemas
const AwardPointsSchema = z.object({
  points: z.number().min(1).max(1000),
  source: z.enum(['task_completion', 'note_creation', 'insight_generation', 'streak_maintenance', 'achievement', 'project_completion', 'daily_login']),
  description: z.string().min(1).max(200),
  metadata: z.any().optional(),
});

const CreateAchievementSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  points: z.number().min(1).max(1000),
  category: z.enum(['productivity', 'health', 'learning', 'streak', 'milestone', 'social']),
  requirements: z.object({
    type: z.string(),
    value: z.number(),
    description: z.string(),
  }),
});

const GetLeaderboardSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'all_time']).default('week'),
  limit: z.number().min(1).max(100).default(20),
});

const RedeemRewardSchema = z.object({
  rewardId: z.string(),
});

export const gamificationRouter = router({
  // Award points to user
  awardPoints: protectedProcedure
    .input(AwardPointsSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: pointsRecord } = await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: input.points,
          source: input.source,
          description: input.description,
          metadata: input.metadata,
        })
        .select()
        .single();

      // Update user's total points
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      const newTotalPoints = (userProfile?.total_points || 0) + input.points;
      
      await supabase
        .from('profiles')
        .update({ total_points: newTotalPoints })
        .eq('id', user.id);

      // Check for level up
      const newLevel = Math.floor(newTotalPoints / 1000);
      const currentLevel = Math.floor((userProfile?.total_points || 0) / 1000);
      
      if (newLevel > currentLevel) {
        // Award level up achievement
        await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            title: `Level ${newLevel} Reached!`,
            description: `You've reached level ${newLevel}!`,
            points: 50,
            category: 'milestone',
          });
      }

      return {
        pointsRecord,
        newTotalPoints,
        levelUp: newLevel > currentLevel,
        newLevel,
      };
    }),

  // Get user's points and stats
  getUserStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      // Get points breakdown by source
      const { data: pointsBreakdown } = await supabase
        .from('praxis_points')
        .select('source, points')
        .eq('user_id', user.id);

      const breakdown: Record<string, number> = {};
      pointsBreakdown?.forEach(point => {
        breakdown[point.source] = (breakdown[point.source] || 0) + point.points;
      });

      // Get current level
      const currentLevel = Math.floor((profile?.total_points || 0) / 1000);
      const nextLevelPoints = (currentLevel + 1) * 1000;
      const progressToNextLevel = (profile?.total_points || 0) % 1000;

      // Get streaks
      const { data: streaks } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const currentStreak = streaks?.[0]?.current_streak || 0;
      const longestStreak = streaks?.[0]?.longest_streak || 0;

      return {
        totalPoints: profile?.total_points || 0,
        currentLevel,
        nextLevelPoints,
        progressToNextLevel,
        pointsBreakdown: breakdown,
        currentStreak,
        longestStreak,
      };
    }),

  // Get achievements
  getAchievements: protectedProcedure
    .input(z.object({
      category: z.enum(['productivity', 'health', 'learning', 'streak', 'milestone', 'social', 'all']).default('all'),
      unlocked: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (input.category !== 'all') {
        query = query.eq('category', input.category);
      }

      if (input.unlocked !== undefined) {
        query = query.eq('unlocked', input.unlocked);
      }

      const { data: achievements } = await query
        .order('unlocked_at', { ascending: false });

      return achievements || [];
    }),

  // Unlock achievement
  unlockAchievement: protectedProcedure
    .input(z.object({
      achievementId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: achievement } = await supabase
        .from('achievements')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', input.achievementId)
        .eq('user_id', user.id)
        .select()
        .single();

      // Award points for achievement
      if (achievement) {
        await supabase
          .from('praxis_points')
          .insert({
            user_id: user.id,
            points: achievement.points,
            source: 'achievement',
            description: `Achievement unlocked: ${achievement.title}`,
          });
      }

      return achievement;
    }),

  // Get leaderboard
  getLeaderboard: protectedProcedure
    .input(GetLeaderboardSchema)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      
      let startDate: Date | undefined;
      const now = new Date();
      
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

      let query = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, total_points')
        .order('total_points', { ascending: false });

      if (startDate) {
        // For time-based leaderboards, we'd need to calculate points earned in that period
        // This is a simplified version - in production, you'd join with praxis_points table
        query = query.gte('updated_at', startDate.toISOString());
      }

      const { data: leaderboard } = await query.limit(input.limit);

      return leaderboard || [];
    }),

  // Get rewards catalog
  getRewardsCatalog: protectedProcedure
    .query(async ({ ctx }) => {
      const { supabase } = ctx;
      
      const { data: rewards } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true });

      return rewards || [];
    }),

  // Redeem reward
  redeemReward: protectedProcedure
    .input(RedeemRewardSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get reward details
      const { data: reward } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', input.rewardId)
        .eq('is_active', true)
        .single();

      if (!reward) {
        throw new Error('Reward not found');
      }

      // Check if user has enough points
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if ((profile?.total_points || 0) < reward.cost) {
        throw new Error('Insufficient points');
      }

      // Deduct points
      await supabase
        .from('profiles')
        .update({ 
          total_points: (profile?.total_points || 0) - reward.cost 
        })
        .eq('id', user.id);

      // Create redemption record
      const { data: redemption } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: input.rewardId,
          cost: reward.cost,
          status: 'pending',
        })
        .select()
        .single();

      return {
        redemption,
        remainingPoints: (profile?.total_points || 0) - reward.cost,
      };
    }),

  // Get user's redemption history
  getRedemptionHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards_catalog (
            title,
            description,
            type,
            value
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return redemptions || [];
    }),

  // Update streak
  updateStreak: protectedProcedure
    .input(z.object({
      streakType: z.enum(['daily_login', 'task_completion', 'note_creation']).default('daily_login'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if streak already updated today
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', input.streakType)
        .eq('last_updated', today)
        .single();

      if (existingStreak) {
        return existingStreak;
      }

      // Get current streak
      const { data: currentStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', input.streakType)
        .eq('is_active', true)
        .single();

      let newStreakCount = 1;
      let longestStreak = 1;

      if (currentStreak) {
        const lastUpdated = new Date(currentStreak.last_updated);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          newStreakCount = currentStreak.current_streak + 1;
          longestStreak = Math.max(currentStreak.longest_streak, newStreakCount);
        } else if (daysDiff > 1) {
          // Streak broken
          newStreakCount = 1;
          longestStreak = currentStreak.longest_streak;
        }
      }

      // Update or create streak
      const { data: updatedStreak } = await supabase
        .from('user_streaks')
        .upsert({
          user_id: user.id,
          streak_type: input.streakType,
          current_streak: newStreakCount,
          longest_streak: longestStreak,
          last_updated: today,
          is_active: true,
        })
        .select()
        .single();

      // Award streak points
      const streakPoints = Math.min(newStreakCount * 5, 100); // Max 100 points per streak
      
      await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: streakPoints,
          source: 'streak_maintenance',
          description: `${input.streakType} streak: ${newStreakCount} days`,
        });

      return {
        ...updatedStreak,
        pointsAwarded: streakPoints,
      };
    }),

  // Get daily challenges
  getDailyChallenges: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: challenges } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('date', today)
        .eq('is_active', true);

      return challenges || [];
    }),

  // Complete daily challenge
  completeDailyChallenge: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get challenge details
      const { data: challenge } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', input.challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Check if already completed
      const { data: existingCompletion } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', input.challengeId)
        .single();

      if (existingCompletion) {
        throw new Error('Challenge already completed');
      }

      // Record completion
      const { data: completion } = await supabase
        .from('challenge_completions')
        .insert({
          user_id: user.id,
          challenge_id: input.challengeId,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Award points
      await supabase
        .from('praxis_points')
        .insert({
          user_id: user.id,
          points: challenge.points,
          source: 'achievement',
          description: `Daily challenge completed: ${challenge.title}`,
        });

      return completion;
    }),
});

