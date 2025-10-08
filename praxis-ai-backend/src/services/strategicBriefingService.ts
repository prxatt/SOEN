// Strategic Briefing Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';
import { StrategicBriefing, UserContext } from '../types/ai';

export interface BriefingData {
  goals: any[];
  tasks: any[];
  healthData: any[];
  calendarEvents: any[];
  notes: any[];
  learningData: any[];
  productivityMetrics: any;
}

export interface BriefingConfig {
  includeHealthRecommendations: boolean;
  includeLearningOpportunities: boolean;
  includeProductivityTips: boolean;
  focusAreas: string[];
  timeHorizon: 'daily' | 'weekly' | 'monthly';
}

export class StrategicBriefingService {
  constructor(private grokService: EnhancedGrokService) {}

  async generateMorningBriefing(
    userId: string,
    briefingData: BriefingData,
    config: BriefingConfig = {
      includeHealthRecommendations: true,
      includeLearningOpportunities: true,
      includeProductivityTips: true,
      focusAreas: ['goals', 'health', 'productivity'],
      timeHorizon: 'daily'
    }
  ): Promise<StrategicBriefing> {
    const userContext: UserContext = {
      userId,
      goals: briefingData.goals,
      recentTasks: briefingData.tasks,
      healthData: briefingData.healthData,
      calendarData: briefingData.calendarEvents,
      notes: briefingData.notes,
      learningData: briefingData.learningData,
      productivityMetrics: briefingData.productivityMetrics,
    };

    const briefing = await this.grokService.generateBriefing(userContext);
    
    // Enhance briefing with additional analysis
    const enhancedBriefing = await this.enhanceBriefing(briefing, briefingData, config);
    
    return enhancedBriefing;
  }

  async generateWeeklyBriefing(
    userId: string,
    briefingData: BriefingData
  ): Promise<StrategicBriefing> {
    const config: BriefingConfig = {
      includeHealthRecommendations: true,
      includeLearningOpportunities: true,
      includeProductivityTips: true,
      focusAreas: ['goals', 'health', 'productivity', 'learning'],
      timeHorizon: 'weekly'
    };

    return this.generateMorningBriefing(userId, briefingData, config);
  }

  async generateMonthlyBriefing(
    userId: string,
    briefingData: BriefingData
  ): Promise<StrategicBriefing> {
    const config: BriefingConfig = {
      includeHealthRecommendations: true,
      includeLearningOpportunities: true,
      includeProductivityTips: true,
      focusAreas: ['goals', 'health', 'productivity', 'learning', 'growth'],
      timeHorizon: 'monthly'
    };

    return this.generateMorningBriefing(userId, briefingData, config);
  }

  private async enhanceBriefing(
    briefing: StrategicBriefing,
    data: BriefingData,
    config: BriefingConfig
  ): Promise<StrategicBriefing> {
    // Add goal progress analysis
    const goalProgress = this.analyzeGoalProgress(data.goals);
    
    // Add health synthesis
    const healthSynthesis = config.includeHealthRecommendations 
      ? this.synthesizeHealthData(data.healthData)
      : null;
    
    // Add learning opportunities
    const learningOpportunities = config.includeLearningOpportunities
      ? this.identifyLearningOpportunities(data.learningData, data.notes)
      : null;
    
    // Add productivity tips
    const productivityTips = config.includeProductivityTips
      ? this.generateProductivityTips(data.productivityMetrics, data.tasks)
      : null;

    return {
      ...briefing,
      goalProgress,
      healthSynthesis,
      learningOpportunities,
      productivityTips,
      generatedAt: new Date().toISOString(),
      config,
    };
  }

