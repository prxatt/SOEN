import { z } from 'zod';

// ============================================
// PRAXIS USER PROFILE TYPES
// ============================================

export interface PraxisUserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'team';
  
  // Praxis-specific fields
  onboarding_completed: boolean;
  goals: {
    short_term: string[];
    mid_term: string[];
    long_term: string[];
  };
  preferences: {
    briefing_time: string; // "07:00"
    focus_areas: string[];
    learning_topics: string[];
    health_tracking: boolean;
  };
  gamification: {
    current_streak: number;
    total_flow_points: number;
    selected_theme: string;
    unlocked_themes: string[];
  };
  integrations: {
    google_calendar: boolean;
    health_apps: boolean;
    notion: boolean;
  };
}

// ============================================
// SUBSCRIPTION TIERS FOR PRAXIS
// ============================================

export const PRAXIS_SUBSCRIPTION_LIMITS = {
  free: {
    ai_requests_per_day: 10,
    max_projects: 3,
    max_notes: 50,
    widgets_available: ['schedule', 'calendar', 'weather', 'actions'],
    features: ['basic_chat', 'simple_insights'],
    themes_available: ['default', 'obsidian'],
    mind_maps_per_month: 0,
    strategic_briefings: false,
    custom_themes: false,
    priority_support: false
  },
  pro: {
    ai_requests_per_day: 100,
    max_projects: 25,
    max_notes: 1000,
    widgets_available: 'all',
    features: ['advanced_chat', 'mind_mapping', 'strategic_briefings', 'custom_themes'],
    themes_available: 'all',
    mind_maps_per_month: 50,
    strategic_briefings: true,
    custom_themes: true,
    priority_support: true
  },
  team: {
    ai_requests_per_day: 500,
    max_projects: 'unlimited',
    max_notes: 'unlimited',
    widgets_available: 'all',
    features: 'all',
    themes_available: 'all',
    mind_maps_per_month: 'unlimited',
    strategic_briefings: true,
    custom_themes: true,
    priority_support: true
  }
} as const;

export type SubscriptionTier = keyof typeof PRAXIS_SUBSCRIPTION_LIMITS;

// ============================================
// FEATURE GATING TYPES
// ============================================

export interface FeatureGate {
  feature: string;
  tier: SubscriptionTier;
  limit?: number;
  period?: 'daily' | 'monthly' | 'total';
}

export interface WidgetAccess {
  widget: string;
  tier: SubscriptionTier;
  customizations?: string[];
}

export interface AIRequestLimit {
  tier: SubscriptionTier;
  daily_limit: number;
  monthly_limit: number;
  cost_per_request: number;
}

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

export const PraxisUserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  avatar_url: z.string().url().optional(),
  subscription_tier: z.enum(['free', 'pro', 'team']),
  onboarding_completed: z.boolean(),
  goals: z.object({
    short_term: z.array(z.string()),
    mid_term: z.array(z.string()),
    long_term: z.array(z.string())
  }),
  preferences: z.object({
    briefing_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    focus_areas: z.array(z.string()),
    learning_topics: z.array(z.string()),
    health_tracking: z.boolean()
  }),
  gamification: z.object({
    current_streak: z.number().min(0),
    total_flow_points: z.number().min(0),
    selected_theme: z.string(),
    unlocked_themes: z.array(z.string())
  }),
  integrations: z.object({
    google_calendar: z.boolean(),
    health_apps: z.boolean(),
    notion: z.boolean()
  })
});

export const SubscriptionTierSchema = z.enum(['free', 'pro', 'team']);

export const FeatureGateSchema = z.object({
  feature: z.string(),
  tier: z.enum(['free', 'pro', 'team']),
  limit: z.number().optional(),
  period: z.enum(['daily', 'monthly', 'total']).optional()
});

// ============================================
// AUTHENTICATION CONTEXT TYPES
// ============================================

