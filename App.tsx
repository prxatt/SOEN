import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Import types
import { Screen, Task, Note, Notebook, Insight, Project, Goal, ChatMessage, SearchHistoryItem, VisionHistoryItem, HealthData, TaskStatus, Category, RewardItem, CompletionSummary } from './types';

// Import components
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
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
import { PraxisLogo } from './components/Icons';

// Import services and utils
import { syncCalendar } from './services/googleCalendarService';
import { kikoRequest } from './services/kikoAIService';
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
            const hour = Math.floor(Math.random() * 12) + 8; // 8am - 7pm
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
                startTime,
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


const initialNotebooks: Notebook[] = [
    { id: 1, title: 'Praxis AI', color: '#A855F7' },
    { id: 2, title: 'Surface Tension', color: '#3B82F6' },
    { id: 3, title: 'Personal', color: '#10B981' },
];

const initialNotes: Note[] = [
    { id: 101, notebookId: 1, title: 'Initial Project Ideas', content: '<p>Exploring concepts for a new AI-driven productivity tool...</p>', createdAt: new Date(), updatedAt: new Date(), archived: false, flagged: true, tags: ['idea', 'ai'] },
    { id: 102, notebookId: 2, title: 'Brand Guidelines', content: '<p>Core principles for the Surface Tension brand...</p>', createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 86400000), archived: false, flagged: false, tags: ['branding'] },
];

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function App() {
    // --- STATE MANAGEMENT ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeScreen, setActiveScreen] = useState<Screen>('Dashboard');
    const [uiMode, setUiMode] = useState<'dark' | 'glass'>('dark');
    const [activeTheme, setActiveTheme] = useState('obsidian');
    const [toast, setToast] = useState<{ message: string; id: number; action?: { label: string; onClick: () => void; } } | null>(null);

    // Data states
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks);
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiReplying, setIsAiReplying] = useState(false);
    const [praxisFlow, setPraxisFlow] = useState(500);
    const [purchasedRewards, setPurchasedRewards] = useState<string[]>(['theme-obsidian']);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [activeFocusBackground, setActiveFocusBackground] = useState<string>('synthwave');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [activeNotebookId, setActiveNotebookId] = useState<number | 'all' | 'flagged' | 'archived' | 'trash'>('all');
    const [dailyCompletionImage, setDailyCompletionImage] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [categoryColors, setCategoryColors] = useState<Record<Category, string>>(CATEGORY_COLORS);
    const [lastDeletedNote, setLastDeletedNote] = useState<Note | null>(null);

    // Derived/Generated states
    const [healthData, setHealthData] = useState<HealthData>({ totalWorkouts: 1, totalWorkoutMinutes: 28, workoutTypes: { 'Running': 1 }, avgSleepHours: 7.5, sleepQuality: 'good', energyLevel: 'high' });
    const [briefing, setBriefing] = useState(MOCKED_BRIEFING);

    const showToast = (message: string, action?: { label: string; onClick: () => void; }) => {
        setToast({ message, id: Date.now(), action });
    };

    // --- EFFECTS ---
    useEffect(() => {
        // Mock loading and auth check
        const authStatus = localStorage.getItem('praxis-authenticated') === 'true';
        const onboardingStatus = localStorage.getItem('praxis-onboarding-complete') === 'true';

        setTimeout(() => {
            setIsAuthenticated(authStatus);
            setIsOnboardingComplete(onboardingStatus);
            setIsLoading(false);
        }, 1500);

        const savedTheme = localStorage.getItem('praxis-theme') || 'obsidian';
        setActiveTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const savedUiMode = (localStorage.getItem('praxis-ui-mode') as 'dark' | 'glass') || 'dark';
        setUiMode(savedUiMode);
        if (savedUiMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

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

    // Effect to check for daily completion and generate reward image
    useEffect(() => {
        const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString());
        const allTasksCompleted = todaysTasks.length > 0 && todaysTasks.every(t => t.status === TaskStatus.Completed);
        const dayIdentifier = new Date().toDateString();

        // Condition to generate: all tasks are done, and we don't already have an image for today in the state.
        if (allTasksCompleted && !dailyCompletionImage) {
            const generateImage = async () => {
                try {
                    showToast("Daily Reward Unlocked! Generating your image...");
                    const { data: imageUrl } = await kikoRequest('generate_daily_image', { date: new Date(), tasks: todaysTasks });
                    setDailyCompletionImage(imageUrl);
                    // Store object with date and URL for persistence
                    localStorage.setItem('dailyReward', JSON.stringify({ date: dayIdentifier, url: imageUrl }));
                } catch (error) {
                    console.error("Failed to generate daily reward image:", error);
                    showToast("Couldn't generate reward image. Kiko might be busy.");
                }
            };
            generateImage();
        }
    }, [tasks, dailyCompletionImage]);
    
    // --- AUTH & ONBOARDING HANDLERS ---
    const handleLogin = () => {
        localStorage.setItem('praxis-authenticated', 'true');
        setIsAuthenticated(true);
        if (!isOnboardingComplete) {
            // Stay on auth screen, let it transition to onboarding
        }
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
        if (newMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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
    
    const handlePurchaseReward = (reward: RewardItem) => {
        if (praxisFlow >= reward.cost && !purchasedRewards.includes(reward.id)) {
            setPraxisFlow(prev => prev - reward.cost);
            setPurchasedRewards(prev => [...prev, reward.id]);
            showToast(`Unlocked ${reward.name}!`);
            if (reward.type === 'theme') {
                handleSetActiveTheme(reward.value);
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
        let newColor: string;
        if (availableColors.length > 0) {
            newColor = availableColors[0];
        } else {
            newColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        }
    
        setCategories(prev => [...prev, newCategory]);
        setCategoryColors(prev => ({...prev, [newCategory]: newColor}));
        showToast(`Category "${newCategory}" created!`);
        return true;
    };

    // --- DATA HANDLERS ---
    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskSwap = (draggedId: number, targetId: number) => {
        setTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const draggedTask = newTasks.find(t => t.id === draggedId);
            const targetTask = newTasks.find(t => t.id === targetId);
    
            if (!draggedTask || !targetTask) {
                return prevTasks;
            }
    
            // Prevent swapping between different days for simplicity and predictability
            if (new Date(draggedTask.startTime).toDateString() !== new Date(targetTask.startTime).toDateString()) {
                return prevTasks; // Silently prevent cross-day drag and drop
            }
    
            // Swap the start times to reorder them. The list will sort itself on next render.
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
            startTime: new Date(),
            category: 'Personal',
            plannedDuration: 60,
            ...task,
        };
        setTasks(prev => [newTask, ...prev]);
        showToast(`Task "${newTask.title}" added!`);
        triggerHapticFeedback('success');
    };

    const deleteTask = (taskId: number) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        showToast('Task deleted successfully.');
        triggerHapticFeedback('medium');
    };

    const addNote = (title: string, content: string, notebookId: number) => {
        const newNote: Note = {
            id: Date.now(),
            notebookId, title, content,
            createdAt: new Date(), updatedAt: new Date(), archived: false, flagged: false, tags: [],
        };
        setNotes(prev => [newNote, ...prev]);
        showToast(`Note "${title}" created.`);
        return newNote;
    };

    const updateNote = (updatedNote: Note) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? {...updatedNote, updatedAt: new Date()} : n));
    };

    const restoreNote = (noteId: number) => {
        const noteToRestore = notes.find(n => n.id === noteId);
        if (noteToRestore) {
            const restoredNote = { ...noteToRestore };
            delete restoredNote.deletedAt; // Remove the property to restore it
            updateNote(restoredNote);
            if (lastDeletedNote?.id === noteId) {
                setLastDeletedNote(null);
            }
            showToast('Note restored.');
        }
    };

    const deleteNote = (noteId: number) => {
        const noteToDelete = notes.find(n => n.id === noteId);
        if (noteToDelete && !noteToDelete.deletedAt) { // Don't re-trash a trashed note
            const updatedNote = { ...noteToDelete, deletedAt: new Date() };
            updateNote(updatedNote);
            setLastDeletedNote(updatedNote); // Keep for the undo menu item
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
            }
            showToast('Note moved to trash.', {
                label: 'Undo',
                onClick: () => restoreNote(noteId)
            });
            triggerHapticFeedback('medium');
        }
    };
    
    const permanentlyDeleteNote = (noteId: number) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
            setSelectedNote(null);
        }
        showToast('Note permanently deleted.');
        triggerHapticFeedback('heavy');
    };

    const handleSyncCalendar = async () => {
        showToast('Syncing with Google Calendar...');
        const newEvents = await syncCalendar();
        const newTasks: Task[] = newEvents.map((e, i) => ({
            id: Date.now() + i,
            status: TaskStatus.Pending,
            category: 'Meeting', // Default category for calendar events
            plannedDuration: 60, // Default duration
            ...e,
        } as Task));
        setTasks(prev => [...prev, ...newTasks.filter(nt => !prev.some(pt => pt.googleCalendarEventId === nt.googleCalendarEventId))]);
        showToast(`${newTasks.length} new events synced!`);
    };

    const handleSendMessage = async (message: string, attachment?: ChatMessage['attachment']) => {
        const userMessage: ChatMessage = { role: 'user', text: message, attachment };
        setChatMessages(prev => [...prev, userMessage]);
        setIsAiReplying(true);
        // This is a simplified call. In a real app, you might have different AI tasks.
        const responseText = `This is a mocked response to: "${message}". In a real app, Kiko would provide a detailed answer.`;
        setTimeout(() => {
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            setChatMessages(prev => [...prev, modelMessage]);
            setIsAiReplying(false);
        }, 1500);
    };
    
    const startChatWithContext = (context: string) => {
        setActiveScreen('Kiko');
        setChatMessages([{ role: 'user', text: context }]);
        // Mock a reply
        handleSendMessage(context);
    };

    const redirectToKikoAIWithChat = (history: ChatMessage[]) => {
        setActiveScreen('Kiko');
        setChatMessages(history);
    };
    
    const handleUndoCompleteTask = (taskToUndo: Task) => {
        if (!taskToUndo) return;

        // Revert status
        const revertedTask: Task = {
            ...taskToUndo,
            status: TaskStatus.Pending,
            actualDuration: undefined,
            completionSummary: undefined,
            completionImageUrl: undefined
        };
        updateTask(revertedTask);

        // Revert points
        const points = Math.round((taskToUndo.actualDuration || taskToUndo.plannedDuration) * 0.5);
        setPraxisFlow(prev => prev - points);

        showToast(`"${taskToUndo.title}" marked as pending.`);
    };

    const handleCompleteTask = (taskId: number, actualDuration: number) => {
        const taskToComplete = tasks.find(t => t.id === taskId);
        if (!taskToComplete || taskToComplete.status === TaskStatus.Completed) return;
    
        // --- Optimistic UI Update ---
        const optimisticTask: Task = {
            ...taskToComplete,
            status: TaskStatus.Completed,
            actualDuration,
        };
        updateTask(optimisticTask); // Update state immediately
        setFocusTask(null); // Close focus mode if it was open
    
        const points = Math.round(actualDuration * 0.5);
        setPraxisFlow(prev => prev + points);
        
        showToast(`+${points} Flow! Great work!`, {
            label: 'Undo',
            onClick: () => handleUndoCompleteTask(optimisticTask)
        });
    
        // --- Background AI Generation (Fire and Forget) ---
        (async () => {
            try {
                // Generate completion summary and image in parallel
                const [summaryResult, imageResult] = await Promise.all([
                    kikoRequest('generate_completion_summary', { task: optimisticTask }),
                    kikoRequest('generate_completion_image', { task: optimisticTask })
                ]);
    
                const summary = summaryResult.data as CompletionSummary;
                const imageUrl = imageResult.data as string;
    
                // Update the task again with the generated details, but use a functional update
                // to get the latest state and check if the task hasn't been "undone".
                setTasks(currentTasks => 
                    currentTasks.map(t => {
                        if (t.id === taskId && t.status === TaskStatus.Completed) {
                            return {
                                ...t,
                                completionSummary: summary,
                                completionImageUrl: imageUrl,
                            };
                        }
                        return t;
                    })
                );
            } catch (error) {
                console.error("Error generating completion details in background:", error);
                showToast("Couldn't generate completion visuals."); // User-friendly, non-blocking error
            }
        })();
    };
    
    const triggerInsightGeneration = useCallback(async (task: Task, isRegeneration: boolean) => {
        try {
            const { data: insightData, fallbackUsed } = await kikoRequest('generate_task_insights', {
                task,
                healthData,
                notes,
                goals,
                allTasks: tasks,
                isRegeneration
            });

            if (fallbackUsed) {
                showToast("Kiko's primary brain had a glitch. Using a creative backup!");
            }

            updateTask({ ...task, insights: insightData, isGeneratingInsights: false });
        } catch (error) {
            console.error("Failed to generate insights via Kiko orchestrator", error);
            showToast("Kiko seems to be offline. Could not generate insights.");
            updateTask({ ...task, isGeneratingInsights: false });
        }
    }, [tasks, notes, goals, healthData]);

    // --- RENDER LOGIC ---
    const renderScreen = () => {
        switch (activeScreen) {
            case 'Dashboard': return <Dashboard tasks={tasks} healthData={healthData} briefing={briefing} goals={goals} setFocusTask={setFocusTask} dailyCompletionImage={dailyCompletionImage} categoryColors={categoryColors} />;
            case 'Schedule': return <Schedule tasks={tasks} setTasks={setTasks} projects={projects} notes={notes} notebooks={notebooks} goals={goals} categories={categories} categoryColors={categoryColors} showToast={showToast} onCompleteTask={handleCompleteTask} onUndoCompleteTask={handleUndoCompleteTask} triggerInsightGeneration={triggerInsightGeneration} redirectToKikoAIWithChat={redirectToKikoAIWithChat} addNote={addNote} deleteTask={deleteTask} addTask={addTask} onTaskSwap={handleTaskSwap} onAddNewCategory={handleAddNewCategory} />;
            case 'Notes': return <Notes notes={notes} notebooks={notebooks} setNotebooks={setNotebooks} updateNote={updateNote} addNote={addNote} startChatWithContext={startChatWithContext} selectedNote={selectedNote} setSelectedNote={setSelectedNote} activeNotebookId={activeNotebookId} setActiveNotebookId={setActiveNotebookId} deleteNote={deleteNote} showToast={showToast} lastDeletedNote={lastDeletedNote} restoreNote={restoreNote} permanentlyDeleteNote={permanentlyDeleteNote} />;
            case 'Profile': return <Profile praxisFlow={praxisFlow} setScreen={setActiveScreen} goals={goals} setGoals={setGoals} />;
            case 'Projects': return <Projects projects={projects} setProjects={setProjects} />;
            case 'Kiko': return <PraxisAI insights={insights} setInsights={setInsights} tasks={tasks} notes={notes} notebooks={notebooks} projects={projects} healthData={healthData} addTask={(title) => addTask({title})} addNote={addNote} startChatWithContext={startChatWithContext} searchHistory={[]} setSearchHistory={()=>{}} visionHistory={[]} setVisionHistory={()=>{}} applyInsight={()=>{}} chatMessages={chatMessages} setChatMessages={setChatMessages} onSendMessage={handleSendMessage} isAiReplying={isAiReplying} showToast={showToast} />;
            case 'Settings': return <Settings uiMode={uiMode} toggleUiMode={toggleUiMode} onSyncCalendar={handleSyncCalendar} onLogout={handleLogout} />;
            case 'Rewards': return <Rewards onBack={() => setActiveScreen('Profile')} praxisFlow={praxisFlow} purchasedRewards={purchasedRewards} activeTheme={activeTheme} setActiveTheme={handleSetActiveTheme} onPurchase={handlePurchaseReward} />;
            case 'Focus': return focusTask ? <FocusMode task={focusTask} onComplete={handleCompleteTask} onClose={() => setFocusTask(null)} activeFocusBackground={activeFocusBackground} /> : <div/>;
            default: return <Dashboard tasks={tasks} healthData={healthData} briefing={briefing} goals={goals} setFocusTask={setFocusTask} dailyCompletionImage={dailyCompletionImage} categoryColors={categoryColors} />;
        }
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-bg"><PraxisLogo className="w-24 h-24 text-accent animate-pulse" /></div>;
    }

    if (!isAuthenticated) {
        return <Auth onLogin={handleLogin} Logo={PraxisLogo} />;
    }
    
    if (!isOnboardingComplete) {
        return <Onboarding goals={goals} setGoals={setGoals} onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className={`min-h-screen font-sans ${uiMode === 'dark' ? 'bg-bg' : ''} text-text transition-colors duration-300`}>
            {focusTask ? (
                 <FocusMode task={focusTask} onComplete={handleCompleteTask} onClose={() => setFocusTask(null)} activeFocusBackground={activeFocusBackground} />
            ) : (
                <>
                    <main className="max-w-6xl mx-auto px-4 pt-6 pb-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeScreen}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderScreen()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <Navigation activeScreen={activeScreen} setScreen={setActiveScreen} />
                </>
            )}
            <AnimatePresence>
                {toast && <Toast key={toast.id} message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default App;