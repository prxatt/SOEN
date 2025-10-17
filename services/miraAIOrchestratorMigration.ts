// services/miraAIOrchestratorMigration.ts
// Migration helper to gradually switch from old Mira service to orchestrator

import { miraAIOrchestratorRouter } from './miraAIOrchestratorIntegration';
import { miraRequest } from './miraAIService';

// Feature flag to control migration - ENABLED BY DEFAULT since app is not live
const USE_ORCHESTRATOR = process.env.USE_AI_ORCHESTRATOR !== 'false';

// Gradual migration function
export async function miraRequestWithRouting(
  userId: string,
  taskType: any,
  payload: any,
  context?: any
) {
  if (USE_ORCHESTRATOR) {
    // Use new orchestrator
    try {
      return await miraAIOrchestratorRouter.processMiraRequest(
        userId,
        taskType,
        payload,
        context
      );
    } catch (error) {
      console.error('Orchestrator failed, falling back to original:', error);
      // Fallback to original service
      return await miraRequest(taskType, payload);
    }
  } else {
    // Use original service
    return await miraRequest(taskType, payload);
  }
}

// Helper to get user context for better AI responses
export async function getUserContext(userId: string) {
  try {
    const { supabase } = await import('../src/lib/supabase-client');
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent notes
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      userProfile: profile,
      recentTasks: tasks || [],
      recentNotes: notes || [],
      userGoals: goals || []
    };
  } catch (error) {
    console.error('Failed to get user context:', error);
    return {
      userProfile: null,
      recentTasks: [],
      recentNotes: [],
      userGoals: []
    };
  }
}