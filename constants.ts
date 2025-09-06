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
        value: 'obsidian'
    },
    {
        id: 'theme-synthwave',
        name: 'Synthwave Sunset',
        description: 'Ride the retro-futuristic wave with neon glows and dusky gradients.',
        cost: 150,
        type: 'theme',
        value: 'synthwave'
    },
    {
        id: 'theme-solarpunk',
        name: 'Solarpunk Dawn',
        description: 'An optimistic, bright theme with natural colors and clean lines.',
        cost: 150,
        type: 'theme',
        value: 'solarpunk'
    },
    {
        id: 'theme-luxe',
        name: 'Luxe Marble',
        description: 'An elegant, high-contrast theme with gold accents and a touch of class.',
        cost: 250,
        type: 'theme',
        value: 'luxe'
    },
    {
        id: 'theme-aurelian',
        name: 'Aurelian Gold',
        description: 'A luxurious theme with a rich, golden accent for a premium feel.',
        cost: 300,
        type: 'theme',
        value: 'aurelian'
    },
    {
        id: 'theme-crimson',
        name: 'Crimson Fury',
        description: 'A bold, energetic theme with a powerful red accent for high-impact focus.',
        cost: 200,
        type: 'theme',
        value: 'crimson'
    },
    {
        id: 'theme-oceanic',
        name: 'Oceanic Depth',
        description: 'A calm, cool theme with a deep blue accent, perfect for focused work.',
        cost: 200,
        type: 'theme',
        value: 'oceanic'
    }
];


export const MOCKED_BRIEFING: MissionBriefing = {
  title: "Connecting to Praxis AI...",
  summary: "Stand by, syncing with Kiko to generate your daily intelligence report. Displaying last known data.",
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