export interface PraxisAuthContext {
  user: PraxisUserProfile;
  subscription: {
    tier: SubscriptionTier;
    limits: typeof PRAXIS_SUBSCRIPTION_LIMITS[SubscriptionTier];
    usage: {
      ai_requests_today: number;
      ai_requests_this_month: number;
      projects_count: number;
      notes_count: number;
      mind_maps_this_month: number;
    };
  };
  permissions: {
    canAccessWidget: (widget: string) => boolean;
    canUseFeature: (feature: string) => boolean;
    canCreateProject: () => boolean;
    canCreateNote: () => boolean;
    canGenerateMindMap: () => boolean;
    canRequestAI: () => boolean;
    canUseTheme: (theme: string) => boolean;
  };
  security: {
    isEncryptionEnabled: boolean;
    canAccessSensitiveData: boolean;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

// ============================================
// SECURITY TYPES
// ============================================

export interface AIRequestSecurity {
  userId: string;
  requestId: string;
  timestamp: Date;
  feature: string;
  prompt: string;
  sanitizedPrompt: string;
  tokens: number;
  cost: number;
  model: string;
  ipAddress: string;
  userAgent: string;
  auditTrail: string[];
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM';
  keyRotationDays: number;
  sensitiveFields: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// RATE LIMITING TYPES
// ============================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  tierMultiplier: Record<SubscriptionTier, number>;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  tier: SubscriptionTier;
  limit: number;
}

// ============================================
// WIDGET ACCESS CONTROL
// ============================================

export const WIDGET_ACCESS_MATRIX = {
  schedule: { tier: 'free' as SubscriptionTier, customizations: ['basic'] },
  calendar: { tier: 'free' as SubscriptionTier, customizations: ['basic'] },
  weather: { tier: 'free' as SubscriptionTier, customizations: ['basic'] },
  actions: { tier: 'free' as SubscriptionTier, customizations: ['basic'] },
  insights: { tier: 'pro' as SubscriptionTier, customizations: ['advanced', 'ai_powered'] },
  health: { tier: 'pro' as SubscriptionTier, customizations: ['detailed', 'trends'] },
  flow: { tier: 'pro' as SubscriptionTier, customizations: ['gamification', 'streaks'] },
  kiko: { tier: 'free' as SubscriptionTier, customizations: ['basic', 'advanced', 'voice'] },
  mindmap: { tier: 'pro' as SubscriptionTier, customizations: ['ai_generated', 'interactive'] },
  briefing: { tier: 'pro' as SubscriptionTier, customizations: ['strategic', 'personalized'] }
} as const;

// ============================================
// THEME UNLOCK SYSTEM
// ============================================

export const THEME_UNLOCK_REQUIREMENTS = {
  'default': { tier: 'free' as SubscriptionTier, flowPoints: 0 },
  'obsidian': { tier: 'free' as SubscriptionTier, flowPoints: 0 },
  'synthwave': { tier: 'free' as SubscriptionTier, flowPoints: 100 },
  'minimal': { tier: 'pro' as SubscriptionTier, flowPoints: 0 },
  'dark-matrix': { tier: 'pro' as SubscriptionTier, flowPoints: 500 },
  'neon-cyber': { tier: 'pro' as SubscriptionTier, flowPoints: 1000 },
  'custom': { tier: 'pro' as SubscriptionTier, flowPoints: 0, requiresPro: true }
} as const;

export type ThemeName = keyof typeof THEME_UNLOCK_REQUIREMENTS;

// ============================================
// EXPORT TYPES
// ============================================

// Re-export types for convenience
export type {
  PraxisUserProfile as UserProfile,
  SubscriptionTier as Tier,
  FeatureGate as Gate,
  WidgetAccess as Widget,
  AIRequestLimit as AILimit,
  PraxisAuthContext as AuthContext,
  AIRequestSecurity as AISecurity,
  EncryptionConfig as Encryption,
  AuditLog as Audit,
  RateLimitConfig as RateConfig,
  RateLimitResult as RateResult,
  ThemeName as Theme
};
