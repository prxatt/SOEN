// AI Service Types and Schemas for Praxis-AI
import { z } from 'zod';

// Chat message schemas
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.object({
    model: z.string().optional(),
    tokens: z.number().optional(),
    cost: z.number().optional(),
  }).optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
});

// AI Service configuration
export const AIServiceConfigSchema = z.object({
  grok: z.object({
    apiKey: z.string(),
    model: z.string().default('grok-beta'),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
  }),
  gemini: z.object({
    apiKey: z.string(),
    model: z.string().default('gemini-pro'),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
  }),
  openai: z.object({
    apiKey: z.string(),
    model: z.string().default('gpt-4'),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
  }),
});

// AI Request schemas
export const AIRequestSchema = z.object({
  prompt: z.string(),
  context: z.string().optional(),
  model: z.enum(['grok', 'gemini', 'openai']).default('grok'),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  stream: z.boolean().default(false),
});

export const AIResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  tokens: z.number(),
  cost: z.number(),
  timestamp: z.date(),
});

// Strategic Briefing schemas
export const StrategicBriefingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  summary: z.string(),
  keyInsights: z.array(z.string()),
  suggestedActions: z.array(z.string()),
  generatedAt: z.date(),
  dataSource: z.enum(['tasks', 'notes', 'health', 'projects', 'all']),
});

// Mind Map schemas
export const MindMapNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    label: z.string(),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const MindMapEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
});

export const MindMapSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  nodes: z.array(MindMapNodeSchema),
  edges: z.array(MindMapEdgeSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Notes and AI processing schemas
export const NoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  notebookId: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'pdf', 'link']),
    name: z.string(),
    url: z.string(),
  })),
  aiSummary: z.string().optional(),
  actionItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

// Project management schemas
export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['active', 'completed', 'archived', 'paused']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  color: z.string(),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  progress: z.number().min(0).max(100),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Health data schemas
export const HealthDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  steps: z.number(),
  sleep: z.number(),
  water: z.number(),
  heartRate: z.number().optional(),
  caloriesBurned: z.number().optional(),
  workouts: z.array(z.object({
    id: z.string(),
    type: z.string(),
    duration: z.number(),
    calories: z.number(),
  })),
  mood: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
});

// Gamification schemas
export const PraxisPointsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  points: z.number(),
  source: z.enum(['task_completion', 'note_creation', 'insight_generation', 'streak_maintenance', 'achievement']),
  description: z.string(),
  earnedAt: z.date(),
});

export const AchievementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number(),
  unlockedAt: z.date(),
  category: z.enum(['productivity', 'health', 'learning', 'streak', 'milestone']),
});

// Theme management schemas
export const ThemeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  isActive: z.boolean(),
  isCustom: z.boolean(),
  createdAt: z.date(),
});

// Search and exploration schemas
export const SearchQuerySchema = z.object({
  id: z.string(),
  userId: z.string(),
  query: z.string(),
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    source: z.string(),
  })),
  timestamp: z.date(),
});

export const ImageAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  prompt: z.string(),
  analysis: z.string(),
  tags: z.array(z.string()),
  timestamp: z.date(),
});

// Type exports
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type AIServiceConfig = z.infer<typeof AIServiceConfigSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type StrategicBriefing = z.infer<typeof StrategicBriefingSchema>;
export type MindMapNode = z.infer<typeof MindMapNodeSchema>;
export type MindMapEdge = z.infer<typeof MindMapEdgeSchema>;
export type MindMap = z.infer<typeof MindMapSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type HealthData = z.infer<typeof HealthDataSchema>;
export type PraxisPoints = z.infer<typeof PraxisPointsSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

// Additional types for enhanced services
export interface Goal {
  id: string;
  text: string;
  term: 'short' | 'mid' | 'long';
  status: 'active' | 'completed' | 'paused';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  progress?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MindMapData {
  nodes: any[];
  edges: any[];
  themes: any[];
  opportunities: any[];
  metadata: any;
}

export interface StrategicBriefingData {
  title: string;
  summary: string;
  keyInsights: string[];
  suggestedActions: string[];
  healthRecommendations?: string[];
  learningOpportunities?: string[];
  productivityTips?: string[];
  goalProgress?: any;
  healthSynthesis?: any;
  generatedAt: string;
  config?: any;
}

export interface UserContext {
  userId: string;
  goals: Goal[];
  recentTasks: Task[];
  healthData: any[];
  calendarData: any[];
  notes: Note[];
  learningData: any[];
  productivityMetrics: any;
}

export interface ConversationContext {
  goals?: Goal[];
  recentActivities?: any[];
  healthStatus?: any;
  learningFocus?: any[];
}

export interface NoteInsights {
  themes: string[];
  actionItems: any[];
  proposals: any[];
  connections: any[];
  knowledgeGaps: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  complexityScore: number;
  insights: string[];
}
