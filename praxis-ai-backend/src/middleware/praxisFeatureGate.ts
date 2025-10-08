import { TRPCError } from '@trpc/server';
import { 
  PraxisAuthContext, 
  SubscriptionTier, 
  PRAXIS_SUBSCRIPTION_LIMITS,
  WIDGET_ACCESS_MATRIX 
} from '../types/praxis-auth';

export class PraxisFeatureGate {
  private subscriptionManager: any;

  constructor(subscriptionManager: any) {
    this.subscriptionManager = subscriptionManager;
  }

  // ============================================
  // WIDGET ACCESS CONTROL
  // ============================================

  async checkWidgetAccess(userId: string, widget: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canAccess = this.subscriptionManager.canAccessWidget(userId, widget, subscription.tier);

    if (!canAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Widget '${widget}' requires ${this.getRequiredTier(widget)} subscription`,
        cause: {
          widget,
          requiredTier: this.getRequiredTier(widget),
          currentTier: subscription.tier,
          upgradeUrl: this.getUpgradeUrl(subscription.tier)
        }
      });
    }
  }

  private getRequiredTier(widget: string): SubscriptionTier {
    const access = WIDGET_ACCESS_MATRIX[widget as keyof typeof WIDGET_ACCESS_MATRIX];
    return access?.tier || 'pro';
  }

  private getUpgradeUrl(currentTier: SubscriptionTier): string {
    const upgradeMap = {
      free: '/upgrade?tier=pro',
      pro: '/upgrade?tier=team',
      team: '/billing'
    };
    return upgradeMap[currentTier];
  }

  // ============================================
  // AI REQUEST RATE LIMITING
  // ============================================

  async checkAIRateLimit(userId: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const rateLimit = await this.subscriptionManager.checkRateLimit(userId, subscription.tier);

    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Daily AI request limit reached. ${rateLimit.remaining} requests remaining.`,
        cause: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
          tier: rateLimit.tier,
          upgradeUrl: this.getUpgradeUrl(rateLimit.tier)
        }
      });
    }
  }

  // ============================================
  // PROJECT LIMITS
  // ============================================

  async checkProjectLimit(userId: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canCreate = await this.subscriptionManager.canCreateProject(userId, subscription.tier);

    if (!canCreate) {
      const limits = subscription.limits;
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Project limit reached. ${limits.max_projects} projects allowed on ${subscription.tier} plan.`,
        cause: {
          limit: limits.max_projects,
          tier: subscription.tier,
          upgradeUrl: this.getUpgradeUrl(subscription.tier)
        }
      });
    }
  }

  // ============================================
  // NOTE LIMITS
  // ============================================

  async checkNoteLimit(userId: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canCreate = await this.subscriptionManager.canCreateNote(userId, subscription.tier);

    if (!canCreate) {
      const limits = subscription.limits;
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Note limit reached. ${limits.max_notes} notes allowed on ${subscription.tier} plan.`,
        cause: {
          limit: limits.max_notes,
          tier: subscription.tier,
          upgradeUrl: this.getUpgradeUrl(subscription.tier)
        }
      });
    }
  }

  // ============================================
  // MIND MAP LIMITS
  // ============================================

  async checkMindMapLimit(userId: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canCreate = await this.subscriptionManager.canGenerateMindMap(userId, subscription.tier);

    if (!canCreate) {
      const limits = subscription.limits;
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Mind map limit reached. ${limits.mind_maps_per_month} mind maps per month allowed on ${subscription.tier} plan.`,
        cause: {
          limit: limits.mind_maps_per_month,
          tier: subscription.tier,
          upgradeUrl: this.getUpgradeUrl(subscription.tier)
        }
      });
    }
  }

  // ============================================
  // FEATURE ACCESS CONTROL
  // ============================================

  async checkFeatureAccess(userId: string, feature: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canUse = this.subscriptionManager.canUseFeature(userId, feature, subscription.tier);

    if (!canUse) {
      const requiredTier = this.getRequiredTierForFeature(feature);
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Feature '${feature}' requires ${requiredTier} subscription`,
        cause: {
          feature,
          requiredTier,
          currentTier: subscription.tier,
          upgradeUrl: this.getUpgradeUrl(subscription.tier)
        }
      });
    }
  }

  private getRequiredTierForFeature(feature: string): SubscriptionTier {
    const featureTierMap: Record<string, SubscriptionTier> = {
      'basic_chat': 'free',
      'simple_insights': 'free',
      'advanced_chat': 'pro',
      'mind_mapping': 'pro',
      'strategic_briefings': 'pro',
      'custom_themes': 'pro',
      'voice_chat': 'pro',
      'ai_vision': 'pro',
      'priority_support': 'pro'
    };
    return featureTierMap[feature] || 'pro';
  }

  // ============================================
  // THEME ACCESS CONTROL
  // ============================================

  async checkThemeAccess(userId: string, theme: string): Promise<void> {
    const subscription = await this.subscriptionManager.getUserSubscription(userId);
    const canUse = await this.subscriptionManager.canUseTheme(userId, theme as any, subscription.tier);

    if (!canUse) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Theme '${theme}' is not available or unlocked`,
        cause: {
          theme,
          tier: subscription.tier,
          unlockUrl: `/themes/${theme}/unlock`
        }
      });
    }
  }

  // ============================================
  // COMPREHENSIVE ACCESS CHECK
  // ============================================

  async checkAccess(userId: string, resource: {
    type: 'widget' | 'feature' | 'ai_request' | 'project' | 'note' | 'mindmap' | 'theme';
    name: string;
  }): Promise<void> {
    switch (resource.type) {
      case 'widget':
        await this.checkWidgetAccess(userId, resource.name);
        break;
      case 'feature':
        await this.checkFeatureAccess(userId, resource.name);
        break;
      case 'ai_request':
        await this.checkAIRateLimit(userId);
        break;
      case 'project':
        await this.checkProjectLimit(userId);
        break;
      case 'note':
        await this.checkNoteLimit(userId);
        break;
      case 'mindmap':
        await this.checkMindMapLimit(userId);
        break;
      case 'theme':
        await this.checkThemeAccess(userId, resource.name);
        break;
      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown resource type: ${resource.type}`
        });
    }
  }

  // ============================================
  // USAGE TRACKING HELPERS
  // ============================================

  async trackAIUsage(userId: string, tokens: number, cost: number, model: string): Promise<void> {
    // This would typically update the daily usage summary
    // Implementation depends on your specific tracking needs
    console.log(`Tracking AI usage for user ${userId}: ${tokens} tokens, $${cost}, model: ${model}`);
  }

  async trackProjectCreation(userId: string): Promise<void> {
    // Track project creation for limit enforcement
    console.log(`Tracking project creation for user ${userId}`);
  }

  async trackNoteCreation(userId: string): Promise<void> {
    // Track note creation for limit enforcement
    console.log(`Tracking note creation for user ${userId}`);
  }

  async trackMindMapGeneration(userId: string): Promise<void> {
    // Track mind map generation for monthly limits
    console.log(`Tracking mind map generation for user ${userId}`);
  }
}
