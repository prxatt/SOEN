import { 
  PraxisUserProfile, 
  SubscriptionTier, 
  PRAXIS_SUBSCRIPTION_LIMITS,
  PraxisAuthContext,
  RateLimitResult,
  ThemeName,
  THEME_UNLOCK_REQUIREMENTS
} from '../types/praxis-auth';

export class PraxisSubscriptionManager {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // ============================================
  // SUBSCRIPTION TIER MANAGEMENT
  // ============================================

  async getUserSubscription(userId: string): Promise<{
    tier: SubscriptionTier;
    limits: typeof PRAXIS_SUBSCRIPTION_LIMITS[SubscriptionTier];
    usage: any;
  }> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('subscription_tier, daily_ai_requests, monthly_ai_requests')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user subscription: ${error.message}`);
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];

    // Get current usage
    const usage = await this.getUserUsage(userId, tier);

    return {
      tier,
      limits,
      usage
    };
  }

  async upgradeSubscription(userId: string, newTier: SubscriptionTier): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ 
        subscription_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to upgrade subscription: ${error.message}`);
    }

    // Log the upgrade
    await this.logSubscriptionChange(userId, newTier, 'upgrade');
  }

  async downgradeSubscription(userId: string, newTier: SubscriptionTier): Promise<void> {
    // Check if user has content that exceeds new limits
    const currentUsage = await this.getUserUsage(userId, newTier);
    const newLimits = PRAXIS_SUBSCRIPTION_LIMITS[newTier];

    // Validate limits
    if (typeof newLimits.max_projects === 'number' && currentUsage.projects_count > newLimits.max_projects) {
      throw new Error(`Cannot downgrade: User has ${currentUsage.projects_count} projects, limit is ${newLimits.max_projects}`);
    }

    if (typeof newLimits.max_notes === 'number' && currentUsage.notes_count > newLimits.max_notes) {
      throw new Error(`Cannot downgrade: User has ${currentUsage.notes_count} notes, limit is ${newLimits.max_notes}`);
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({ 
        subscription_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to downgrade subscription: ${error.message}`);
    }

    // Log the downgrade
    await this.logSubscriptionChange(userId, newTier, 'downgrade');
  }

  // ============================================
  // USAGE TRACKING
  // ============================================

  async getUserUsage(userId: string, tier: SubscriptionTier): Promise<{
    ai_requests_today: number;
    ai_requests_this_month: number;
    projects_count: number;
    notes_count: number;
    mind_maps_this_month: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Get AI usage
    const { data: aiUsage } = await this.supabase
      .from('daily_ai_usage_summary')
      .select('total_requests')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const { data: monthlyAiUsage } = await this.supabase
      .from('ai_usage_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', monthStart);

    // Get project count
    const { data: projects } = await this.supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get notes count
    const { data: notes } = await this.supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Get mind maps this month
    const { data: mindMaps } = await this.supabase
      .from('mindmaps')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', monthStart);

    return {
      ai_requests_today: aiUsage?.total_requests || 0,
      ai_requests_this_month: monthlyAiUsage?.length || 0,
      projects_count: projects?.length || 0,
      notes_count: notes?.length || 0,
      mind_maps_this_month: mindMaps?.length || 0
    };
  }

  // ============================================
  // FEATURE GATING
  // ============================================

  canAccessWidget(userId: string, widget: string, tier: SubscriptionTier): boolean {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    
    if (limits.widgets_available === 'all') {
      return true;
    }

    return limits.widgets_available.includes(widget);
  }

  canUseFeature(userId: string, feature: string, tier: SubscriptionTier): boolean {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    
    if (limits.features === 'all') {
      return true;
    }

    return limits.features.includes(feature);
  }

  async canCreateProject(userId: string, tier: SubscriptionTier): Promise<boolean> {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    
    if (limits.max_projects === 'unlimited') {
      return true;
    }

    const usage = await this.getUserUsage(userId, tier);
    return usage.projects_count < limits.max_projects;
  }

  async canCreateNote(userId: string, tier: SubscriptionTier): Promise<boolean> {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    
    if (limits.max_notes === 'unlimited') {
      return true;
    }

    const usage = await this.getUserUsage(userId, tier);
    return usage.notes_count < limits.max_notes;
  }

  async canGenerateMindMap(userId: string, tier: SubscriptionTier): Promise<boolean> {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    
    if (limits.mind_maps_per_month === 'unlimited') {
      return true;
    }

    const usage = await this.getUserUsage(userId, tier);
    return usage.mind_maps_this_month < limits.mind_maps_per_month;
  }

  async canRequestAI(userId: string, tier: SubscriptionTier): Promise<boolean> {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    const usage = await this.getUserUsage(userId, tier);
    
    return usage.ai_requests_today < limits.ai_requests_per_day;
  }

  // ============================================
  // THEME UNLOCK SYSTEM
  // ============================================

  async canUseTheme(userId: string, theme: ThemeName, tier: SubscriptionTier): Promise<boolean> {
    const requirements = THEME_UNLOCK_REQUIREMENTS[theme];
    
    // Check tier requirement
    if (requirements.tier !== tier && tier !== 'team') {
      return false;
    }

    // Check flow points requirement
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('praxis_flow_points, purchased_rewards')
      .eq('id', userId)
      .single();

    if (!profile) {
      return false;
    }

    // Check if theme is already unlocked
    if (profile.purchased_rewards?.includes(`theme-${theme}`)) {
      return true;
    }

    // Check flow points
    return profile.praxis_flow_points >= requirements.flowPoints;
  }

  async unlockTheme(userId: string, theme: ThemeName): Promise<void> {
    const requirements = THEME_UNLOCK_REQUIREMENTS[theme];
    
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('praxis_flow_points, purchased_rewards')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    if (profile.praxis_flow_points < requirements.flowPoints) {
      throw new Error(`Insufficient flow points. Required: ${requirements.flowPoints}, Available: ${profile.praxis_flow_points}`);
    }

    // Deduct flow points and unlock theme
    const newRewards = [...(profile.purchased_rewards || []), `theme-${theme}`];
    const newFlowPoints = profile.praxis_flow_points - requirements.flowPoints;

    const { error } = await this.supabase
      .from('profiles')
      .update({
        praxis_flow_points: newFlowPoints,
        purchased_rewards: newRewards,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to unlock theme: ${error.message}`);
    }
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  async checkRateLimit(userId: string, tier: SubscriptionTier): Promise<RateLimitResult> {
    const limits = PRAXIS_SUBSCRIPTION_LIMITS[tier];
    const usage = await this.getUserUsage(userId, tier);
    
    const remaining = Math.max(0, limits.ai_requests_per_day - usage.ai_requests_today);
    const allowed = remaining > 0;
    
    // Calculate reset time (midnight UTC)
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setUTCHours(24, 0, 0, 0);

    return {
      allowed,
      remaining,
      resetTime,
      tier,
      limit: limits.ai_requests_per_day
    };
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  private async logSubscriptionChange(userId: string, tier: SubscriptionTier, action: string): Promise<void> {
    await this.supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        model_used: 'subscription_change',
        operation_type: 'subscription_management',
        feature_used: action,
        tokens_input: 0,
        tokens_output: 0,
        cost_cents: 0,
        latency_ms: 0
      });
  }

  // ============================================
  // CONTEXT CREATION
  // ============================================

  async createAuthContext(userId: string): Promise<PraxisAuthContext> {
    const subscription = await this.getUserSubscription(userId);
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const permissions = {
      canAccessWidget: (widget: string) => this.canAccessWidget(userId, widget, subscription.tier),
      canUseFeature: (feature: string) => this.canUseFeature(userId, feature, subscription.tier),
      canCreateProject: () => this.canCreateProject(userId, subscription.tier),
      canCreateNote: () => this.canCreateNote(userId, subscription.tier),
      canGenerateMindMap: () => this.canGenerateMindMap(userId, subscription.tier),
      canRequestAI: () => this.canRequestAI(userId, subscription.tier),
      canUseTheme: (theme: string) => this.canUseTheme(userId, theme as ThemeName, subscription.tier)
    };

    const security = {
      isEncryptionEnabled: subscription.tier !== 'free',
      canAccessSensitiveData: subscription.tier === 'pro' || subscription.tier === 'team',
      auditLevel: subscription.tier === 'team' ? 'comprehensive' : 
                 subscription.tier === 'pro' ? 'detailed' : 'basic'
    };

    return {
      user: profile as PraxisUserProfile,
      subscription,
      permissions,
      security
    };
  }
}
