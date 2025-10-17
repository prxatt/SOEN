// services/miraAIOrchestratorIntegration.ts
// Integration layer between existing Mira AI service and new orchestrator

import { aiOrchestrator } from './aiOrchestrator';
import { MiraTaskType } from './miraAIService';
import { supabase } from '../src/lib/supabase';

// Map existing MiraTaskType to new FeatureType
const MIRA_TO_FEATURE_MAP: Record<MiraTaskType, string> = {
  'parse_command': 'task_parsing',
  'parse_task_update': 'task_parsing',
  'generate_note_text': 'note_generation',
  'generate_completion_summary': 'completion_summary',
  'generate_actionable_insights': 'strategic_briefing',
  'generate_briefing': 'strategic_briefing',
  'analyze_image': 'vision_ocr',
  'generate_mindmap': 'mindmap_generation',
  'research_with_sources': 'research_with_sources',
  'generate_daily_image': 'completion_image'
};

// Enhanced Mira AI Request Router
export class MiraAIOrchestratorRouter {
  
  // Main entry point for Mira AI requests
  async processMiraRequest(
    userId: string,
    taskType: MiraTaskType,
    payload: any,
    context?: {
      conversationHistory?: Array<{role: string; content: string}>;
      userGoals?: any[];
      recentTasks?: any[];
      recentNotes?: any[];
    }
  ) {
    try {
      // Get user profile for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Map to orchestrator request format
      const request = {
        userId,
        message: this.extractMessage(taskType, payload),
        context: {
          conversationHistory: context?.conversationHistory || [],
          userGoals: context?.userGoals || [],
          recentTasks: context?.recentTasks || [],
          recentNotes: context?.recentNotes || [],
          userProfile: profile,
          currentTime: new Date(),
          location: profile?.location
        },
        featureType: MIRA_TO_FEATURE_MAP[taskType] as any,
        priority: this.determinePriority(taskType),
        files: this.extractFiles(payload),
        taskType
      };

      // Process through orchestrator
      const response = await aiOrchestrator.processRequest(request);

      // Transform response back to Mira format
      return this.transformResponse(response, taskType);

    } catch (error) {
      console.error('Mira AI Orchestrator error:', error);
      
      // Fallback to existing Mira service
      return await this.fallbackToExistingService(userId, taskType, payload);
    }
  }

  private extractMessage(taskType: MiraTaskType, payload: any): string {
    switch (taskType) {
      case 'parse_command':
        return payload.command || '';
      case 'parse_task_update':
        return payload.update || '';
      case 'generate_note_text':
        return payload.text || '';
      case 'generate_completion_summary':
        return `Summarize completion of task: ${payload.task?.title || ''}`;
      case 'generate_actionable_insights':
        return payload.text || '';
      case 'generate_briefing':
        return `Generate briefing for ${payload.timeframe || 'day'}`;
      case 'analyze_image':
        return payload.prompt || 'Analyze this image';
      case 'generate_mindmap':
        return 'Generate a mind map from the provided context';
      case 'research_with_sources':
        return payload.query || '';
      case 'generate_daily_image':
        return payload.prompt || 'Generate a motivational daily image';
      default:
        return JSON.stringify(payload);
    }
  }

  private determinePriority(taskType: MiraTaskType): 'low' | 'medium' | 'high' {
    const highPriority = ['generate_briefing', 'generate_actionable_insights'];
    const mediumPriority = ['generate_note_text', 'generate_mindmap', 'research_with_sources'];
    
    if (highPriority.includes(taskType)) return 'high';
    if (mediumPriority.includes(taskType)) return 'medium';
    return 'low';
  }

  private extractFiles(payload: any): any[] {
    if (payload.files) return payload.files;
    if (payload.imageBase64) {
      return [{
        type: 'image',
        base64: payload.imageBase64,
        mimeType: payload.mimeType || 'image/jpeg'
      }];
    }
    return [];
  }

  private transformResponse(response: any, taskType: MiraTaskType): any {
    // Transform orchestrator response back to Mira format
    switch (taskType) {
      case 'parse_command':
      case 'parse_task_update':
        return {
          title: this.extractTitle(response.content),
          category: this.extractCategory(response.content),
          plannedDuration: this.extractDuration(response.content)
        };
      
      case 'generate_note_text':
        return response.content;
      
      case 'generate_completion_summary':
        return {
          newTitle: this.extractTitle(response.content),
          shortInsight: response.content
        };
      
      case 'generate_actionable_insights':
        return this.parseInsights(response.content);
      
      case 'generate_briefing':
        return this.parseBriefing(response.content);
      
      case 'analyze_image':
        return {
          description: response.content,
          insights: this.extractInsights(response.content)
        };
      
      case 'generate_mindmap':
        return this.parseMindmap(response.content);
      
      case 'research_with_sources':
        return {
          content: response.content,
          sources: response.sources || []
        };
      
      case 'generate_daily_image':
        return response.content; // URL for generated image
      
      default:
        return response.content;
    }
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/title[:\s]+"([^"]+)"/i);
    return titleMatch ? titleMatch[1] : 'New Task';
  }

  private extractCategory(content: string): string {
    const categoryMatch = content.match(/category[:\s]+"([^"]+)"/i);
    return categoryMatch ? categoryMatch[1] : 'Personal';
  }

  private extractDuration(content: string): number {
    const durationMatch = content.match(/duration[:\s]+(\d+)/i);
    return durationMatch ? parseInt(durationMatch[1]) : 60;
  }

  private parseInsights(content: string): any[] {
    try {
      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights : [insights];
    } catch {
      return [{ text: content, type: 'general' }];
    }
  }

  private parseBriefing(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return { title: 'Daily Briefing', summary: content };
    }
  }

  private extractInsights(content: string): string[] {
    const insights = content.split('\n').filter(line => 
      line.trim().length > 0 && 
      (line.includes('•') || line.includes('-') || line.includes('*'))
    );
    return insights.map(insight => insight.replace(/^[•\-*]\s*/, '').trim());
  }

  private parseMindmap(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return { nodes: [], edges: [] };
    }
  }

  private async fallbackToExistingService(
    userId: string,
    taskType: MiraTaskType,
    payload: any
  ): Promise<any> {
    // Import existing Mira service functions
    const { miraRequest } = await import('./miraAIService');
    
    console.log('Falling back to existing Mira service');
    return await miraRequest(taskType, payload);
  }
}

export const miraAIOrchestratorRouter = new MiraAIOrchestratorRouter();