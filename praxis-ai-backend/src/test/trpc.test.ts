// Simple test to verify tRPC setup
import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers';

describe('tRPC Setup', () => {
  it('should have all required routers', () => {
    expect(appRouter).toBeDefined();
    expect(appRouter.dashboard).toBeDefined();
    expect(appRouter.kiko).toBeDefined();
    expect(appRouter.notes).toBeDefined();
    expect(appRouter.projects).toBeDefined();
    expect(appRouter.insights).toBeDefined();
    expect(appRouter.explore).toBeDefined();
    expect(appRouter.gamification).toBeDefined();
    expect(appRouter.themes).toBeDefined();
    expect(appRouter.schedule).toBeDefined();
    expect(appRouter.health).toBeDefined();
  });

  it('should have correct router structure', () => {
    // Test that each router has the expected procedures
    expect(typeof appRouter.dashboard.getDashboardData).toBe('function');
    expect(typeof appRouter.kiko.sendMessage).toBe('function');
    expect(typeof appRouter.notes.createNote).toBe('function');
    expect(typeof appRouter.projects.createProject).toBe('function');
    expect(typeof appRouter.insights.generateInsights).toBe('function');
    expect(typeof appRouter.explore.webSearch).toBe('function');
    expect(typeof appRouter.gamification.awardPoints).toBe('function');
    expect(typeof appRouter.themes.createTheme).toBe('function');
    expect(typeof appRouter.schedule.createTask).toBe('function');
    expect(typeof appRouter.health.createHealthData).toBe('function');
  });
});
