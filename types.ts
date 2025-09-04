// FIX: Changed from enum to type to allow for custom user-defined categories.
export type Category = string;

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed'
}

export interface CompletionSummary {
  newTitle: string;
  shortInsight: string;
}

export interface Task {
  id: number;
  title: string;
  category: Category;
  startTime: Date;
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  pausedElapsedTime?: number; // in seconds
  status: TaskStatus;
  undoStatus?: TaskStatus; // To store the previous status before completion
  notebookId?: number;
  googleCalendarEventId?: string;
  linkedUrl?: string; // For virtual meeting links
  referenceUrl?: string; // For articles, youtube, learning resources
  // New contextual fields
  projectId?: number;
  location?: string;
  insights?: ActionableInsight | null; // For caching AI insights
  isGeneratingInsights?: boolean; // For non-blocking UI
  completionImageUrl?: string; // For the visual completion background
  completionSummary?: CompletionSummary; // For AI-generated title and insight on completion
  isVirtual?: boolean; // For smart categorization
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  recipeQuery?: string; // Store the recipe subject from NLP
}

export interface Note {
  id: number;
  notebookId: number;
  title:string;
  content: string;
  createdAt: Date;
  archived: boolean;
  flagged: boolean;
  tags: string[];
  thumbnailUrl?: string; // For AI-generated thumbnail
}

export interface Notebook {
    id: number;
    title: string;
    color?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  // In the future, these would be arrays of IDs
  taskIds?: number[]; 
  noteIds?: number[];
  goalIds?: number[];
}

export interface PortfolioItem {
  id: number;
  title:string;
  description: string;
  imageUrl: string;
  project: string;
}

export interface Insight {
  id: number;
  source: string; // e.g., course title or note title
  insightText: string;
  applied: boolean;
  points: number;
}


// --- NEW VISUAL INSIGHT WIDGETS ---

export interface DataPoint {
    name: string;
    value: number;
    fill: string;
}

export interface ChartWidget {
    type: 'bar' | 'line';
    title: string;
    data: DataPoint[];
    commentary: string;
}

export interface AreaChartWidget {
    type: 'area';
    title: string;
    data: DataPoint[];
    commentary: string;
    stroke: string; // The line color, e.g., '#8884d8'
}

export interface RadialChartWidget {
    type: 'radial';
    title: string;
    value: number; // A percentage from 0-100
    label: string;
    color: string; // The fill color for the bar
}

export interface KeyMetricWidget {
    type: 'metric';
    title: string;
    value: string;
    unit: string;
    icon: string; // Icon name from Icons.tsx
    color: string; // e.g., 'text-green-400'
}

export interface TextWidget {
    type: 'text';
    title: string;
    icon: string;
    content: string;
    links?: { title: string; url: string }[];
}

export interface RecipeWidget {
    type: 'recipe';
    name: string;
    sourceUrl: string;
    imageUrl?: string;
    ingredients: string[];
    quick_instructions: string;
}

export interface MapWidget {
    type: 'map';
    title: string;
    locationQuery: string;
    embedUrl: string; // Google Maps embed URL
}

export interface GeneratedImageWidget {
    type: 'generated_image';
    title: string;
    prompt: string;
    imageUrl: string; // Base64 Data URL
}

export interface WeatherWidget {
    type: 'weather';
    title: string;
    location: string;
    currentTemp: number;
    conditionIcon: WeatherIconType; // e.g., 'sun', 'cloud-rain'
    hourlyForecast: {
        time: string; // e.g., "3PM"
        temp: number;
        icon: WeatherIconType;
    }[];
}


export type InsightWidgetData = ChartWidget | AreaChartWidget | RadialChartWidget | KeyMetricWidget | TextWidget | RecipeWidget | MapWidget | GeneratedImageWidget | WeatherWidget;

// New type for richer, widget-based AI insights
export interface ActionableInsight {
    widgets: InsightWidgetData[];
}


export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    start: {
        dateTime: string;
    };
    end: {
        dateTime: string;
    };
}

export interface TaskPrep {
    action_plan: string[];
    key_takeaways: string[];
    inquiry_prompts: string[];
    related_links: { title: string; url: string }[];
}

export interface ActionItem {
  title: string;
}

export type Theme = 'default' | 'solaris' | 'crimson' | 'oceanic';
export type RewardType = 'theme' | 'focus_background';

export interface RewardItem {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  cost: number;
  value: string; // e.g., theme name or css class name
}


