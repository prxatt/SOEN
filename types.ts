// types.ts

export type Screen = 'Dashboard' | 'Schedule' | 'Notes' | 'Profile' | 'Mira' | 'Settings' | 'Rewards' | 'Projects' | 'Focus' | 'Notifications';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
}

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
  notion_page_id?: string;
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
    stepsToday?: number;
    heartRate?: number;
    caloriesBurned?: number;
    // Additional health metrics for dashboard
    steps?: number;
    sleep?: number;
    water?: number;
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
    colors?: string[]; // Color array for theme/focus background previews
}

export type ScheduleView = 'today' | 'month';
export type NoteView = 'grid' | 'list' | 'board';

// Notion Integration Types
export interface NotionIntegration {
  user_id: string;
  notion_api_key: string;
  workspace_id: string;
  default_database_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotionSyncLog {
  user_id: string;
  note_id: number;
  notion_page_id?: string;
  sync_direction: 'soen_to_notion' | 'notion_to_soen';
  sync_status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at: Date;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}

export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  children?: NotionBlock[];
}

export interface NotionBlock {
  type: string;
  [key: string]: any;
}

// Voice Conversation Types
export interface MiraAnimationState {
  current: 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error';
  emotion: 'neutral' | 'happy' | 'focused' | 'encouraging' | 'serious' | 'playful';
  mouthMovement?: {
    openness: number; // 0-1
    shape: 'o' | 'a' | 'ee' | 'closed';
  };
}

export interface TranscriptionLine {
  role: 'user' | 'mira';
  text: string;
  timestamp: number;
  confidence: number;
  isPartial: boolean;
}

export interface VoiceSession {
  id: string;
  userId: string;
  isActive: boolean;
  miraAnimationState: MiraAnimationState;
  transcription: TranscriptionLine[];
  createdAt: Date;
  endedAt?: Date;
}

export interface ExtractedEventData {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  contactInfo?: string;
  links?: string[];
  confidence: number;
}

// Gmail Integration Types
export interface GmailEvent {
  messageId: string;
  subject: string;
  sender: string;
  receivedAt: Date;
  bodySnippet: string;
  fullBody: string;
}

export interface GmailExtractedEventData {
  eventDetected: boolean;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  duration?: number;
  confidence: number;
  extractedDetails: any;
}

export interface GmailIntegration {
  user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: Date;
  gmail_watch_expiration?: Date;
  gmail_history_id?: string;
  watch_labels: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GmailParsedEvent {
  user_id: string;
  gmail_message_id: string;
  subject: string;
  sender: string;
  received_at: Date;
  email_body_snippet: string;
  event_detected: boolean;
  event_title?: string;
  event_date?: Date;
  event_location?: string;
  event_confidence: number;
  extracted_details: any;
  status: 'auto_added' | 'pending' | 'confirmed' | 'rejected';
  created_at: Date;
}