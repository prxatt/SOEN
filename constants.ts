import { Task, TaskStatus, Note, PortfolioItem, Notebook, Insight, Goal, RewardItem, Project, Category } from './types';

// FIX: Convert to a constant array of strings to support custom categories.
export const DEFAULT_CATEGORIES: Category[] = [
  'Learning', 'Editing', 'Workout', 'Meeting', 'Prototyping'
];

export const CATEGORY_HEX_COLORS: Record<Category, string> = {
  'Learning': '#3b82f6', // blue-500
  'Editing': '#a855f7',   // purple-500 (accent)
  'Workout': '#ec4899',   // pink-500
  'Meeting': '#f59e0b',   // amber-500
  'Prototyping': '#22c55e', // green-500
};

// Function to get a color for a category, generating one for custom categories
export const getCategoryColor = (category: Category): string => {
  if (CATEGORY_HEX_COLORS[category]) {
    return CATEGORY_HEX_COLORS[category];
  }
  // Simple hash function to generate a color for new categories
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - color.length)}${color}`;
};


export const MOCKED_NOTEBOOKS: Notebook[] = [
    { id: 1, title: 'AI for Everyone', color: '#3b82f6' },
    { id: 2, title: 'Prompt Engineering Study', color: '#a855f7' },
    { id: 3, title: 'General', color: '#6B7280' },
    { id: 4, title: 'Business & Proposals', color: '#22c55e'},
    { id: 5, title: 'Daily Briefings', color: '#f59e0b'},
];

const TODAY = new Date();
const YESTERDAY = new Date(new Date().setDate(TODAY.getDate() - 1));

export const MOCKED_TASKS: Task[] = [
  // Today's Tasks
  { id: 1, title: 'Runna: 5k Tempo Run', category: 'Workout', startTime: new Date(TODAY.setHours(7, 0, 0, 0)), plannedDuration: 45, status: TaskStatus.Pending },
  { id: 2, title: 'Team Sync', category: 'Meeting', startTime: new Date(TODAY.setHours(9, 0, 0, 0)), plannedDuration: 30, status: TaskStatus.Pending },
  { id: 3, title: 'AI for Everyone - Week 2', category: 'Learning', startTime: new Date(TODAY.setHours(10, 30, 0, 0)), plannedDuration: 60, status: TaskStatus.Pending, notebookId: 1, isVirtual: true, linkedUrl: 'https://www.coursera.org/' },
  { id: 4, title: 'Digital Drip Photo Editing', category: 'Editing', startTime: new Date(TODAY.setHours(13, 30, 0, 0)), plannedDuration: 180, notebookId: 3, status: TaskStatus.Pending },
  { id: 6, title: 'App Monetization Strategy Prototype', category: 'Prototyping', startTime: new Date(TODAY.setHours(19, 30, 0, 0)), plannedDuration: 120, status: TaskStatus.Pending, notebookId: 3 },
  // Yesterday's Tasks
  { id: 5, title: 'Prompt Engineering Study', category: 'Learning', startTime: new Date(YESTERDAY.setHours(17, 0, 0, 0)), plannedDuration: 60, status: TaskStatus.Completed, notebookId: 2, actualDuration: 70 },
  { id: 7, title: 'Boxing: Heavy Bag Drills', category: 'Workout', startTime: new Date(YESTERDAY.setHours(7, 0, 0, 0)), plannedDuration: 60, status: TaskStatus.Completed, actualDuration: 60 },
  { id: 8, title: 'Sleep', category: 'Workout', startTime: new Date(YESTERDAY.setHours(23, 0, 0, 0)), plannedDuration: 450, status: TaskStatus.Completed, actualDuration: 420 }, // 7 hours sleep
];


export const MOCKED_NOTES: Note[] = [
    { id: 1, notebookId: 1, title: 'Key Takeaways Module 1', content: '<h1>AI Terminology</h1><p>AI terminology is key. Supervised vs. Unsupervised learning. Need to think about what data Surface Tension has. Neural networks are composed of layers of nodes.</p>', createdAt: new Date(), archived: false, flagged: false, tags: ['ai', 'learning'] },
    { id: 2, notebookId: 3, title: 'Venue Research - Spring 2026', content: '<h2>Top Contenders</h2><ol><li>The Glasshouse</li><li>The 1896</li><li>Knockdown Center</li></ol><p>Need to check availability and pricing for all three.</p>', createdAt: new Date(), archived: false, flagged: true, tags: ['events', 'venues'] },
    { id: 3, notebookId: 2, title: 'Advanced Prompting Techniques', content: '<h2>Chain of Thought</h2><p><b>Chain of thought</b> prompting seems powerful. Could use it for generating event concepts. The basic idea is to ask the model to "think step-by-step" to break down complex problems. Example: "Act as a creative director for a luxury brand..."</p>', createdAt: new Date(), archived: false, flagged: false, tags: ['gemini', 'prompting'] },
    { id: 4, notebookId: 4, title: 'Case Study: Digital Drip 0.1', content: '<h2>Project</h2><p>Digital Drip 0.1</p><h2>Client</h2><p>Surface Tension (Internal)</p><h2>Challenge</h2><p>Create a multi-sensory event blending underground music with high-fashion aesthetics.</p><h2>Solution</h2><p>Full creative direction, production, and post-event media management. Integrated real-time visuals with DJ sets.</p><h2>Outcome</h2><p>Sold-out event, significant social media engagement, and features in several online magazines.</p>', createdAt: new Date(), archived: false, flagged: false, tags: ['casestudy', 'event'], thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd51622?q=80&w=2080&auto=format&fit=crop' },
];

export const MOCKED_PROJECTS: Project[] = [
    { id: 1, title: "Praxis App Prototype", description: "Develop the core features for the Praxis AI productivity application." },
    { id: 2, title: "Digital Drip 0.2", description: "Plan and execute the next iteration of the Digital Drip event series." },
    { id: 3, title: "Surface Tension Brand Growth", description: "Strategic initiatives to grow brand presence and audience engagement in 2025." },
];


export const MOCKED_INSIGHTS: Insight[] = [
    { id: 1, source: "AI for Everyone", insightText: 'Use AI to auto-tag your event photos for faster discovery.', applied: false, points: 10 },
    { id: 2, source: "Prompt Engineering Study", insightText: 'Build a DJ set analyzer with advanced prompting to understand crowd engagement.', applied: false, points: 15 },
];

export const MOCKED_GOALS: Goal[] = [
    { id: 1, term: 'long', text: 'Launch a new direct-to-consumer digital product line for Surface Tension by 2026.', status: 'active' },
    { id: 2, term: 'mid', text: 'Prototype an app for young people that is fun, trendy, relevant, and addictive with lots of incentives for in-app purchases.', status: 'active'},
    { id: 3, term: 'mid', text: 'Grow the Surface Tension social media presence by 50% in the next 12 months.', status: 'active' },
    { id: 4, term: 'short', text: 'Complete post-production for Digital Drip 0.1 and create a promotional video.', status: 'active' },
];

export const LEARNING_MULTIPLIER = 2.5;

export const REWARDS_CATALOG: RewardItem[] = [
    {
        id: 'theme-solaris',
        type: 'theme',
        name: 'Solaris',
        description: 'A warm, energetic orange theme.',
        cost: 250,
        value: 'solaris'
    },
    {
        id: 'theme-crimson',
        type: 'theme',
        name: 'Crimson',
        description: 'A bold, powerful red theme for high-impact work.',
        cost: 250,
        value: 'crimson'
    },
    {
        id: 'theme-oceanic',
        type: 'theme',
        name: 'Oceanic',
        description: 'A calm, focused blue to help you find your flow.',
        cost: 250,
        value: 'oceanic'
    },
];