// Represents the new, hyper-personalized daily briefing
export interface StrategicBriefing {
    goal_progress: GoalProgress;
    health_and_performance: HealthAndPerformance;
    learning_synthesis: LearningSynthesis;
    resource_radar: ResourceRadarItem[];
    creative_sparks: CreativeSpark[];
}

export interface GoalProgress {
    commentary: string;
    goals: {
        text: string;
        progress_percentage: number;
        aligned_tasks: string[];
    }[];
}

export interface HealthAndPerformance {
    commentary: string;
    metrics: {
        metric: string; // e.g., "Total Workouts", "Avg. Sleep"
        value: string;
    }[];
}

export interface LearningSynthesis {
    commentary: string;
    connections: {
        concept_A: string;
        concept_B: string;
        novel_idea: string;
    }[];
}

export interface ResourceRadarItem {
    title: string;
    url: string;
    relevance_summary: string;
}

export interface CreativeSpark {
    idea: string;
    rationale: string;
}


export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    attachment?: {
        base64: string;
        mimeType: string;
    };
}

export interface SearchResult {
    text: string;
    sources: { title: string; uri: string }[];
}

export interface SearchHistoryItem {
    id: number;
    query: string;
    result: SearchResult;
}

export interface VisionHistoryItem {
    id: number;
    prompt: string;
    imageUrl: string; // Use data URL for local display
    result: string;
}

export type GoalTerm = 'short' | 'mid' | 'long';

export interface Goal {
    id: number;
    term: GoalTerm;
    text: string;
    status: 'active' | 'completed';
}

export type FormatOptions = {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    heading?: 1 | 2 | 3 | 4 | 5 | 6;
    bulletList?: boolean;
    orderedList?: boolean;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontFamily?: string;
    color?: string;
};

export interface PraxisPointLog {
    id: number;
    reason: string;
    points: number;
    timestamp: Date;
}

export interface MindMapNode {
    id: string;
    label: string;
    type: 'goal' | 'task' | 'note' | 'root';
    x: number;
    y: number;
}

export interface MindMapEdge {
    from: string;
    to: string;
}

export interface HealthData {
    totalWorkouts: number;
    totalWorkoutMinutes: number;
    workoutTypes: Record<string, number>; // e.g., { "Running": 60, "Boxing": 45 }
    avgSleepHours: number; // Simulated
    sleepQuality: 'poor' | 'fair' | 'good'; // New simulated metric
    energyLevel: 'low' | 'medium' | 'high'; // New simulated metric
}

export type Screen = 'Dashboard' | 'Schedule' | 'Notes' | 'KikoAI' | 'Profile' | 'Rewards' | 'Projects';

// New types for Weather Widgets
export type WeatherIconType = 'sun' | 'cloud' | 'rain' | 'cloud-sun' | 'cloud-rain' | 'wind' | 'snow' | 'thunderstorm';

export interface WeatherData {
    location: string;
    humidity: number;
    wind: string;
    high: number;
    low: number;
    current: number;
    currentIcon: WeatherIconType;
    hourly: {
        time: string;
        temp: number;
        icon: WeatherIconType;
    }[];
}

// --- NEW MISSION CONTROL BRIEFING ---
export interface BriefingMetric {
    label: string;
    value: string;
    change?: string; // e.g., "+5%"
    changeType?: 'positive' | 'negative';
    icon: string; 
}

export interface BriefingChartDataPoint {
    name: string; // e.g., 'Mon', 'Tue' or 'Learning', 'Workout'
    value: number;
    fill: string; // Hex color for the chart
}

// Data for the new health ring chart
export interface HealthRingMetric {
    name: 'Activity' | 'Energy' | 'Sleep';
    value: number; // 0-100
    fill: string;
}

export interface MissionBriefing {
    title: string; // e.g., "Today's Mission"
    summary: string;
    metrics: BriefingMetric[];
    healthRings: HealthRingMetric[]; // For the new multi-ring health chart
    focusBreakdown: BriefingChartDataPoint[]; // For a pie/radial chart
    activityTrend: BriefingChartDataPoint[]; // For a bar/line chart
    commentary: string; // AI-driven commentary on the charts
    // FIX: Changed from Record<string, string> to a structured array to avoid API schema errors.
    categoryAnalysis: { category: string; analysis: string; }[];
}


export interface ProjectStatusReport {
    summary: string;
    progress_percentage: number;
    risks_and_blockers: string[];
    key_decisions: string[];
    suggested_next_steps: string[];
}