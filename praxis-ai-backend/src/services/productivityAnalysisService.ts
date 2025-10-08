// Productivity Analysis Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';

export interface ProductivityData {
  tasks: TaskData[];
  timeTracking: TimeTrackingData[];
  healthMetrics: HealthMetricsData[];
  goals: GoalData[];
  calendarEvents: CalendarEventData[];
  notes: NoteData[];
}

export interface TaskData {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  estimatedDuration: number;
  actualDuration?: number;
  completedAt?: Date;
  createdAt: Date;
  difficulty: number; // 1-5
}

export interface TimeTrackingData {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  focusLevel: number; // 1-5
  interruptions: number;
  context: string;
}

export interface HealthMetricsData {
  date: Date;
  sleep: number;
  energy: number; // 1-10
  mood: number; // 1-10
  stress: number; // 1-10
  exercise: number; // minutes
  steps: number;
}

export interface GoalData {
  id: string;
  text: string;
  term: string;
  status: string;
  progress: number;
  priority: string;
  dueDate?: Date;
}

export interface CalendarEventData {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: string;
  importance: number; // 1-5
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  sentiment: number; // 1-5
}

export interface ProductivityAnalysis {
  overallScore: number;
  trends: ProductivityTrend[];
  patterns: ProductivityPattern[];
  optimizations: Optimization[];
  strengths: string[];
  improvements: string[];
  strategies: string[];
  predictions: Prediction[];
  recommendations: string[];
}

export interface ProductivityTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  magnitude: number;
  timeframe: string;
  significance: number;
}

export interface ProductivityPattern {
  name: string;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  examples: string[];
}

