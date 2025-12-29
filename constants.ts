// constants.ts
import { Category, MissionBriefing, RewardItem } from './types';

export const LEARNING_MULTIPLIER = 1.25;

export const DEFAULT_CATEGORIES: Category[] = [
    'Prototyping',
    'Learning',
    'Meeting',
    'Workout',
    'Editing',
    'Personal',
    'Admin',
    'Deep Work'
];

export const CATEGORY_COLORS: Record<Category, string> = {
    'Prototyping': '#A855F7', // purple-500
    'Learning': '#3B82F6', // blue-500
    'Meeting': '#F59E0B', // amber-500
    'Workout': '#EC4899', // pink-500
    'Editing': '#10B981', // emerald-500
    'Personal': '#6366F1', // indigo-500
    'Admin': '#84CC16', // lime-500
    'Deep Work': '#0EA5E9' // sky-500
};

export const PRESET_COLORS = [
    '#A855F7', '#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#6366F1', '#84CC16', '#0EA5E9', // Original
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#D946EF', '#F43F5E' // Added
];


export const getCategoryColor = (category: Category): string => {
    return CATEGORY_COLORS[category] || '#6B7280'; // gray-500
};

export const REWARDS_CATALOG: RewardItem[] = [
    {
        id: 'theme-obsidian',
        name: 'Obsidian Flow',
        description: 'A dark, sleek theme inspired by deep focus and minimal aesthetics.',
        cost: 0,
        type: 'theme',
        value: 'obsidian',
        colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
    },
    {
        id: 'theme-synthwave',
        name: 'Synthwave Sunset',
        description: 'Ride the retro-futuristic wave with neon glows and dusky gradients.',
        cost: 150,
        type: 'theme',
        value: 'synthwave',
        colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444']
    },
    {
        id: 'theme-solarpunk',
        name: 'Solarpunk Dawn',
        description: 'An optimistic, bright theme with natural colors and clean lines.',
        cost: 150,
        type: 'theme',
        value: 'solarpunk',
        colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981']
    },
    {
        id: 'theme-luxe',
        name: 'Luxe Marble',
        description: 'An elegant, high-contrast theme with gold accents and a touch of class.',
        cost: 250,
        type: 'theme',
        value: 'luxe',
        colors: ['#fde047', '#eab308', '#f59e0b', '#d97706']
    },
    {
        id: 'theme-aurelian',
        name: 'Aurelian Gold',
        description: 'A luxurious theme with a rich, golden accent for a premium feel.',
        cost: 300,
        type: 'theme',
        value: 'aurelian',
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
    },
    {
        id: 'theme-crimson',
        name: 'Crimson Fury',
        description: 'A bold, energetic theme with a powerful red accent for high-impact focus.',
        cost: 200,
        type: 'theme',
        value: 'crimson',
        colors: ['#f87171', '#dc2626', '#b91c1c', '#991b1b']
    },
    {
        id: 'theme-oceanic',
        name: 'Oceanic Depth',
        description: 'A calm, cool theme with a deep blue accent, perfect for focused work.',
        cost: 200,
        type: 'theme',
        value: 'oceanic',
        colors: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1']
    },
    // New Focus Backgrounds
    {
        id: 'focus-synthwave',
        name: 'Synthwave Sunset',
        description: 'A vibrant, retro-futuristic animated background for deep focus sessions.',
        cost: 100,
        type: 'focus_background',
        value: 'synthwave',
        colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444']
    },
    {
        id: 'focus-lofi',
        name: 'Lofi Rain',
        description: 'A calming, atmospheric background for relaxed and steady work.',
        cost: 100,
        type: 'focus_background',
        value: 'lofi',
        colors: ['#4f46e5', '#1e293b', '#334155', '#475569']
    },
    {
        id: 'focus-solarpunk',
        name: 'Solarpunk Garden',
        description: 'An optimistic and bright animated background for creative work.',
        cost: 150,
        type: 'focus_background',
        value: 'solarpunk',
        colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981']
    }
];

/**
 * Get theme colors from REWARDS_CATALOG
 */
export const getThemeColors = (themeValue: string): string[] => {
    const theme = REWARDS_CATALOG.find(r => r.type === 'theme' && r.value === themeValue);
    return theme?.colors || ['#667eea', '#764ba2', '#f093fb', '#f5576c']; // Default obsidian colors
};

/**
 * Get focus background colors from REWARDS_CATALOG
 */
export const getFocusBackgroundColors = (bgValue: string): string[] => {
    const bg = REWARDS_CATALOG.find(r => r.type === 'focus_background' && r.value === bgValue);
    return bg?.colors || ['#EC4899', '#7c3aed', '#f97316', '#ef4444']; // Default synthwave colors
};


export const MOCKED_BRIEFING: MissionBriefing = {
  title: "Connecting to Soen...",
  summary: "Stand by, syncing with Mira to generate your daily intelligence report. Displaying last known data.",
  metrics: [
    { label: "Flow Earned", value: "120", icon: "SparklesIcon" },
    { label: "Tasks Done", value: "3/5", icon: "CheckCircleIcon" },
    { label: "Focus", value: "75%", icon: "BrainCircuitIcon" },
    { label: "Streak", value: "🔥 4", icon: "FireIcon" },
  ],
  healthRings: [
    { name: 'Activity', value: 75, fill: '#EC4899' },
    { name: 'Energy', value: 85, fill: '#F59E0B' },
    { name: 'Sleep', value: 90, fill: '#3B82F6' },
  ],
  focusBreakdown: [
    { name: 'Prototyping', value: 180, fill: '#A855F7' },
    { name: 'Learning', value: 120, fill: '#3B82F6' },
    { name: 'Meeting', value: 60, fill: '#F59E0B' },
  ],
  activityTrend: [
      { name: 'Mon', value: 3, fill: 'var(--color-accent)' },
      { name: 'Tue', value: 5, fill: 'var(--color-accent)' },
      { name: 'Wed', value: 4, fill: 'var(--color-accent)' },
      { name: 'Thu', value: 6, fill: 'var(--color-accent)' },
      { name: 'Fri', value: 3, fill: 'var(--color-accent)' },
      { name: 'Sat', value: 2, fill: 'var(--color-accent)' },
      { name: 'Sun', value: 0, fill: 'var(--color-accent)' },
  ],
  commentary: "AI is offline. Your top priority is to re-establish connection to unlock strategic insights.",
  categoryAnalysis: [
      { category: 'Prototyping', analysis: "Focus on core feature development." },
      { category: 'Learning', analysis: "Review recent notes for new opportunities." },
      { category: 'Meeting', analysis: "Prepare agendas for maximum efficiency." },
  ],
};