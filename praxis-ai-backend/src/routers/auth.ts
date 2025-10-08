import { praxisProcedure, protectedProcedure, router } from '../context';
import { z } from 'zod';
import { PraxisUserProfileSchema, SubscriptionTierSchema } from '../types/praxis-auth';
import { TRPCError } from '@trpc/server';

// ============================================
// AUTHENTICATION & SUBSCRIPTION ROUTER
// ============================================

export const authRouter = router({
  // ============================================
  // USER PROFILE MANAGEMENT
  // ============================================

  getProfile: praxisProcedure
    .output(PraxisUserProfileSchema)
    .query(async ({ ctx }) => {
      const { data: profile, error } = await ctx.supabase
        .from('profiles')
        .select('*')
        .eq('id', ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      return profile as PraxisUserProfile;
    }),

  updateProfile: praxisProcedure
    .input(z.object({
      full_name: z.string().min(1).optional(),
      avatar_url: z.string().url().optional(),
      preferences: z.object({
        briefing_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        focus_areas: z.array(z.string()).optional(),
        learning_topics: z.array(z.string()).optional(),
        health_tracking: z.boolean().optional(),
      }).optional(),
      goals: z.object({
        short_term: z.array(z.string()).optional(),
        mid_term: z.array(z.string()).optional(),
        long_term: z.array(z.string()).optional(),
      }).optional(),
    }))
    .output(PraxisUserProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: profile, error } = await ctx.supabase
        .from('profiles')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return profile as PraxisUserProfile;
    }),

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  getSubscription: praxisProcedure
    .output(z.object({
      tier: SubscriptionTierSchema,
      limits: z.any(),
      usage: z.object({
        ai_requests_today: z.number(),
        ai_requests_this_month: z.number(),
        projects_count: z.number(),
        notes_count: z.number(),
        mind_maps_this_month: z.number(),
      }),
    }))
    .query(async ({ ctx }) => {
      return await ctx.subscriptionManager.getUserSubscription(ctx.user.id);
    }),

  upgradeSubscription: praxisProcedure
    .input(z.object({
      newTier: SubscriptionTierSchema,
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.subscriptionManager.upgradeSubscription(ctx.user.id, input.newTier);
        return {
          success: true,
          message: `Successfully upgraded to ${input.newTier} subscription`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to upgrade subscription: ${error.message}`,
        });
      }
    }),

  downgradeSubscription: praxisProcedure
    .input(z.object({
      newTier: SubscriptionTierSchema,
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.subscriptionManager.downgradeSubscription(ctx.user.id, input.newTier);
        return {
          success: true,
          message: `Successfully downgraded to ${input.newTier} subscription`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to downgrade subscription: ${error.message}`,
        });
      }
    }),

  // ============================================
  // FEATURE ACCESS CONTROL
  // ============================================

  checkFeatureAccess: praxisProcedure
    .input(z.object({
      feature: z.string(),
    }))
    .output(z.object({
      hasAccess: z.boolean(),
      requiredTier: z.string(),
      currentTier: z.string(),
      upgradeUrl: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.subscriptionManager.getUserSubscription(ctx.user.id);
      const hasAccess = ctx.subscriptionManager.canUseFeature(ctx.user.id, input.feature, subscription.tier);
      
      const requiredTier = subscription.tier === 'free' ? 'pro' : 'team';
      const upgradeUrl = subscription.tier === 'free' ? '/upgrade?tier=pro' : '/upgrade?tier=team';

      return {
        hasAccess,
        requiredTier,
        currentTier: subscription.tier,
        upgradeUrl: hasAccess ? undefined : upgradeUrl,
      };
    }),

  checkWidgetAccess: praxisProcedure
    .input(z.object({
      widget: z.string(),
    }))
    .output(z.object({
      hasAccess: z.boolean(),
      requiredTier: z.string(),
      currentTier: z.string(),
      customizations: z.array(z.string()).optional(),
      upgradeUrl: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.subscriptionManager.getUserSubscription(ctx.user.id);
      const hasAccess = ctx.subscriptionManager.canAccessWidget(ctx.user.id, input.widget, subscription.tier);
      
      const requiredTier = subscription.tier === 'free' ? 'pro' : 'team';
      const upgradeUrl = subscription.tier === 'free' ? '/upgrade?tier=pro' : '/upgrade?tier=team';

      return {
        hasAccess,
        requiredTier,
        currentTier: subscription.tier,
        customizations: hasAccess ? ['basic', 'advanced'] : undefined,
        upgradeUrl: hasAccess ? undefined : upgradeUrl,
      };
    }),

  // ============================================
  // RATE LIMITING
  // ============================================

  getRateLimit: praxisProcedure
    .output(z.object({
      allowed: z.boolean(),
      remaining: z.number(),
      resetTime: z.date(),
      tier: SubscriptionTierSchema,
      limit: z.number(),
    }))
    .query(async ({ ctx }) => {
      const subscription = await ctx.subscriptionManager.getUserSubscription(ctx.user.id);
      return await ctx.subscriptionManager.checkRateLimit(ctx.user.id, subscription.tier);
    }),

  // ============================================
  // THEME UNLOCK SYSTEM
  // ============================================

  getAvailableThemes: praxisProcedure
    .output(z.object({
      unlocked: z.array(z.string()),
      available: z.array(z.object({
        name: z.string(),
        requiredTier: z.string(),
        requiredPoints: z.number(),
        unlocked: z.boolean(),
      })),
    }))
    .query(async ({ ctx }) => {
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('praxis_flow_points, purchased_rewards, subscription_tier')
        .eq('id', ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      const unlocked = profile.purchased_rewards || [];
      const available = Object.entries({
        'default': { tier: 'free', points: 0 },
        'obsidian': { tier: 'free', points: 0 },
        'synthwave': { tier: 'free', points: 100 },
        'minimal': { tier: 'pro', points: 0 },
        'dark-matrix': { tier: 'pro', points: 500 },
        'neon-cyber': { tier: 'pro', points: 1000 },
      }).map(([name, requirements]) => ({
        name,
        requiredTier: requirements.tier,
        requiredPoints: requirements.points,
        unlocked: unlocked.includes(`theme-${name}`) || 
                 (requirements.tier === 'free' && profile.subscription_tier !== 'free') ||
                 (requirements.tier === 'pro' && (profile.subscription_tier === 'pro' || profile.subscription_tier === 'team')),
      }));

      return {
        unlocked: unlocked.filter((reward: string) => reward.startsWith('theme-')).map((reward: string) => reward.replace('theme-', '')),
        available,
      };
    }),

  unlockTheme: praxisProcedure
    .input(z.object({
      theme: z.string(),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.subscriptionManager.unlockTheme(ctx.user.id, input.theme as any);
        return {
          success: true,
          message: `Successfully unlocked theme: ${input.theme}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to unlock theme: ${error.message}`,
        });
      }
    }),

  // ============================================
  // GAMIFICATION
  // ============================================

  getGamificationStatus: praxisProcedure
    .output(z.object({
      currentStreak: z.number(),
      totalFlowPoints: z.number(),
      longestStreak: z.number(),
      lastActivityDate: z.string(),
      purchasedRewards: z.array(z.string()),
    }))
    .query(async ({ ctx }) => {
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('current_streak, praxis_flow_points, longest_streak, last_activity_date, purchased_rewards')
        .eq('id', ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      return {
        currentStreak: profile.current_streak,
        totalFlowPoints: profile.praxis_flow_points,
        longestStreak: profile.longest_streak,
        lastActivityDate: profile.last_activity_date,
        purchasedRewards: profile.purchased_rewards || [],
      };
    }),

  // ============================================
  // INTEGRATIONS
  // ============================================

  getIntegrations: praxisProcedure
    .output(z.object({
      google_calendar: z.boolean(),
      health_apps: z.boolean(),
      notion: z.boolean(),
    }))
    .query(async ({ ctx }) => {
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('integrations')
        .eq('id', ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      return profile.integrations || {
        google_calendar: false,
        health_apps: false,
        notion: false,
      };
    }),

  updateIntegrations: praxisProcedure
    .input(z.object({
      google_calendar: z.boolean().optional(),
      health_apps: z.boolean().optional(),
      notion: z.boolean().optional(),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('integrations')
        .eq('id', ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      const currentIntegrations = profile.integrations || {};
      const updatedIntegrations = { ...currentIntegrations, ...input };

      const { error } = await ctx.supabase
        .from('profiles')
        .update({
          integrations: updatedIntegrations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update integrations',
        });
      }

      return {
        success: true,
        message: 'Integrations updated successfully',
      };
    }),
});
