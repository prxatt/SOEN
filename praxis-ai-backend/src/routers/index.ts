import { router } from '../context';

// Import all routers
import { dashboardRouter } from './dashboard';
import { kikoRouter } from './kiko';
import { notesRouter } from './notes';
import { projectsRouter } from './projects';
import { insightsRouter } from './insights';
import { exploreRouter } from './explore';
import { gamificationRouter } from './gamification';
import { themesRouter } from './themes';
import { scheduleRouter } from './schedule';
import { healthRouter } from './health';
import { aiOrchestratorRouter } from './aiOrchestrator';
import { authRouter } from './auth';
import { encryptionRouter } from './encryption';
import { notionRouter } from './notion';
import { visionRouter } from './vision';

// Main app router
export const appRouter = router({
  dashboard: dashboardRouter,
  kiko: kikoRouter,
  notes: notesRouter,
  projects: projectsRouter,
  insights: insightsRouter,
  explore: exploreRouter,
  gamification: gamificationRouter,
  themes: themesRouter,
  schedule: scheduleRouter,
  health: healthRouter,
  ai: aiOrchestratorRouter,
  auth: authRouter, // New authentication router
  encryption: encryptionRouter, // New encryption router
  notion: notionRouter, // New Notion sync router
  vision: visionRouter, // New Vision AI router
});

export type AppRouter = typeof appRouter;
