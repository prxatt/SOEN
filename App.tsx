/**
 * AI/LLM MAINTENANCE NOTES - CRITICAL FOR FUTURE DEVELOPMENT:
 * 
 * 1. ERROR PREVENTION:
 *    - Always use ErrorBoundary to wrap components that might crash
 *    - Use safeGet(), safeFormatNumber(), createSafeHealthData() from utils/validation
 *    - Never access object properties directly without null checks
 *    - Always provide default values for optional properties
 * 
 * 2. AUTHENTICATION FLOW:
 *    - showPreview: Shows animated Praxis logo first (1.5s)
 *    - isLoading: Shows loading screen (1s) 
 *    - !isAuthenticated: Shows login screen
 *    - !isOnboardingComplete: Shows onboarding (only for new users)
 *    - Default: Shows main dashboard
 * 
 * 3. STATE MANAGEMENT:
 *    - All state should be initialized with safe defaults
 *    - Use createSafeHealthData() for health data initialization
 *    - Validate data before using it in components
 * 
 * 4. COMPONENT STRUCTURE:
 *    - Each major component should be wrapped in ErrorBoundary
 *    - Use safe validation functions for all data access
 *    - Add comprehensive error handling and fallbacks
 * 
 * 5. DEBUGGING:
 *    - Check browser console for errors
 *    - Use React DevTools for component inspection
 *    - Test error boundaries by intentionally breaking components
 * 
 * 6. PERFORMANCE:
 *    - Use useMemo and useCallback for expensive operations
 *    - Lazy load heavy components when possible
 *    - Optimize re-renders with proper dependency arrays
 * 
 * NEVER REMOVE THESE SAFETY MEASURES - THEY PREVENT APP CRASHES!
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Import types
// FIX: Import the new ChatSession type and remove the old ChatMessage type.
import { Screen, Task, Note, Notebook, Insight, Project, Goal, ChatSession, SearchHistoryItem, VisionHistoryItem, HealthData, TaskStatus, Category, RewardItem, CompletionSummary, ChatMessage, NotificationItem } from './types';


// Import components
import Navigation from './components/Navigation';
import Notifications from './components/Notifications';
import Dashboard from './components/Dashboard';
import UnifiedDashboard from './components/UnifiedDashboard';
import DashboardOptimized from './components/DashboardOptimized';
import DailyMode from './components/DailyMode';
import Schedule from './components/Schedule';
import Notes from './components/Notes';
import Profile from './components/Profile';
import PraxisAI from './components/PraxisAI';
import Settings from './components/Settings';
import Projects from './components/Projects';
import Rewards from './components/Rewards';
import Auth from './components/auth/Auth';
import Onboarding from './components/Onboarding';
import FocusMode from './components/FocusMode';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen'; // New Loading Screen
import PraxisPreview from './components/PraxisPreview'; // Praxis Preview Screen
import ErrorBoundary from './components/ErrorBoundary'; // Error boundary for crash prevention
import { PraxisLogo } from './components/Icons';


// Import services and utils
import { syncCalendar } from './services/googleCalendarService';
import { kikoRequest } from './services/kikoAIService';
import { createSafeHealthData, safeGet, safeFormatNumber } from './utils/validation';
import { calculateStreak, getTodaysTaskCompletion, inferHomeLocation } from './utils/taskUtils';
import { triggerHapticFeedback } from './utils/haptics';
import { MOCKED_BRIEFING, REWARDS_CATALOG, DEFAULT_CATEGORIES, CATEGORY_COLORS, PRESET_COLORS } from './constants';

// --- MOCK DATA GENERATION ---
const initialProjects: Project[] = [
    { id: 1, title: 'Praxis AI Development', description: 'Core development for the Praxis AI application.'},
    { id: 2, title: 'Surface Tension Branding', description: 'Brand identity and marketing materials.'},
];

const generateMockTasksForMonth = (year: number, month: number): Task[] => {
    const tasks: Task[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const taskTitlesByCategory: Record<Category, string[]> = {
        'Prototyping': ['Develop new feature', 'UI/UX design session', 'Fix login bug', 'Refactor database schema'],
        'Learning': ['Complete AI course module', 'Read chapter on system design', 'Watch tutorial on Framer Motion', 'Study market trends'],
        'Meeting': ['Client check-in call', 'Weekly sync with team', 'Praxis AI strategy session', 'Investor pitch prep'],
        'Workout': ['5k morning run', 'Boxing session', 'Leg day at the gym', 'Yoga and meditation'],
        'Editing': ['Edit promotional video', 'Review brand copy', 'Photo editing for lookbook', 'Finalize blog post'],
        'Personal': ['Schedule dentist appointment', 'Cook dinner: Tacos', 'Pay monthly bills', 'Call family'],
        'Admin': ['Respond to important emails', 'Organize file directory', 'Plan next week\'s schedule', 'Update project management board'],
        'Deep Work': ['Focused writing session', 'Algorithm research', 'Core architecture planning', 'Mind mapping new concept'],
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const tasksPerDay = Math.floor(Math.random() * 4) + 2; // 2-5 tasks per day

        for (let i = 0; i < tasksPerDay; i++) {
            const category = DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];
            let hour;
            // On every 3rd day, ensure the first task starts in the afternoon to test timeline scrolling
            if (day % 3 === 0 && i === 0) {
                hour = Math.floor(Math.random() * 5) + 13; // 1pm - 5pm
            } else {
                hour = Math.floor(Math.random() * 12) + 8; // 8am - 7pm
            }
            const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            const startTime = new Date(year, month, day, hour, minute);

            let status = TaskStatus.Pending;
            if (date.getTime() < today.getTime() - 86400000) { // Anything before yesterday
                status = Math.random() > 0.1 ? TaskStatus.Completed : TaskStatus.Pending;
            }
            
            const task: Task = {
                id: tasks.length + 1,
                title: taskTitlesByCategory[category][Math.floor(Math.random() * taskTitlesByCategory[category].length)],
                category,
                startTime: startTime.toISOString(),
                plannedDuration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
                status,
                priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
                progress: status === TaskStatus.Completed ? 100 : Math.random() > 0.7 ? Math.floor(Math.random() * 80) : 0,
                notes: Math.random() > 0.85 ? 'This is a detailed note about the task, requirements, and expected outcomes.' : undefined,
                projectId: (category === 'Prototyping' || category === 'Admin') && Math.random() > 0.6 ? 1 : (category === 'Editing' && Math.random() > 0.7 ? 2 : undefined),
                isVirtual: category === 'Meeting' ? Math.random() > 0.4 : false,
            };

            if (task.isVirtual) {
                task.linkedUrl = `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`;
            } else if (category === 'Meeting' && Math.random() > 0.7) {
                task.location = 'Blue Bottle Cafe, FiDi, San Francisco';
            } else if (category === 'Workout' && Math.random() > 0.5) {
                task.location = 'Equinox Gym, 747 Market St, San Francisco';
            } else if (task.category === 'Personal' && Math.random() > 0.8) {
                task.location = 'Gus\'s Community Market, San Francisco';
            }
            tasks.push(task);
        }
    }
    return tasks;
};

const initialTasks: Task[] = generateMockTasksForMonth(new Date().getFullYear(), new Date().getMonth());

// Link a mock task to a note for demonstration on the dashboard
const upcomingTaskIndex = initialTasks
    .filter(t => t.status !== TaskStatus.Completed && new Date(t.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .findIndex(t => t.id > 0); // Find the actual index in the original array

if(upcomingTaskIndex > -1) {
    const originalIndex = initialTasks.findIndex(t => t.id === initialTasks.filter(t => t.status !== TaskStatus.Completed && new Date(t.startTime) >= new Date()).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0].id);
    if (originalIndex > -1) {
        initialTasks[originalIndex].linkedNoteId = 101; // Link to "Initial Project Ideas"
        initialTasks[originalIndex].priority = 'high';
        initialTasks[originalIndex].progress = 40;
    }
}


const initialNotebooks: Notebook[] = [
    { id: 1, title: 'Quick Notes', color: '#F59E0B' },
    { id: 2, title: 'Praxis AI', color: '#A855F7' },
    { id: 3, title: 'Surface Tension', color: '#3B82F6' },
    { id: 4, title: 'Personal', color: '#10B981' },
];

const initialNotes: Note[] = [
    { id: 101, notebookId: 1, title: 'Initial Project Ideas', content: '<p>Exploring concepts for a new AI-driven productivity tool. This note should be a bit longer to test the masonry layout. The core idea is to build a system that not only tracks tasks but actively helps in formulating strategy by connecting disparate pieces of information. It could analyze notes, calendar events, and even web browsing history to suggest project directions or highlight unseen opportunities. We need to focus on a very slick and responsive UI.</p>', createdAt: new Date(), updatedAt: new Date(), flagged: true, tags: ['idea', 'ai', 'strategy'] },
    { id: 102, notebookId: 2, title: 'Brand Guidelines', content: '<p>Core principles for the Surface Tension brand...</p>', createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 86400000), flagged: false, tags: ['branding', 'design'] },
    { id: 103, notebookId: 1, title: 'Q3 Roadmap', content: '<p>Focus on API integration and the new Notes module.</p>', createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(Date.now() - 172800000), flagged: false, tags: ['planning', 'q3'] },
    { id: 104, notebookId: 3, title: 'Workout Plan', content: '<p>Monday: Chest, Tuesday: Back, Wednesday: Legs.</p>', createdAt: new Date(Date.now() - 259200000), updatedAt: new Date(Date.now() - 259200000), flagged: true, tags: ['health', 'fitness'] },
];

function App() {
    // --- STATE MANAGEMENT ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(true);
    const [activeScreen, setActiveScreen] = useState<Screen>('Dashboard');
    const [previousScreen, setPreviousScreen] = useState<Screen>('Dashboard');
    const [uiMode, setUiMode] = useState<'dark' | 'glass'>('glass');
    const [activeTheme, setActiveTheme] = useState('obsidian');
    const [toast, setToast] = useState<{ message: string; id: number; action?: { label: string; onClick: () => void; } } | null>(null);
    const [scheduleInitialDate, setScheduleInitialDate] = useState<Date | undefined>(undefined);

    // Data states
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks);
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    // FIX: Replace single chat state with chat history and active chat ID.
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([
        { id: Date.now(), title: 'Initial Chat', messages: [], createdAt: new Date() }
    ]);
    const [activeChatId, setActiveChatId] = useState<number | null>(chatHistory[0]?.id || null);
    const [isAiReplying, setIsAiReplying] = useState(false);
    const [praxisFlow, setPraxisFlow] = useState(500);
    const [purchasedRewards, setPurchasedRewards] = useState<string[]>(['theme-obsidian', 'focus-synthwave']);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [activeFocusBackground, setActiveFocusBackground] = useState<string>('synthwave');
    const [isDailyModeOpen, setIsDailyModeOpen] = useState<boolean>(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [activeNotebookId, setActiveNotebookId] = useState<number | 'all' | 'flagged' | 'trash'>('all');
    const [dailyCompletionImage, setDailyCompletionImage] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [categoryColors, setCategoryColors] = useState<Record<Category, string>>(CATEGORY_COLORS);
    const [lastDeletedNote, setLastDeletedNote] = useState<Note | null>(null);
    const [lastDeletedNotebook, setLastDeletedNotebook] = useState<(Notebook & { associatedNoteIds?: number[] }) | null>(null);
    const [lastDeletedChat, setLastDeletedChat] = useState<ChatSession | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: "1",
            title: "Welcome to Praxis AI",
            message: "Your productivity journey starts here! Kiko is ready to help you organize your day.",
            timestamp: new Date(),
            type: 'info'
        }
    ]);
    const [browserPushEnabled, setBrowserPushEnabled] = useState<boolean>(false);


    // Derived/Generated states - AI/LLM NOTE: Always use createSafeHealthData to prevent crashes
    const [healthData, setHealthData] = useState<HealthData>(createSafeHealthData({ 
        totalWorkouts: 1, 
        totalWorkoutMinutes: 28, 
        workoutTypes: { 'Running': 1 }, 
        avgSleepHours: 7.5, 
        sleepQuality: 'good', 
        energyLevel: 'high',
        stepsToday: 8500,
        heartRate: 72,
        caloriesBurned: 2100
    }));
    const [briefing, setBriefing] = useState(MOCKED_BRIEFING);
    const [isBriefingLoading, setIsBriefingLoading] = useState(true);

    const showToast = (message: string, action?: { label: string; onClick: () => void; }) => {
        setToast({ message, id: Date.now(), action });
        
        // Save to notifications store
        const notification: NotificationItem = {
            id: `toast-${Date.now()}`,
            title: 'Praxis Update',
            message,
            timestamp: new Date(),
            type: 'info',
            action
        };
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
        
        // Send browser push notification if enabled
        if (browserPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Praxis AI', { body: message, icon: '/icon.svg' });
        }
    };

    // --- NAVIGATION ---
    const navigateTo = (screen: Screen) => {
        if (screen !== activeScreen) {
            setPreviousScreen(activeScreen);
            setActiveScreen(screen);
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        // Show Praxis preview first, then loading, then auth check
        const authStatus = localStorage.getItem('praxis-authenticated') === 'true';
        const onboardingStatus = localStorage.getItem('praxis-onboarding-complete') === 'true';

        // For testing - you can uncomment this to reset auth state
        // localStorage.removeItem('praxis-authenticated');
        // localStorage.removeItem('praxis-onboarding-complete');

        // First show Praxis preview for 1.5 seconds
        setTimeout(() => {
            setShowPreview(false);
            // Then show loading for 1 second
            setTimeout(() => {
                setIsAuthenticated(authStatus);
                setIsOnboardingComplete(onboardingStatus);
                setIsLoading(false);
            }, 1000);
        }, 1500);

        const savedTheme = localStorage.getItem('praxis-theme') || 'obsidian';
        setActiveTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const savedUiMode = (localStorage.getItem('praxis-ui-mode') as 'dark' | 'glass') || 'glass';
        setUiMode(savedUiMode);
        if (savedUiMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const savedFocusBg = localStorage.getItem('praxis-focus-bg') || 'synthwave';
        setActiveFocusBackground(savedFocusBg);

        // Load browser push setting
        const savedPushEnabled = localStorage.getItem('praxis-browser-push') === 'true';
        setBrowserPushEnabled(savedPushEnabled);

        // Restore daily reward image if it's for today
        const savedReward = localStorage.getItem('dailyReward');
        if (savedReward) {
            try {
                const { date, url } = JSON.parse(savedReward);
                if (date === new Date().toDateString()) {
                    setDailyCompletionImage(url);
                }
            } catch(e) {
                console.error("Could not parse daily reward from localStorage", e);
                localStorage.removeItem('dailyReward');
            }
        }
    }, []);

    // Listen for global event to open Daily Mode (triggered from Dashboard CTA)
    useEffect(() => {
        const handler = () => setIsDailyModeOpen(true);
        window.addEventListener('praxis:open-daily-mode', handler);
        return () => window.removeEventListener('praxis:open-daily-mode', handler);
    }, []);

    useEffect(() => {
        const fetchBriefing = async () => {
            setIsBriefingLoading(true);
            try {
                const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString());
                
                const { data: newBriefing, fallbackUsed } = await kikoRequest('generate_briefing', {
                    timeframe: 'day',
                    tasks: todaysTasks,
                    notes,
                    healthData,
                });

                if (fallbackUsed) {
                    showToast("Kiko's primary brain is offline. Briefing generated by backup agent.");
                }

                if (newBriefing) {
                    setBriefing(newBriefing);
                } else {
                    showToast("Could not generate today's briefing.");
                }

            } catch (error) {
                console.error("Failed to generate mission briefing:", error);
                showToast("Kiko couldn't generate the daily briefing.");
            } finally {
                setIsBriefingLoading(false);
            }
        };

        if (isAuthenticated && isOnboardingComplete) {
            fetchBriefing();
        }
    }, [isAuthenticated, isOnboardingComplete, tasks, notes, healthData]);

    // Effect to check for daily completion and generate reward image
    useEffect(() => {
        const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString());
        const allTasksCompleted = todaysTasks.length > 0 && todaysTasks.every(t => t.status === TaskStatus.Completed);
        const dayIdentifier = new Date().toDateString();

        if (allTasksCompleted && !dailyCompletionImage) {
            const generateImage = async () => {
                try {
                    showToast("Daily Reward Unlocked! Generating your image...");
                    const { data: imageUrl } = await kikoRequest('generate_daily_image', { date: new Date(), tasks: todaysTasks });
                    setDailyCompletionImage(imageUrl);
                    localStorage.setItem('dailyReward', JSON.stringify({ date: dayIdentifier, url: imageUrl }));
                } catch (error) {
                    console.error("Failed to generate daily reward image:", error);
                    showToast("Couldn't generate reward image. Kiko might be busy.");
                }
            };
            generateImage();
        }
    }, [tasks, dailyCompletionImage]);

    useEffect(() => {
        // This effect resets the initial date for the schedule so it doesn't persist
        if (activeScreen !== 'Schedule' && scheduleInitialDate) {
            setScheduleInitialDate(undefined);
        }
    }, [activeScreen, scheduleInitialDate]);
    
    // --- AUTH & ONBOARDING HANDLERS ---
    const handleLogin = () => {
        localStorage.setItem('praxis-authenticated', 'true');
        // For existing users, automatically complete onboarding
        localStorage.setItem('praxis-onboarding-complete', 'true');
        setIsAuthenticated(true);
        setIsOnboardingComplete(true);
    };
    
    const handleLogout = () => {
        localStorage.removeItem('praxis-authenticated');
        setIsAuthenticated(false);
    };

    const handleOnboardingComplete = () => {
        localStorage.setItem('praxis-onboarding-complete', 'true');
        setIsOnboardingComplete(true);
    };

    // --- THEME HANDLER ---
    const toggleUiMode = () => {
        const newMode = uiMode === 'dark' ? 'glass' : 'dark';
        setUiMode(newMode);
        localStorage.setItem('praxis-ui-mode', newMode);
        document.documentElement.classList.toggle('dark', newMode === 'dark');
    };
    
    const handleSetActiveTheme = (themeValue: string) => {
        const theme = REWARDS_CATALOG.find(r => r.value === themeValue);
        if (theme && purchasedRewards.includes(theme.id)) {
            setActiveTheme(themeValue);
            localStorage.setItem('praxis-theme', themeValue);
            document.documentElement.setAttribute('data-theme', themeValue);
            showToast(`Theme changed to ${theme.name}`);
        } else {
            showToast("Theme not purchased yet!");
        }
    };

    const handleSetActiveFocusBackground = (bgValue: string) => {
        const reward = REWARDS_CATALOG.find(r => r.value === bgValue && r.type === 'focus_background');
        if (reward && purchasedRewards.includes(reward.id)) {
            setActiveFocusBackground(bgValue);
            localStorage.setItem('praxis-focus-bg', bgValue);
            showToast(`Focus background set to ${reward.name}`);
        } else {
            showToast("Focus background not purchased yet!");
        }
    };
    
    const handlePurchaseReward = (reward: RewardItem) => {
        if (praxisFlow >= reward.cost && !purchasedRewards.includes(reward.id)) {
            setPraxisFlow(prev => prev - reward.cost);
            setPurchasedRewards(prev => [...prev, reward.id]);
            showToast(`Unlocked ${reward.name}!`);
            if (reward.type === 'theme') {
                handleSetActiveTheme(reward.value);
            } else if (reward.type === 'focus_background') {
                handleSetActiveFocusBackground(reward.value);
            }
        } else if (purchasedRewards.includes(reward.id)) {
            showToast("You already own this item.");
        } else {
            showToast("Not enough Flow to unlock this!");
        }
    };

    const handleAddNewCategory = (newCategoryName: string) => {
        if (categories.some(c => c.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            showToast(`Category "${newCategoryName}" already exists.`);
            return false;
        }
        const newCategory = newCategoryName.trim() as Category;
    
        const existingColors = Object.values(categoryColors);
        const availableColors = PRESET_COLORS.filter(c => !existingColors.includes(c));
        const newColor = availableColors.length > 0 ? availableColors[0] : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    
        setCategories(prev => [...prev, newCategory]);
        setCategoryColors(prev => ({...prev, [newCategory]: newColor}));
        showToast(`Category "${newCategory}" created!`);
        return true;
    };

    // --- DATA HANDLERS (TASKS) ---
    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskSwap = (draggedId: number, targetId: number) => {
        setTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const draggedTask = newTasks.find(t => t.id === draggedId);
            const targetTask = newTasks.find(t => t.id === targetId);
    
            if (!draggedTask || !targetTask || new Date(draggedTask.startTime).toDateString() !== new Date(targetTask.startTime).toDateString()) {
                return prevTasks;
            }
    
            const tempStartTime = draggedTask.startTime;
            draggedTask.startTime = targetTask.startTime;
            targetTask.startTime = tempStartTime;
    
            return newTasks;
        });
        showToast("Schedule adjusted!");
    };
    
    const addTask = (task: Partial<Task> & { title: string }) => {
        const newTask: Task = {
            id: Date.now(),
            status: TaskStatus.Pending,
            startTime: new Date().toISOString(),
            category: 'Personal',
            plannedDuration: 60,
            ...task,
        };
        setTasks(prev => [newTask, ...prev]);
        
        // Create Quick Note for the task
        createQuickNoteForTask(newTask);
        
        showToast(`Task "${newTask.title}" added!`);
        triggerHapticFeedback('success');
    };

    const deleteTask = (taskId: number) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        showToast('Task deleted successfully.');
        triggerHapticFeedback('medium');
    };
    
    // --- DATA HANDLERS (NOTEBOOKS) ---
    const addNotebook = (title: string, color: string) => {
        const newNotebook: Notebook = { id: Date.now(), title, color };
        setNotebooks(prev => [newNotebook, ...prev]);
        showToast(`Notebook "${title}" created.`);
        return newNotebook;
    };

    const updateNotebook = (updatedNotebook: Notebook) => {
        setNotebooks(prev => prev.map(nb => nb.id === updatedNotebook.id ? updatedNotebook : nb));
    };

    const deleteNotebook = (notebookId: number) => {
        const notebookToDelete = notebooks.find(nb => nb.id === notebookId);
        if (notebookToDelete) {
            const associatedNoteIds = notes.filter(n => n.notebookId === notebookId && !n.deletedAt).map(n => n.id);
            setNotes(prev => prev.map(n => associatedNoteIds.includes(n.id) ? { ...n, deletedAt: new Date() } : n));
            setLastDeletedNotebook({ ...notebookToDelete, associatedNoteIds });
            setNotebooks(prev => prev.filter(nb => nb.id !== notebookId));
            setActiveNotebookId('all');
            showToast(`Notebook "${notebookToDelete.title}" deleted.`, {
                label: 'Undo',
                onClick: () => restoreNotebook(notebookId)
            });
        }
    };

    const restoreNotebook = (notebookId: number) => {
        if (lastDeletedNotebook && lastDeletedNotebook.id === notebookId) {
            const { associatedNoteIds, ...notebookToRestore } = lastDeletedNotebook;
            setNotebooks(prev => [...prev, notebookToRestore].sort((a,b) => a.id - b.id));
            if (associatedNoteIds) {
                setNotes(prev => prev.map(n => associatedNoteIds.includes(n.id) ? { ...n, deletedAt: undefined } : n));
            }
            setLastDeletedNotebook(null);
            showToast(`Notebook "${notebookToRestore.title}" restored.`);
        }
    };

    // --- DATA HANDLERS (NOTES) ---
    const addNote = (title: string, content: string, notebookId: number = 1) => { // Default to Quick Notes
        const newNote: Note = {
            id: Date.now(),
            notebookId, title, content,
            createdAt: new Date(), updatedAt: new Date(), flagged: false, tags: [],
        };
        setNotes(prev => [newNote, ...prev]);
        showToast(`Note "${title}" created.`);
        return newNote;
    };

    // Helper function to create Quick Note for task
    const createQuickNoteForTask = (task: Task) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Check if there are other Quick Notes for the same day
        const todayNotes = notes.filter(n => n.notebookId === 1 && 
            new Date(n.createdAt).toDateString() === now.toDateString());
        
        const title = todayNotes.length > 0 
            ? `Task: ${task.title} - ${dateStr} ${timeStr}`
            : `Task: ${task.title} - ${dateStr}`;
        
        const content = `<p><strong>Task Details:</strong></p>
            <p>Category: ${task.category}</p>
            <p>Duration: ${task.plannedDuration} minutes</p>
            <p>Priority: ${task.priority || 'medium'}</p>
            ${task.location ? `<p>Location: ${task.location}</p>` : ''}
            ${task.notes ? `<p><strong>Notes:</strong> ${task.notes}</p>` : ''}
            <p><em>Created automatically from task</em></p>`;
        
        return addNote(title, content, 1);
    };

    const updateNote = (updatedNote: Note, options?: { silent?: boolean }) => {
        setNotes(prev => prev.map(n => {
            if (n.id === updatedNote.id) {
                return {
                    ...updatedNote,
                    updatedAt: options?.silent ? n.updatedAt : new Date()
                };
            }
            return n;
        }));
    };

    const restoreNote = (noteId: number) => {
        const noteToRestore = notes.find(n => n.id === noteId);
        if (noteToRestore) {
            const restoredNote = { ...noteToRestore };
            delete restoredNote.deletedAt;
            updateNote(restoredNote);
            if (lastDeletedNote?.id === noteId) setLastDeletedNote(null);
            showToast('Note restored.');
        }
    };

    const deleteNote = (noteId: number) => {
        const noteToDelete = notes.find(n => n.id === noteId);
        if (noteToDelete && !noteToDelete.deletedAt) {
            const updatedNote = { ...noteToDelete, deletedAt: new Date() };
            updateNote(updatedNote);
            setLastDeletedNote(updatedNote);
            if (selectedNote?.id === noteId) setSelectedNote(null);
            showToast('Note moved to trash.', {
                label: 'Undo',
                onClick: () => restoreNote(noteId)
            });
            triggerHapticFeedback('medium');
        }
    };
    
    const permanentlyDeleteNote = (noteId: number) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
        showToast('Note permanently deleted.');
        triggerHapticFeedback('heavy');
    };

    const handleSyncCalendar = async () => {
        showToast('Syncing with Google Calendar...');
        const newEvents = await syncCalendar();
        const newTasks: Task[] = newEvents.map((e, i) => ({
            id: Date.now() + i, status: TaskStatus.Pending, category: 'Meeting', plannedDuration: 60, ...e,
        } as Task));
        setTasks(prev => [...prev, ...newTasks.filter(nt => !prev.some(pt => pt.googleCalendarEventId === nt.googleCalendarEventId))]);
        showToast(`${newTasks.length} new events synced!`);
    };
    
    // --- KIKO CHAT HANDLERS ---
    const handleUpdateActiveChatMessages = (newMessages: ChatMessage[]) => {
        setChatHistory(prev =>
            prev.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: newMessages } : chat
            )
        );
    };

    const handleNewChat = () => {
        const newChat: ChatSession = {
            id: Date.now(),
            title: "New Chat Session",
            messages: [],
            createdAt: new Date(),
        };
        setChatHistory(prev => [newChat, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setActiveChatId(newChat.id);
    };
    
    const handleRestoreChat = (id: number) => {
        if (lastDeletedChat && lastDeletedChat.id === id) {
            setChatHistory(prev => [...prev, lastDeletedChat].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setLastDeletedChat(null);
            showToast("Chat restored.");
        }
    };

    const handleDeleteChat = (id: number) => {
        const chatToDelete = chatHistory.find(c => c.id === id);
        if (chatToDelete) {
            setLastDeletedChat(chatToDelete);
            setTimeout(() => setLastDeletedChat(null), 6000); // Clear after 6 seconds
            setChatHistory(prev => {
                const newHistory = prev.filter(c => c.id !== id);
                if (activeChatId === id) {
                    const sortedHistory = newHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    const nextChat = sortedHistory.length > 0 ? sortedHistory[0] : null;
                    setActiveChatId(nextChat ? nextChat.id : null);
                }
                return newHistory;
            });
            showToast("Chat moved to trash.", {
                label: "Undo",
                onClick: () => handleRestoreChat(id)
            });
        }
    };

    const handleRenameChat = (id: number, newTitle: string) => {
        setChatHistory(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
        showToast("Chat renamed.");
    };


    const handleSendMessage = async (message: string, attachment?: ChatMessage['attachment']) => {
        const userMessage: ChatMessage = { role: 'user', text: message, attachment };
        const activeChat = chatHistory.find(c => c.id === activeChatId);
        if (!activeChat) return;

        const updatedMessages = [...activeChat.messages, userMessage];
        handleUpdateActiveChatMessages(updatedMessages);
        setIsAiReplying(true);

        try {
            const requestPayload = attachment
                ? { taskType: 'analyze_image', payload: { ...attachment, prompt: message } }
                : { taskType: 'generate_note_text', payload: { instruction: 'summarize', text: message } };
            
            const { data: responseText } = await kikoRequest(requestPayload.taskType as any, requestPayload.payload);
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            handleUpdateActiveChatMessages([...updatedMessages, modelMessage]);

        } catch (error) {
            console.error("Error sending message via Kiko:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting right now." };
            handleUpdateActiveChatMessages([...updatedMessages, errorMessage]);
        } finally {
            setIsAiReplying(false);
        }
    };

    const startChatWithContext = (context: string) => {
        const newChat: ChatSession = {
            id: Date.now(),
            title: context.substring(0, 30) + '...',
            messages: [],
            createdAt: new Date(),
        };
        setChatHistory(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        navigateTo('Kiko');
        handleSendMessage(context);
    };

    const redirectToKikoAIWithChat = (history: ChatMessage[]) => {
        const newChat: ChatSession = {
            id: Date.now(),
            title: history[0]?.text.substring(0, 30) + '...' || 'New Session',
            messages: history,
            createdAt: new Date(),
        };
        setChatHistory(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        navigateTo('Kiko');
    };
    
    // --- END KIKO HANDLERS ---
    
    const handleUndoCompleteTask = (taskToUndo: Task) => {
        if (!taskToUndo) return;

        const revertedTask: Task = { ...taskToUndo, status: TaskStatus.Pending, actualDuration: undefined, completionSummary: undefined, completionImageUrl: undefined };
        updateTask(revertedTask);

        const points = Math.round((taskToUndo.actualDuration || taskToUndo.plannedDuration) * 0.5);
        setPraxisFlow(prev => prev - points);

        showToast(`"${taskToUndo.title}" marked as pending.`);
    };

    const handleCompleteTask = (taskId: number, actualDuration: number) => {
        const taskToComplete = tasks.find(t => t.id === taskId);
        if (!taskToComplete || taskToComplete.status === TaskStatus.Completed) return;
    
        const optimisticTask: Task = { ...taskToComplete, status: TaskStatus.Completed, actualDuration };
        updateTask(optimisticTask);
        setFocusTask(null);
    
        const points = Math.round(actualDuration * 0.5);
        setPraxisFlow(prev => prev + points);
        
        showToast(`+${points} Flow! Great work!`, { label: 'Undo', onClick: () => handleUndoCompleteTask(optimisticTask) });
    
        (async () => {
            try {
                const [summaryResult, imageResult] = await Promise.all([
                    kikoRequest('generate_completion_summary', { task: optimisticTask }),
                    kikoRequest('generate_completion_image', { task: optimisticTask })
                ]);
    
                const summary = summaryResult.data as CompletionSummary;
                const imageUrl = imageResult.data as string;
    
                setTasks(currentTasks => 
                    currentTasks.map(t => (t.id === taskId && t.status === TaskStatus.Completed) ? { ...t, completionSummary: summary, completionImageUrl: imageUrl } : t)
                );
            } catch (error) {
                console.error("Error generating completion details:", error);
                showToast("Couldn't generate completion visuals.");
            }
        })();
    };
    
    const triggerInsightGeneration = useCallback(async (task: Task, isRegeneration: boolean) => {
        try {
            updateTask({ ...task, isGeneratingInsights: true });
            const { data: insightData, fallbackUsed } = await kikoRequest('generate_task_insights', {
                task, healthData, notes, goals, allTasks: tasks, isRegeneration
            });

            if (fallbackUsed) showToast("Kiko's primary brain had a glitch. Using a creative backup!");

            updateTask({ ...task, insights: insightData, isGeneratingInsights: false });
        } catch (error) {
            console.error("Failed to generate insights via Kiko orchestrator", error);
            showToast("Kiko seems to be offline. Could not generate insights.");
            updateTask({ ...task, isGeneratingInsights: false });
        }
    }, [tasks, notes, goals, healthData]);

    const navigateToScheduleDate = (date: Date) => {
        setScheduleInitialDate(date);
        navigateTo('Schedule');
    };

    // --- RENDER LOGIC ---
    const renderScreen = () => {
        switch (activeScreen) {
            case 'Dashboard': return <UnifiedDashboard tasks={tasks} notes={notes} healthData={healthData} briefing={briefing} goals={goals} setFocusTask={setFocusTask} dailyCompletionImage={dailyCompletionImage} categoryColors={categoryColors} isBriefingLoading={isBriefingLoading} navigateToScheduleDate={navigateToScheduleDate} inferredLocation={inferHomeLocation(tasks)} setScreen={navigateTo} onCompleteTask={(taskId) => handleCompleteTask(taskId, 0)} />;
            case 'Schedule': return <Schedule tasks={tasks} setTasks={setTasks} projects={projects} notes={notes} notebooks={notebooks} goals={goals} categories={categories} categoryColors={categoryColors} showToast={showToast} onCompleteTask={handleCompleteTask} onUndoCompleteTask={handleUndoCompleteTask} triggerInsightGeneration={triggerInsightGeneration} redirectToKikoAIWithChat={redirectToKikoAIWithChat} addNote={addNote} deleteTask={deleteTask} addTask={addTask} onTaskSwap={handleTaskSwap} onAddNewCategory={handleAddNewCategory} initialDate={scheduleInitialDate} />;
            case 'Notes': return <Notes notes={notes} notebooks={notebooks} updateNote={updateNote} addNote={addNote} startChatWithContext={startChatWithContext} selectedNote={selectedNote} setSelectedNote={setSelectedNote} activeNotebookId={activeNotebookId} setActiveNotebookId={setActiveNotebookId} deleteNote={deleteNote} showToast={showToast} lastDeletedNote={lastDeletedNote} restoreNote={restoreNote} permanentlyDeleteNote={permanentlyDeleteNote} tasks={tasks} addNotebook={addNotebook} updateNotebook={updateNotebook} deleteNotebook={deleteNotebook} restoreNotebook={restoreNotebook} navigateToScheduleDate={navigateToScheduleDate} categoryColors={categoryColors} />;
            case 'Profile': return <Profile praxisFlow={praxisFlow} setScreen={navigateTo} goals={goals} setGoals={setGoals} activeFocusBackground={activeFocusBackground} setActiveFocusBackground={handleSetActiveFocusBackground} purchasedRewards={purchasedRewards} />;
            case 'Projects': return <Projects projects={projects} setProjects={setProjects} />;
            case 'Kiko': return <PraxisAI 
                chatHistory={chatHistory} 
                activeChatId={activeChatId} 
                setActiveChatId={setActiveChatId}
                onNewChat={handleNewChat}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
                onSendMessage={handleSendMessage} 
                isAiReplying={isAiReplying} 
                previousScreen={previousScreen} 
                notes={notes}
                addNote={addNote}
                updateNote={updateNote}
                showToast={showToast}
                goals={goals} 
                praxisFlow={praxisFlow}
                lastDeletedChat={lastDeletedChat}
                onRestoreChat={handleRestoreChat}
            />;
            case 'Settings': return <Settings uiMode={uiMode} toggleUiMode={toggleUiMode} onSyncCalendar={handleSyncCalendar} onLogout={handleLogout} activeTheme={activeTheme} setActiveTheme={handleSetActiveTheme} purchasedRewards={purchasedRewards} browserPushEnabled={browserPushEnabled} setBrowserPushEnabled={setBrowserPushEnabled} />;
            case 'Notifications': return <Notifications items={notifications} />;
            case 'Rewards': return <Rewards onBack={() => navigateTo('Profile')} praxisFlow={praxisFlow} purchasedRewards={purchasedRewards} activeTheme={activeTheme} setActiveTheme={handleSetActiveTheme} onPurchase={handlePurchaseReward} activeFocusBackground={activeFocusBackground} setActiveFocusBackground={handleSetActiveFocusBackground} />;
            case 'Focus': return focusTask ? <FocusMode task={focusTask} onComplete={handleCompleteTask} onClose={() => setFocusTask(null)} activeFocusBackground={activeFocusBackground} /> : <div/>;
            default: return <UnifiedDashboard tasks={tasks} notes={notes} healthData={healthData} briefing={briefing} goals={goals} setFocusTask={setFocusTask} dailyCompletionImage={dailyCompletionImage} categoryColors={categoryColors} isBriefingLoading={isBriefingLoading} navigateToScheduleDate={navigateToScheduleDate} inferredLocation={inferHomeLocation(tasks)} setScreen={navigateTo} onCompleteTask={(taskId) => handleCompleteTask(taskId, 0)} />;
        }
    };
    
    if (showPreview) return <PraxisPreview />;
    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated) return <Auth onLogin={handleLogin} />;
    if (!isOnboardingComplete) return <Onboarding goals={goals} setGoals={setGoals} onComplete={handleOnboardingComplete} />;

    return (
        <ErrorBoundary>
            <div className={`min-h-screen font-sans bg-bg text-text transition-colors duration-300`}>
                {focusTask ? (
                     <ErrorBoundary>
                         <FocusMode task={focusTask} onComplete={handleCompleteTask} onClose={() => setFocusTask(null)} activeFocusBackground={activeFocusBackground} />
                     </ErrorBoundary>
                ) : (
                    <>
                        <main className="w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeScreen}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ErrorBoundary>
                                        {renderScreen()}
                                    </ErrorBoundary>
                                </motion.div>
                            </AnimatePresence>
                        </main>
                        <ErrorBoundary>
                            <Navigation activeScreen={activeScreen} setScreen={navigateTo} />
                        </ErrorBoundary>
                    </>
                )}
                <AnimatePresence>
                    {isDailyModeOpen && (
                        <ErrorBoundary>
                            <DailyMode
                                tasks={tasks}
                                onClose={() => setIsDailyModeOpen(false)}
                                onStartFocus={(task) => {
                                    setFocusTask(task);
                                    setIsDailyModeOpen(false);
                                }}
                            />
                        </ErrorBoundary>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {toast && (
                        <ErrorBoundary>
                            <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />
                        </ErrorBoundary>
                    )}
                </AnimatePresence>
            </div>
        </ErrorBoundary>
    );
};

export default App;