import { Task, TaskStatus, Note, PortfolioItem, Notebook, Insight, Goal, RewardItem, Project, Category } from './types';

// FIX: Convert to a constant array of strings to support custom categories.
export const DEFAULT_CATEGORIES: Category[] = [
  'Learning', 'Editing', 'Workout', 'Meeting', 'Prototyping', 'Personal', 'Cooking'
];

export const CATEGORY_HEX_COLORS: Record<Category, string> = {
  'Learning': '#3b82f6', // blue-500
  'Editing': '#a855f7',   // purple-500 (accent)
  'Workout': '#ec4899',   // pink-500
  'Meeting': '#f59e0b',   // amber-500
  'Prototyping': '#22c55e', // green-500
  'Personal': '#6b7280', // gray-500
  'Cooking': '#f97316', // orange-500
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

// --- PROGRAMMATIC DATA GENERATION FOR A FULL MONTH ---

const generateMonthlyData = () => {
    const tasks: Task[] = [];
    const notes: Note[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const taskTemplates = [
        { title: 'Runna: 5k Tempo Run', category: 'Workout' as Category, hour: 7, duration: 45 },
        { title: 'Team Sync', category: 'Meeting' as Category, hour: 9, duration: 30 },
        { title: 'AI for Everyone - Week [WEEK]', category: 'Learning' as Category, hour: 10, duration: 90, notebookId: 1 },
        { title: 'Digital Drip Photo Editing', category: 'Editing' as Category, hour: 13, duration: 180, notebookId: 3 },
        { title: 'App Monetization Strategy', category: 'Prototyping' as Category, hour: 19, duration: 120, notebookId: 4 },
        { title: 'Boxing: Heavy Bag Drills', category: 'Workout' as Category, hour: 7, duration: 60 },
        { title: 'Client Call: Project Phoenix', category: 'Meeting' as Category, hour: 11, duration: 45 },
        { title: 'Cook Dinner: Tofu Curry', category: 'Cooking' as Category, hour: 18, duration: 45, recipeQuery: 'Tofu Curry for two' },
        { title: 'Groceries at Whole Foods', category: 'Personal' as Category, hour: 17, duration: 60, location: 'Whole Foods Market, 2001 Market St, San Francisco, CA' },
    ];
    
    let noteIdCounter = 1;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

        // Add 2-4 tasks per day
        const tasksForDayCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < tasksForDayCount; i++) {
            const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
            const startTime = new Date(date);
            startTime.setHours(template.hour, Math.random() > 0.5 ? 30 : 0, 0, 0);

            // Determine status
            let status = TaskStatus.Pending;
            if (date < today) {
                status = Math.random() > 0.1 ? TaskStatus.Completed : TaskStatus.Pending; // 90% chance of completion for past tasks
            } else if (date.getDate() === today.getDate()) {
                status = startTime < today ? TaskStatus.Completed : TaskStatus.Pending;
            }

            tasks.push({
                id: (day * 100) + i,
                // FIX: Convert number to string for String.prototype.replace
                title: template.title.replace('[WEEK]', (Math.floor(day / 7) + 1).toString()),
                category: template.category,
                startTime,
                plannedDuration: template.duration,
                status,
                actualDuration: status === TaskStatus.Completed ? template.duration + Math.floor(Math.random() * 20 - 10) : undefined,
                notebookId: template.notebookId,
                location: template.location,
                recipeQuery: template.recipeQuery
            });
        }
        
        // Add a note every few days
        if (day % 3 === 0) {
             notes.push({
                id: noteIdCounter++,
                notebookId: (day % 5) + 1, // Cycle through notebooks
                title: `Reflections for ${date.toLocaleDateString()}`,
                content: `<p>This is a note about the activities and thoughts from day ${day}. The focus was mainly on prototyping and learning about new AI models.</p>`,
                createdAt: date,
                archived: false,
                flagged: Math.random() > 0.8, // 20% chance of being flagged
                tags: ['daily', 'reflection']
            });
        }
    }
    
    // Add some core notes for context
    notes.push(
        { id: 1001, notebookId: 1, title: 'Key Takeaways Module 1', content: '<h1>AI Terminology</h1><p>AI terminology is key. Supervised vs. Unsupervised learning. Need to think about what data Surface Tension has. Neural networks are composed of layers of nodes.</p>', createdAt: new Date(year, month, 2), archived: false, flagged: false, tags: ['ai', 'learning'] },
        { id: 1002, notebookId: 2, title: 'Advanced Prompting Techniques', content: '<h2>Chain of Thought</h2><p><b>Chain of thought</b> prompting seems powerful. Could use it for generating event concepts. The basic idea is to ask the model to "think step-by-step" to break down complex problems. Example: "Act as a creative director for a luxury brand..."</p>', createdAt: new Date(year, month, 5), archived: false, flagged: true, tags: ['gemini', 'prompting'] },
        { id: 1003, notebookId: 4, title: 'Case Study: Digital Drip 0.1', content: '<h2>Project</h2><p>Digital Drip 0.1</p><h2>Client</h2><p>Surface Tension (Internal)</p><h2>Challenge</h2><p>Create a multi-sensory event blending underground music with high-fashion aesthetics.</p><h2>Solution</h2><p>Full creative direction, production, and post-event media management. Integrated real-time visuals with DJ sets.</p><h2>Outcome</h2><p>Sold-out event, significant social media engagement, and features in several online magazines.</p>', createdAt: new Date(year, month, 8), archived: false, flagged: false, tags: ['casestudy', 'event'], thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd51622?q=80&w=2080&auto=format&fit=crop' }
    );
    
    return { tasks, notes };
};

const { tasks, notes } = generateMonthlyData();
export const MOCKED_TASKS = tasks;
export const MOCKED_NOTES = notes;

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