export interface Optimization {
  area: string;
  currentState: string;
  suggestedImprovement: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  implementation: string[];
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export class ProductivityAnalysisService {
  constructor(private grokService: EnhancedGrokService) {}

  async analyzeProductivity(
    data: ProductivityData,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ProductivityAnalysis> {
    // Preprocess data
    const processedData = this.preprocessData(data, timeframe);
    
    // Generate AI analysis
    const aiAnalysis = await this.generateAIAnalysis(processedData, timeframe);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(processedData);
    
    // Identify patterns
    const patterns = await this.identifyPatterns(processedData);
    
    // Generate optimizations
    const optimizations = await this.generateOptimizations(processedData, patterns);
    
    // Make predictions
    const predictions = await this.generatePredictions(processedData, patterns);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(processedData, patterns, optimizations);
    
    return {
      overallScore: this.calculateOverallScore(metrics),
      trends: aiAnalysis.trends,
      patterns,
      optimizations,
      strengths: aiAnalysis.strengths,
      improvements: aiAnalysis.improvements,
      strategies: aiAnalysis.strategies,
      predictions,
      recommendations,
    };
  }

  async analyzeFocusPatterns(timeTrackingData: TimeTrackingData[]): Promise<{
    peakHours: string[];
    focusTrends: any[];
    interruptionPatterns: any[];
    recommendations: string[];
  }> {
    const focusPrompt = this.buildFocusAnalysisPrompt(timeTrackingData);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's focus pattern analyzer. Analyze time tracking data to identify:
- Peak focus hours
- Focus trends over time
- Interruption patterns
- Optimization recommendations

Format as JSON with: peakHours[], focusTrends[], interruptionPatterns[], recommendations[]`
      },
      {
        role: 'user',
        content: focusPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async analyzeEnergyPatterns(healthData: HealthMetricsData[]): Promise<{
    energyTrends: any[];
    correlations: any[];
    recommendations: string[];
  }> {
    const energyPrompt = this.buildEnergyAnalysisPrompt(healthData);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's energy pattern analyzer. Analyze health data to identify:
- Energy trends and patterns
- Correlations with other metrics
- Optimization recommendations

Format as JSON with: energyTrends[], correlations[], recommendations[]`
      },
      {
        role: 'user',
        content: energyPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async generatePersonalizedStrategies(
    analysis: ProductivityAnalysis,
    userPreferences: any
  ): Promise<{
    strategies: string[];
    implementation: any[];
    timeline: string[];
    expectedOutcomes: string[];
  }> {
    const strategyPrompt = this.buildStrategyPrompt(analysis, userPreferences);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's strategy generator. Create personalized productivity strategies based on analysis and user preferences.`
      },
      {
        role: 'user',
        content: strategyPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async predictProductivityOutcomes(
    currentData: ProductivityData,
    plannedChanges: any[]
  ): Promise<{
    predictions: Array<{
      metric: string;
      currentValue: number;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
    recommendations: string[];
  }> {
    const predictionPrompt = this.buildPredictionPrompt(currentData, plannedChanges);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's productivity predictor. Predict outcomes of planned changes based on current data patterns.`
      },
      {
        role: 'user',
        content: predictionPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  private preprocessData(data: ProductivityData, timeframe: string): any {
    const cutoffDate = this.getCutoffDate(timeframe);
    
    return {
      tasks: data.tasks.filter(task => task.createdAt >= cutoffDate),
      timeTracking: data.timeTracking.filter(entry => entry.startTime >= cutoffDate),
      healthMetrics: data.healthMetrics.filter(metric => metric.date >= cutoffDate),
      goals: data.goals,
      calendarEvents: data.calendarEvents.filter(event => event.startTime >= cutoffDate),
      notes: data.notes.filter(note => note.createdAt >= cutoffDate),
    };
  }

  private async generateAIAnalysis(processedData: any, timeframe: string): Promise<any> {
    const analysisPrompt = this.buildAnalysisPrompt(processedData, timeframe);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's productivity analyst. Analyze productivity data to identify trends, strengths, improvements, and strategies.`
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  private calculateMetrics(data: any): any {
    return {
      taskCompletionRate: this.calculateTaskCompletionRate(data.tasks),
      averageTaskDuration: this.calculateAverageTaskDuration(data.tasks),
      focusTime: this.calculateFocusTime(data.timeTracking),
      energyLevel: this.calculateAverageEnergy(data.healthMetrics),
      goalProgress: this.calculateGoalProgress(data.goals),
      productivityScore: 0, // Will be calculated
    };
  }

  private async identifyPatterns(data: any): Promise<ProductivityPattern[]> {
    const patternPrompt = this.buildPatternPrompt(data);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's pattern identifier. Identify productivity patterns from user data.`
      },
      {
        role: 'user',
        content: patternPrompt
      }
    ]);

    return JSON.parse(response.content).patterns;
  }

  private async generateOptimizations(data: any, patterns: ProductivityPattern[]): Promise<Optimization[]> {
    const optimizationPrompt = this.buildOptimizationPrompt(data, patterns);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's optimization generator. Generate specific optimizations based on data and patterns.`
      },
      {
        role: 'user',
        content: optimizationPrompt
      }
    ]);

    return JSON.parse(response.content).optimizations;
  }

  private async generatePredictions(data: any, patterns: ProductivityPattern[]): Promise<Prediction[]> {
    const predictionPrompt = this.buildPredictionPrompt(data, patterns);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's productivity predictor. Generate predictions based on current data and patterns.`
      },
      {
        role: 'user',
        content: predictionPrompt
      }
    ]);

    return JSON.parse(response.content).predictions;
  }

  private async generateRecommendations(
    data: any,
    patterns: ProductivityPattern[],
    optimizations: Optimization[]
  ): Promise<string[]> {
    const recommendationPrompt = this.buildRecommendationPrompt(data, patterns, optimizations);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's recommendation engine. Generate actionable recommendations based on analysis.`
      },
      {
        role: 'user',
        content: recommendationPrompt
      }
    ]);

    return JSON.parse(response.content).recommendations;
  }

  private calculateOverallScore(metrics: any): number {
    // Weighted calculation of overall productivity score
    const weights = {
      taskCompletionRate: 0.3,
      focusTime: 0.25,
      energyLevel: 0.2,
      goalProgress: 0.15,
      averageTaskDuration: 0.1,
    };
    
    let score = 0;
    Object.entries(weights).forEach(([metric, weight]) => {
      score += (metrics[metric] || 0) * weight;
    });
    
    return Math.min(100, Math.max(0, score));
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateTaskCompletionRate(tasks: TaskData[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }

  private calculateAverageTaskDuration(tasks: TaskData[]): number {
    const tasksWithDuration = tasks.filter(task => task.actualDuration);
    if (tasksWithDuration.length === 0) return 0;
    
    const totalDuration = tasksWithDuration.reduce((sum, task) => sum + (task.actualDuration || 0), 0);
    return totalDuration / tasksWithDuration.length;
  }

  private calculateFocusTime(timeTracking: TimeTrackingData[]): number {
    return timeTracking.reduce((sum, entry) => sum + entry.duration, 0);
  }

  private calculateAverageEnergy(healthMetrics: HealthMetricsData[]): number {
    if (healthMetrics.length === 0) return 0;
    const totalEnergy = healthMetrics.reduce((sum, metric) => sum + metric.energy, 0);
    return totalEnergy / healthMetrics.length;
  }

  private calculateGoalProgress(goals: GoalData[]): number {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    return totalProgress / goals.length;
  }

  // Prompt building methods
  private buildAnalysisPrompt(data: any, timeframe: string): string {
    return `
Analyze productivity data for ${timeframe}:

TASKS: ${data.tasks.length} total, ${data.tasks.filter(t => t.status === 'completed').length} completed
TIME TRACKING: ${data.timeTracking.length} entries
HEALTH METRICS: ${data.healthMetrics.length} entries
GOALS: ${data.goals.length} total
CALENDAR EVENTS: ${data.calendarEvents.length} events
NOTES: ${data.notes.length} notes

Identify trends, strengths, improvements, and strategies.
    `.trim();
  }

  private buildFocusAnalysisPrompt(timeTrackingData: TimeTrackingData[]): string {
    return `
Analyze focus patterns from time tracking data:

ENTRIES: ${timeTrackingData.length}
TOTAL FOCUS TIME: ${timeTrackingData.reduce((sum, entry) => sum + entry.duration, 0)} minutes
AVERAGE FOCUS LEVEL: ${timeTrackingData.reduce((sum, entry) => sum + entry.focusLevel, 0) / timeTrackingData.length}
TOTAL INTERRUPTIONS: ${timeTrackingData.reduce((sum, entry) => sum + entry.interruptions, 0)}

Identify peak hours, trends, and optimization opportunities.
    `.trim();
  }

  private buildEnergyAnalysisPrompt(healthData: HealthMetricsData[]): string {
    return `
Analyze energy patterns from health data:

ENTRIES: ${healthData.length}
AVERAGE ENERGY: ${healthData.reduce((sum, metric) => sum + metric.energy, 0) / healthData.length}
AVERAGE SLEEP: ${healthData.reduce((sum, metric) => sum + metric.sleep, 0) / healthData.length}
AVERAGE EXERCISE: ${healthData.reduce((sum, metric) => sum + metric.exercise, 0) / healthData.length} minutes

Identify correlations and optimization opportunities.
    `.trim();
  }

  private buildPatternPrompt(data: any): string {
    return `
Identify productivity patterns from this data:

TASKS: ${data.tasks.length}
TIME TRACKING: ${data.timeTracking.length}
HEALTH: ${data.healthMetrics.length}
GOALS: ${data.goals.length}

Look for recurring patterns, correlations, and behavioral trends.
    `.trim();
  }

  private buildOptimizationPrompt(data: any, patterns: ProductivityPattern[]): string {
    return `
Generate optimizations based on:

DATA: ${JSON.stringify(data)}
PATTERNS: ${patterns.map(p => p.name).join(', ')}

Suggest specific, actionable optimizations.
    `.trim();
  }

  private buildPredictionPrompt(data: any, patterns: ProductivityPattern[]): string {
    return `
Generate predictions based on:

DATA: ${JSON.stringify(data)}
PATTERNS: ${patterns.map(p => p.name).join(', ')}

Predict future productivity metrics and outcomes.
    `.trim();
  }

  private buildRecommendationPrompt(
    data: any,
    patterns: ProductivityPattern[],
    optimizations: Optimization[]
  ): string {
    return `
Generate recommendations based on:

DATA: ${JSON.stringify(data)}
PATTERNS: ${patterns.map(p => p.name).join(', ')}
OPTIMIZATIONS: ${optimizations.map(o => o.area).join(', ')}

Provide actionable, prioritized recommendations.
    `.trim();
  }

  private buildStrategyPrompt(analysis: ProductivityAnalysis, userPreferences: any): string {
    return `
Generate personalized strategies based on:

ANALYSIS: ${JSON.stringify(analysis)}
PREFERENCES: ${JSON.stringify(userPreferences)}

Create specific, implementable strategies.
    `.trim();
  }
}
