// types.ts

export type Screen = 'Dashboard' | 'Schedule' | 'Notes' | 'Profile' | 'Kiko' | 'Settings' | 'Rewards' | 'Projects' | 'Focus';

export type Category = 'Workout' | 'Learning' | 'Meeting' | 'Prototyping' | 'Editing' | 'Personal' | 'Admin' | 'Deep Work';

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface Task {
  id: number;
  title: string;
  category: Category;
  startTime: string;
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  status: TaskStatus;
  notes?: string;
  projectId?: number;
  notebookId?: number;
  // FIX: Add linkedNoteId to allow tasks to be associated with a specific note.
  linkedNoteId?: number;
  isVirtual?: boolean;
  location?: string;
  linkedUrl?: string;
  referenceUrl?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  googleCalendarEventId?: string;
  insights?: ActionableInsight | null;
  isGeneratingInsights?: boolean;
  completionImageUrl?: string;
  completionSummary?: CompletionSummary;
  recipeQuery?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number; // Percentage 0-100
}

export interface CompletionSummary {
  newTitle: string;
  shortInsight: string;
}

export interface Notebook {
  id: number;
  title: string;
  color: string;
}

export interface NoteAttachment {
    id: string;
    type: 'image' | 'pdf';
    name: string;
    url: string; // data URL
    // For interactive elements
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface Note {
  id: number;
  notebookId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  flagged: boolean;
  tags: string[];
  attachments?: NoteAttachment[];
  deletedAt?: Date;
}

export interface Insight {
    id: number;
    source: string;
    insightText: string;
    points: number;
    applied: boolean;
}

export interface ActionItem {
  title: string;
  completed: boolean;
}

export interface TaskPrep {
  action_plan: string[];
  key_takeaways: string[];
  inquiry_prompts: string[];
  related_links: { title: string; url: string }[];
}

export type GoalTerm = 'short' | 'mid' | 'long';
export interface Goal {
    id: number;
    term: GoalTerm;
    text: string;
    status: 'active' | 'completed' | 'archived';
}

export interface Project {
  id: number;
  title: string;
  description: string;
  noteIds?: number[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    attachment?: {
        base64: string;
        mimeType: string;
    };
}

// FIX: Add a new type for Chat History to support multiple chat sessions.
export interface ChatSession {
    id: number;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
}


export interface SearchResult {
    text: string;
    sources: { title: string; uri: string }[];
}

export interface SearchHistoryItem {
    id: number;
    query: string;
    timestamp: Date;
    results: SearchResult;
}

export interface VisionHistoryItem {
    id: number;
    prompt: string;
    imageUrl: string;
    timestamp: Date;
    analysis: string;
}

export interface HealthData {
    totalWorkouts: number;
    totalWorkoutMinutes: number;
    workoutTypes: { [type: string]: number };
    avgSleepHours: number;
    sleepQuality: 'poor' | 'fair' | 'good';
    energyLevel: 'low' | 'medium' | 'high';
}

export interface ProjectStatusReport {
    summary: string;
    progress_percentage: number;
    risks_and_blockers: string[];
    key_decisions: string[];
    suggested_next_steps: string[];
}

// For AI Widgets
export interface KeyMetricWidget {
    type: 'metric';
    title: string;
    value: number;
    unit: string;
    icon: string;
    color: string;
}

export interface TextWidget {
    type: 'text';
    title: string;
    icon: string;
    content: string;
    links?: { title: string; url: string }[];
}

export interface ChartWidget {
    type: 'bar' | 'line';
    title: string;
    data: { name: string; value: number; fill: string }[];
    commentary: string;
}

export interface AreaChartWidget {
    type: 'area';
    title: string;
    data: { name: string; value: number }[];
    stroke: string;
    commentary: string;
}

export interface RadialChartWidget {
    type: 'radial';
    title: string;
    value: number; // percentage
    label: string;
    color: string;
}

export interface MapWidget {
    type: 'map';
    title: string;
    locationQuery: string;
    embedUrl: string;
}

export interface GeneratedImageWidget {
    type: 'generated_image';
    title: string;
    prompt: string;
    imageUrl: string;
}

export interface WeatherWidget {
    type: 'weather';
    title: string;
    location: string;
    currentTemp: number;
    conditionIcon: string;
    hourlyForecast: { time: string; temp: number; icon: string }[];
}

export interface RecipeWidget {
    type: 'recipe';
    name: string;
    sourceUrl: string;
    imageUrl: string;
    ingredients: string[];
    quick_instructions: string;
}

export type InsightWidgetData = KeyMetricWidget | TextWidget | ChartWidget | AreaChartWidget | RadialChartWidget | MapWidget | GeneratedImageWidget | WeatherWidget | RecipeWidget;

export interface ActionableInsight {
    widgets: InsightWidgetData[];
}

// Other complex types
export interface StrategicBriefing {
  title: string;
  summary: string;
  keyInsights: string[];
  suggestedActions: string[];
}

export interface MindMapNode {
    id: string;
    type: string;
    data: { label: string };
    position: { x: number; y: number };
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
}

export interface MissionBriefing {
    title: string;
    summary: string;
    metrics: { label: string, value: string, icon: string }[];
    healthRings: HealthRingMetric[];
    focusBreakdown: { name: string, value: number, fill: string }[];
    activityTrend: { name: string, value: number, fill: string }[];
    commentary: string;
    categoryAnalysis: { category: string; analysis: string }[];
}

export interface HealthRingMetric {
    name: 'Activity' | 'Energy' | 'Sleep';
    value: number;
    fill: string;
}

export interface RewardItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'theme' | 'feature' | 'focus_background';
    value: string;
}

export type ScheduleView = 'today' | 'month';
export type NoteView = 'grid' | 'list' | 'board';