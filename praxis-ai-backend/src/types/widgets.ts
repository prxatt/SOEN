// Widget Types for Praxis-AI Dashboard System
import { z } from 'zod';

// Base widget schema
export const BaseWidgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schedule Widget
export const ScheduleWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('schedule'),
  data: z.object({
    view: z.enum(['today', 'week', 'month']),
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      startTime: z.string(),
      duration: z.number(),
      category: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    })),
    upcomingEvents: z.array(z.object({
      id: z.string(),
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      source: z.enum(['google_calendar', 'manual']),
    })),
  }),
});

// Calendar Widget
export const CalendarWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('calendar'),
  data: z.object({
    currentDate: z.string(),
    events: z.array(z.object({
      id: z.string(),
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean(),
      color: z.string(),
    })),
    holidays: z.array(z.object({
      name: z.string(),
      date: z.string(),
    })),
  }),
});

// Weather Widget
export const WeatherWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('weather'),
  data: z.object({
    location: z.string(),
    currentTemp: z.number(),
    condition: z.string(),
    conditionIcon: z.string(),
    hourlyForecast: z.array(z.object({
      time: z.string(),
      temp: z.number(),
      icon: z.string(),
    })),
    dailyForecast: z.array(z.object({
      date: z.string(),
      high: z.number(),
      low: z.number(),
      condition: z.string(),
      icon: z.string(),
    })),
  }),
});

// Actions Widget
export const ActionsWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('actions'),
  data: z.object({
    quickActions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      icon: z.string(),
      action: z.string(),
    })),
    recentTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completedAt: z.string(),
    })),
    suggestedActions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })),
  }),
});

// Insights Widget
export const InsightsWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('insights'),
  data: z.object({
    strategicBriefing: z.object({
      title: z.string(),
      summary: z.string(),
      keyInsights: z.array(z.string()),
      suggestedActions: z.array(z.string()),
    }),
    mindMap: z.object({
      nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        data: z.object({
          label: z.string(),
        }),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })),
      edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
      })),
    }),
    actionableInsights: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      category: z.string(),
    })),
  }),
});

// Health Widget
export const HealthWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('health'),
  data: z.object({
    metrics: z.object({
      steps: z.number(),
      sleep: z.number(),
      water: z.number(),
      heartRate: z.number().optional(),
      caloriesBurned: z.number().optional(),
    }),
    healthRings: z.array(z.object({
      name: z.enum(['Activity', 'Energy', 'Sleep']),
      value: z.number(),
      fill: z.string(),
    })),
    recentWorkouts: z.array(z.object({
      id: z.string(),
      type: z.string(),
      duration: z.number(),
      calories: z.number(),
      date: z.string(),
    })),
    sleepData: z.object({
      avgHours: z.number(),
      quality: z.enum(['poor', 'fair', 'good']),
      bedtime: z.string(),
      wakeTime: z.string(),
    }),
  }),
});

// Flow Widget (Gamification)
export const FlowWidgetSchema = BaseWidgetSchema.extend({
  type: z.literal('flow'),
  data: z.object({
    points: z.object({
      total: z.number(),
      today: z.number(),
      thisWeek: z.number(),
    }),
    streaks: z.object({
      current: z.number(),
      longest: z.number(),
      type: z.string(),
    }),
    level: z.object({
      current: z.number(),
      progress: z.number(),
      nextLevelPoints: z.number(),
    }),
    recentRewards: z.array(z.object({
      id: z.string(),
      name: z.string(),
      points: z.number(),
      earnedAt: z.string(),
    })),
    achievements: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      unlockedAt: z.string(),
    })),
  }),
});

// Union type for all widgets
export const WidgetSchema = z.discriminatedUnion('type', [
  ScheduleWidgetSchema,
  CalendarWidgetSchema,
  WeatherWidgetSchema,
  ActionsWidgetSchema,
  InsightsWidgetSchema,
  HealthWidgetSchema,
  FlowWidgetSchema,
]);

// Widget data aggregation schema
export const WidgetDataSchema = z.object({
  schedule: ScheduleWidgetSchema.shape.data,
  calendar: CalendarWidgetSchema.shape.data,
  weather: WeatherWidgetSchema.shape.data,
  actions: ActionsWidgetSchema.shape.data,
  insights: InsightsWidgetSchema.shape.data,
  health: HealthWidgetSchema.shape.data,
  flow: FlowWidgetSchema.shape.data,
});

// Type exports
export type BaseWidget = z.infer<typeof BaseWidgetSchema>;
export type ScheduleWidget = z.infer<typeof ScheduleWidgetSchema>;
export type CalendarWidget = z.infer<typeof CalendarWidgetSchema>;
export type WeatherWidget = z.infer<typeof WeatherWidgetSchema>;
export type ActionsWidget = z.infer<typeof ActionsWidgetSchema>;
export type InsightsWidget = z.infer<typeof InsightsWidgetSchema>;
export type HealthWidget = z.infer<typeof HealthWidgetSchema>;
export type FlowWidget = z.infer<typeof FlowWidgetSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetData = z.infer<typeof WidgetDataSchema>;
