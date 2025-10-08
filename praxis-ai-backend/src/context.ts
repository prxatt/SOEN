import { initTRPC, TRPCError } from '@trpc/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';
import { EnhancedAIServiceManager } from './services/enhancedAIServiceManager';
import { PraxisWidgetAggregationService } from './services/widgetAggregationService';
import { getAIOrchestrator } from './services/ai-orchestrator';
import { PraxisSubscriptionManager } from './services/praxisSubscriptionManager';
import { PraxisFeatureGate } from './middleware/praxisFeatureGate';
import { PraxisAISecurityService } from './services/praxisAISecurityService';
import { PraxisAuthContext } from './types/praxis-auth';
import { createEncryptionService } from './services/encryptionService';

// Create Supabase client
export const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
};

// Create Supabase client with service role key (for admin operations)
export const createSupabaseAdminClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// tRPC context type
export interface Context {
  supabase: ReturnType<typeof createSupabaseClient>;
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  aiService: EnhancedAIServiceManager;
  aiOrchestrator: ReturnType<typeof getAIOrchestrator>;
  widgetService: PraxisWidgetAggregationService;
  subscriptionManager: PraxisSubscriptionManager;
  featureGate: PraxisFeatureGate;
  aiSecurityService: PraxisAISecurityService;
  encryptionService: ReturnType<typeof createEncryptionService>;
  praxisAuth: PraxisAuthContext | null;
  user: {
    id: string;
    email: string;
  } | null;
}

// Create tRPC context
export const createTRPCContext = async (req: Request): Promise<Context> => {
  const supabase = createSupabaseClient();
  const supabaseAdmin = createSupabaseAdminClient();
  
  // Initialize AI service
  const aiService = new EnhancedAIServiceManager({
    grok: { 
      apiKey: process.env.GROK_API_KEY!,
      baseUrl: 'https://api.x.ai/v1',
      models: {
        general: 'grok-beta',
        code: 'grok-code-fast-1',
        vision: 'grok-vision-beta'
      },
      limits: {
        maxTokens: 4096,
        contextWindow: 2000000,
        monthlyCredits: 25
      }
    },
    gemini: { 
      apiKey: process.env.GEMINI_API_KEY!,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: {
        general: 'gemini-pro',
        vision: 'gemini-pro-vision'
      }
    },
    openai: { 
      apiKey: process.env.OPENAI_API_KEY!,
      baseUrl: 'https://api.openai.com/v1',
      models: {
        general: 'gpt-4',
        code: 'gpt-4-code'
      }
    }
  });
  
  // Initialize widget aggregation service
  const widgetService = new PraxisWidgetAggregationService(supabase, aiService);

  // Initialize AI orchestrator (lazy-loaded)
  const aiOrchestrator = getAIOrchestrator();

  // Initialize Praxis-specific services
  const subscriptionManager = new PraxisSubscriptionManager(supabase);
  const featureGate = new PraxisFeatureGate(subscriptionManager);
  const aiSecurityService = new PraxisAISecurityService(supabase);
  const encryptionService = createEncryptionService(supabase);

  // Extract token from Authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let user = null;
  let praxisAuth = null;
  
  if (token) {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (authUser && !error) {
        user = {
          id: authUser.id,
          email: authUser.email!,
        };
        
        // Create PraxisAuthContext for authenticated users
        try {
          praxisAuth = await subscriptionManager.createAuthContext(authUser.id);
        } catch (error) {
          console.error('Failed to create PraxisAuthContext:', error);
          // Continue without PraxisAuthContext for now
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return {
    supabase,
    supabaseAdmin,
    aiService,
    aiOrchestrator,
    widgetService,
    subscriptionManager,
    featureGate,
    aiSecurityService,
    encryptionService,
    praxisAuth,
    user,
  };
};

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin procedure (requires admin privileges)
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  // Add admin check logic here if needed
  // For now, we'll use the same as protectedProcedure
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Praxis-specific procedures with feature gating
export const praxisProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.praxisAuth) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Praxis authentication required',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      praxisAuth: ctx.praxisAuth,
    },
  });
});

// AI request procedure with rate limiting and security
export const aiRequestProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.praxisAuth) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for AI requests',
    });
  }

  // Check AI rate limits
  try {
    await ctx.featureGate.checkAIRateLimit(ctx.user.id);
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'AI request limit exceeded',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      praxisAuth: ctx.praxisAuth,
    },
  });
});

// Widget access procedure
export const widgetProcedure = t.procedure.use(async ({ ctx, next, input }) => {
  if (!ctx.user || !ctx.praxisAuth) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for widget access',
    });
  }

  // Extract widget name from input if available
  const widgetName = (input as any)?.widget || (input as any)?.widgetName;
  if (widgetName) {
    try {
      await ctx.featureGate.checkWidgetAccess(ctx.user.id, widgetName);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied for widget: ${widgetName}`,
      });
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      praxisAuth: ctx.praxisAuth,
    },
  });
});