  private analyzeGoalProgress(goals: any[]): any {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
      progressByTerm: {
        short: this.calculateProgressByTerm(goals, 'short'),
        mid: this.calculateProgressByTerm(goals, 'mid'),
        long: this.calculateProgressByTerm(goals, 'long'),
      },
      upcomingDeadlines: this.getUpcomingDeadlines(activeGoals),
    };
  }

  private synthesizeHealthData(healthData: any[]): any {
    if (!healthData.length) return null;

    const recentData = healthData.slice(-7); // Last 7 days
    
    return {
      averageSteps: this.calculateAverage(recentData, 'steps'),
      averageSleep: this.calculateAverage(recentData, 'sleep'),
      averageWater: this.calculateAverage(recentData, 'water'),
      energyTrend: this.calculateTrend(recentData, 'energy'),
      moodTrend: this.calculateTrend(recentData, 'mood'),
      recommendations: this.generateHealthRecommendations(recentData),
    };
  }

  private identifyLearningOpportunities(learningData: any[], notes: any[]): any {
    const recentNotes = notes.slice(-10);
    const learningTopics = this.extractLearningTopics(recentNotes);
    
    return {
      currentFocus: learningData.find(d => d.status === 'active')?.topic || null,
      suggestedTopics: this.suggestLearningTopics(learningTopics),
      skillGaps: this.identifySkillGaps(learningData, recentNotes),
      resources: this.suggestResources(learningTopics),
    };
  }

  private generateProductivityTips(metrics: any, tasks: any[]): any {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const productivityScore = this.calculateProductivityScore(completedTasks, metrics);
    
    return {
      productivityScore,
      peakHours: this.identifyPeakHours(tasks),
      taskCompletionRate: this.calculateCompletionRate(tasks),
      suggestions: this.generateProductivitySuggestions(metrics, tasks),
      optimizations: this.identifyOptimizations(tasks, metrics),
    };
  }

  // Helper methods
  private calculateProgressByTerm(goals: any[], term: string): number {
    const termGoals = goals.filter(goal => goal.term === term);
    if (termGoals.length === 0) return 0;
    
    const completed = termGoals.filter(goal => goal.status === 'completed').length;
    return (completed / termGoals.length) * 100;
  }

  private getUpcomingDeadlines(goals: any[]): any[] {
    const now = new Date();
    const upcoming = goals
      .filter(goal => goal.dueDate && new Date(goal.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
    
    return upcoming.map(goal => ({
      title: goal.title,
      dueDate: goal.dueDate,
      daysRemaining: Math.ceil((new Date(goal.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  private calculateAverage(data: any[], field: string): number {
    const values = data.map(d => d[field]).filter(v => v != null);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateTrend(data: any[], field: string): 'improving' | 'declining' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const values = data.map(d => d[field]).filter(v => v != null);
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  private generateHealthRecommendations(data: any[]): string[] {
    const recommendations: string[] = [];
    
    const avgSteps = this.calculateAverage(data, 'steps');
    const avgSleep = this.calculateAverage(data, 'sleep');
    const avgWater = this.calculateAverage(data, 'water');
    
    if (avgSteps < 8000) {
      recommendations.push('Consider increasing daily step count to 10,000+ for better health');
    }
    
    if (avgSleep < 7) {
      recommendations.push('Aim for 7-9 hours of sleep for optimal performance');
    }
    
    if (avgWater < 8) {
      recommendations.push('Increase water intake to 8+ glasses per day');
    }
    
    return recommendations;
  }

  private extractLearningTopics(notes: any[]): string[] {
    const topics: string[] = [];
    notes.forEach(note => {
      note.tags?.forEach(tag => {
        if (!topics.includes(tag)) {
          topics.push(tag);
        }
      });
    });
    return topics;
  }

  private suggestLearningTopics(currentTopics: string[]): string[] {
    // This would be enhanced with AI to suggest related topics
    const suggestions: string[] = [];
    
    if (currentTopics.includes('productivity')) {
      suggestions.push('time management', 'focus techniques', 'energy optimization');
    }
    
    if (currentTopics.includes('health')) {
      suggestions.push('nutrition', 'exercise science', 'sleep optimization');
    }
    
    return suggestions.slice(0, 3);
  }

  private identifySkillGaps(learningData: any[], notes: any[]): string[] {
    // Analyze learning data and notes to identify skill gaps
    return ['advanced project management', 'data analysis', 'leadership skills'];
  }

  private suggestResources(topics: string[]): any[] {
    return topics.map(topic => ({
      topic,
      resources: [
        { type: 'book', title: `Recommended book on ${topic}` },
        { type: 'course', title: `Online course: ${topic}` },
        { type: 'article', title: `Latest insights on ${topic}` },
      ]
    }));
  }

  private calculateProductivityScore(completedTasks: any[], metrics: any): number {
    const taskScore = completedTasks.length * 10;
    const timeScore = metrics.focusTime || 0;
    const energyScore = metrics.energyLevel || 50;
    
    return Math.min(100, (taskScore + timeScore + energyScore) / 3);
  }

  private identifyPeakHours(tasks: any[]): string[] {
    const hourCounts: { [hour: number]: number } = {};
    
    tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    return peakHours;
  }

  private calculateCompletionRate(tasks: any[]): number {
    const completed = tasks.filter(task => task.status === 'completed').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }

  private generateProductivitySuggestions(metrics: any, tasks: any[]): string[] {
    const suggestions: string[] = [];
    
    const completionRate = this.calculateCompletionRate(tasks);
    
    if (completionRate < 70) {
      suggestions.push('Break large tasks into smaller, manageable chunks');
    }
    
    if (metrics.focusTime < 120) {
      suggestions.push('Try Pomodoro technique for better focus');
    }
    
    if (metrics.energyLevel < 60) {
      suggestions.push('Schedule demanding tasks during peak energy hours');
    }
    
    return suggestions;
  }

  private identifyOptimizations(tasks: any[], metrics: any): string[] {
    return [
      'Batch similar tasks together',
      'Use time-blocking for important work',
      'Eliminate or delegate low-value activities',
      'Optimize your workspace for focus',
    ];
  }
}
