import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import EventDetail from './components/EventDetail';
import Notes from './components/Notes';
import PraxisAI from './components/PraxisAI';
import Profile from './components/Profile';
import Rewards from './components/Rewards';
import Navigation from './components/Navigation';
import Auth from './components/auth/Auth';
import Onboarding from './components/Onboarding';
import Toast from './components/Toast';
import { MOCKED_TASKS, MOCKED_NOTES, MOCKED_NOTEBOOKS, MOCKED_INSIGHTS, MOCKED_GOALS, MOCKED_PROJECTS, REWARDS_CATALOG, DEFAULT_CATEGORIES } from './constants';
import { Task, Note, Notebook, Insight, Category, TaskStatus, ChatMessage, SearchHistoryItem, VisionHistoryItem, Goal, PraxisPointLog, Theme, Screen, Project, HealthData, ActionableInsight } from './types';
import { getActualDuration, calculateStreak, getTodaysTaskCompletion, inferHomeLocation } from './utils/taskUtils';
import { continueChat, setChatContext, parseHealthDataFromTasks, getProactiveHealthSuggestion, generateActionableInsights, generateMapsStaticImageUrl } from './services/geminiService';
import { kikoRequest } from './services/kikoAIService';
import { syncCalendar, addEventToCalendar, updateEventInCalendar } from './services/googleCalendarService';
import { triggerHapticFeedback } from './utils/haptics';

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item, (key, value) => {
        if (key === 'startTime' || key === 'createdAt' || key === 'timestamp') return new Date(value);
        return value;
      });
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
  }
  return fallback;
};

const PraxisLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6"/>
        <path d="M42 35V75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <path d="M42 50C42 42.268 48.268 36 56 36H60" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    </svg>
);


const AppHeader: React.FC = () => (
    <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <PraxisLogo className="w-9 h-9 text-light-text dark:text-dark-text" />
            <div>
                <h1 className="text-xl font-bold font-display text-light-text dark:text-dark-text leading-tight tracking-wide">PRAXIS AI</h1>
            </div>
        </div>
    </header>
);

const screenVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getInitialState('praxis-isAuthenticated', false));
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() => getInitialState('praxis-onboardingComplete', false));
  const [screen, setScreen] = useState<Screen>('Dashboard');
  const [tasks, setTasks] = useState<Task[]>(() => getInitialState('praxis-tasks', MOCKED_TASKS));
  const [notes, setNotes] = useState<Note[]>(() => getInitialState('praxis-notes', MOCKED_NOTES));
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => getInitialState('praxis-notebooks', MOCKED_NOTEBOOKS));
  const [projects, setProjects] = useState<Project[]>(() => getInitialState('praxis-projects', MOCKED_PROJECTS));
  const [insights, setInsights] = useState<Insight[]>(() => getInitialState('praxis-insights', MOCKED_INSIGHTS));
  const [goals, setGoals] = useState<Goal[]>(() => getInitialState('praxis-goals', MOCKED_GOALS));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getInitialState('praxis-isDarkMode', true)); // Default to dark mode
  const [customCategories, setCustomCategories] = useState<Category[]>(() => getInitialState('praxis-customCategories', []));
  
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getInitialState('praxis-chat-history', []));
  const [isAiReplying, setIsAiReplying] = useState(false);

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => getInitialState('praxis-search-history', []));
  const [visionHistory, setVisionHistory] = useState<VisionHistoryItem[]>(() => getInitialState('praxis-vision-history', []));
  
  // Gamification & Rewards State
  const [praxisFlow, setPraxisFlow] = useState<PraxisPointLog[]>(() => getInitialState('praxis-flow-log', []));
  const totalFlow = praxisFlow.reduce((sum, log) => sum + log.points, 0);
  const [toast, setToast] = useState<{ message: string; visible: boolean; action?: { label: string; onClick: () => void; } }>({ message: '', visible: false });
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const prevStreakRef = useRef<number | undefined>(undefined);
  
  const [activeTheme, setActiveTheme] = useState<string>(() => getInitialState('praxis-activeTheme', 'default'));
  const [purchasedRewards, setPurchasedRewards] = useState<string[]>(() => getInitialState('praxis-purchasedRewards', []));

  useEffect(() => { localStorage.setItem('praxis-isAuthenticated', JSON.stringify(isAuthenticated)); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem('praxis-onboardingComplete', JSON.stringify(isOnboardingComplete)); }, [isOnboardingComplete]);
  useEffect(() => { localStorage.setItem('praxis-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('praxis-notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('praxis-notebooks', JSON.stringify(notebooks)); }, [notebooks]);
  useEffect(() => { localStorage.setItem('praxis-projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('praxis-insights', JSON.stringify(insights)); }, [insights]);
  useEffect(() => { localStorage.setItem('praxis-goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('praxis-isDarkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('praxis-chat-history', JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { localStorage.setItem('praxis-search-history', JSON.stringify(searchHistory)); }, [searchHistory]);
  useEffect(() => { localStorage.setItem('praxis-vision-history', JSON.stringify(visionHistory)); }, [visionHistory]);
  useEffect(() => { localStorage.setItem('praxis-flow-log', JSON.stringify(praxisFlow)); }, [praxisFlow]);
  useEffect(() => { localStorage.setItem('praxis-activeTheme', JSON.stringify(activeTheme)); }, [activeTheme]);
  useEffect(() => { localStorage.setItem('praxis-customCategories', JSON.stringify(customCategories)); }, [customCategories]);

  useEffect(() => { setChatContext(goals); }, [goals]);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', activeTheme); }, [activeTheme]);

  useEffect(() => {
    const newStreak = calculateStreak(tasks);
    setDailyStreak(newStreak);
    setCompletionPercentage(getTodaysTaskCompletion(tasks));
    
    const prevStreak = prevStreakRef.current;
    if (newStreak > (prevStreak || 0) && newStreak > 1) {
        setToast({ message: `🔥 ${newStreak} Day Streak!`, visible: true });
    }
    prevStreakRef.current = newStreak;
  }, [tasks]);

   // Simulate checking for proactive health suggestions from Kiko AI
   useEffect(() => {
        const interval = setInterval(() => {
            const healthData: HealthData = parseHealthDataFromTasks(tasks);
            const suggestion = getProactiveHealthSuggestion(healthData, tasks);
            if (suggestion) {
                setToast({ message: suggestion, visible: true });
            }
        }, 30 * 60 * 1000); // Check every 30 minutes

        return () => clearInterval(interval);
   }, [tasks]);

  const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const addInsights = (newInsights: Insight[]) => {
    setInsights(prev => [...newInsights, ...prev]);
  }

  const applyInsight = (insightId: number) => {
    const insight = insights.find(i => i.id === insightId);
    if (insight && !insight.applied) {
        triggerHapticFeedback('light');
        setInsights(prev => prev.map(i => i.id === insightId ? { ...i, applied: true } : i));
        setPraxisFlow(log => [
            ...log,
            { id: Date.now(), reason: `Applied insight: "${insight.insightText.substring(0, 30)}..."`, points: insight.points, timestamp: new Date() }
        ]);
        const newTask: Omit<Task, 'id' | 'status'> = {
            title: insight.insightText,
            category: 'Prototyping',
            startTime: new Date(),
            plannedDuration: 60
        };
        addTask(newTask);
        setToast({ message: `Insight applied & task created!`, visible: true });
    }
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    if (viewingTask?.id === updatedTask.id) {
        setViewingTask(updatedTask);
    }
    // Simulate updating the event in Google Calendar
    if (updatedTask.googleCalendarEventId) {
        updateEventInCalendar(updatedTask);
    }
  };

  const triggerInsightGeneration = useCallback((task: Task, isRegeneration = false) => {
    const healthData = parseHealthDataFromTasks(tasks);
    const homeLocation = inferHomeLocation(tasks);

    // This is the "fire-and-forget" part of the async architecture.
    // The UI is already updated to show the loading state.
    generateActionableInsights(task, healthData, notes, homeLocation, goals, tasks, isRegeneration).then(insightData => {
        const finalTaskWithInsight: Task = { ...task, insights: insightData, isGeneratingInsights: false };
        updateTask(finalTaskWithInsight);
        
        // Don't show toast on initial load, only on regeneration.
        if (isRegeneration) {
            setToast({
                message: `✨ New insights ready for "${task.title}"`,
                visible: true,
                action: {
                    label: 'View',
                    onClick: () => {
                        setViewingTask(finalTaskWithInsight);
                        setToast({ message: '', visible: false });
                    }
                }
            });
        }
    }).catch(error => {
        console.error("Async insight generation failed:", error);
        const taskWithError: Task = { ...task, isGeneratingInsights: false, insights: { widgets: [{ type: 'text', title: 'Insight Error', icon: 'SparklesIcon', content: 'Kiko had trouble generating insights. Please try regenerating.' }] } };
        updateTask(taskWithError);
        setToast({ message: 'Could not generate insights.', visible: true });
    });
  }, [tasks, notes, goals]);

  const handleCompleteTask = async (taskId: number) => {
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (!taskToComplete) return;

    triggerHapticFeedback('success');
    
    const actualDuration = getActualDuration(taskToComplete);

    // Optimistically update UI
    const tempCompletedTask: Task = {
        ...taskToComplete, status: TaskStatus.Completed, undoStatus: taskToComplete.status, actualDuration, completionImageUrl: 'loading'
    };
    updateTask(tempCompletedTask);
    if (viewingTask?.id === taskId) setViewingTask(null);

    // AI Generations in parallel, now routed through the Kiko "Muse" Agent
    const [imageResult, summaryResult] = await Promise.all([
        kikoRequest('generate_completion_image', { task: taskToComplete }),
        kikoRequest('generate_completion_summary', { task: taskToComplete })
    ]);
    
    if (summaryResult.fallbackUsed) {
        showToast("Kiko is using a backup model for this summary.");
    }

    // Final update with all AI content
    let finalCompletedTask: Task = { ...tempCompletedTask, completionImageUrl: imageResult.data, completionSummary: summaryResult.data, isGeneratingInsights: true };
    updateTask(finalCompletedTask);
    
    // Trigger background insight generation for the *completed* task
    triggerInsightGeneration(finalCompletedTask);
    
    // Award points
    const points = Math.round(actualDuration / 5) + 10;
    setPraxisFlow(log => [...log, { id: Date.now(), reason: `Completed: "${finalCompletedTask.title}"`, points, timestamp: new Date() }]);
    setToast({ message: `+${points} Flow! Task Complete!`, visible: true });
};
  
  const handleUndoCompleteTask = (taskId: number) => {
    triggerHapticFeedback('light');
    setTasks(prevTasks =>
        prevTasks.map(task => {
            if (task.id === taskId && task.status === TaskStatus.Completed) {
                // BUG FIX: Correctly revert state.
                return {
                    ...task,
                    status: task.undoStatus || TaskStatus.Pending,
                    undoStatus: undefined,
                    actualDuration: undefined,
                    completionImageUrl: undefined,
                    completionSummary: undefined,
                    insights: null, // Clear insights as they were for the completed state
                };
            }
            return task;
        })
    );
  };
  
  const updateNote = (updatedNote: Note) => {
    setNotes(prevNotes => prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note));
  };
  
  const addNote = (title: string, content: string, notebookId: number) => {
    const newNote: Note = {
      id: Date.now(), notebookId, title, content,
      createdAt: new Date(), archived: false, flagged: false,
      tags: ['ai-briefing', 'summary'],
    };
    setNotes(prev => [newNote, ...prev]);
    setScreen('Notes'); // Switch to notes screen to show the new note
    setToast({ message: `Insight saved to notes!`, visible: true });
  };

  const deleteNote = (noteId: number) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }
  
  const addTask = (taskDetails: Partial<Task> & { title: string }) => {
      // Add custom category to the list if it's new
      if (taskDetails.category && !DEFAULT_CATEGORIES.includes(taskDetails.category) && !customCategories.includes(taskDetails.category)) {
          setCustomCategories(prev => [...prev, taskDetails.category!]);
      }

      const now = new Date();
      const newTask: Task = {
          id: Date.now(),
          status: TaskStatus.Pending,
          category: 'Prototyping',
          plannedDuration: 60,
          startTime: new Date(now.setHours(now.getHours() + 1)),
          ...taskDetails,
      };

      setTasks(prevTasks => {
          return [...prevTasks, newTask].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      });
      
      // Simulate adding the event to Google Calendar
      if (!newTask.googleCalendarEventId) { // Avoid duplicates
        addEventToCalendar(newTask);
      }
  };

  const handleCalendarSync = async () => {
    setToast({ message: 'Syncing with Google Calendar...', visible: true });
    const calendarTasks = await syncCalendar();
    
    setTasks(prevTasks => {
        const existingGcalIds = new Set(prevTasks.map(t => t.googleCalendarEventId).filter(Boolean));
        const newTasks = calendarTasks.filter(ct => !existingGcalIds.has(ct.googleCalendarEventId));
        
        const tasksToAdd = newTasks.map(ct => ({
            id: Date.now() + Math.random(),
            status: TaskStatus.Pending,
            ...ct
        } as Task));

        if (tasksToAdd.length > 0) {
            setToast({ message: `Synced ${tasksToAdd.length} new event(s)!`, visible: true });
            return [...prevTasks, ...tasksToAdd].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        } else {
            setToast({ message: 'Calendar is up to date!', visible: true });
            return prevTasks;
        }
    });
  };

  const handleSendMessage = async (message: string, attachment?: ChatMessage['attachment']) => {
    if ((!message.trim() && !attachment) || isAiReplying) return;

    const userMessage: ChatMessage = { role: 'user', text: message, attachment };
    const newMessages: ChatMessage[] = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setIsAiReplying(true);

    let responseText;
    if (attachment) {
        // Route image analysis to the Vision Agent via the orchestrator
        const result = await kikoRequest('analyze_image', {
            base64: attachment.base64,
            mimeType: attachment.mimeType,
            prompt: message
        });
        responseText = result.data;
    } else {
        // Standard text chat goes to the Gemini chat model
        responseText = await continueChat(newMessages);
    }
    
    setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsAiReplying(false);
  }
  
  const redirectToKikoAIWithChat = (history: ChatMessage[]) => {
      setChatMessages(history);
      setScreen('KikoAI');
  };

  const startChatWithContext = (context: string, type: 'note' | 'suggestion' | 'theme' | 'selection') => {
      setScreen('KikoAI');
      let initialPrompt = `User wants to discuss: ${context}`;
      let initialBotMessage = `Let's talk about it. What's on your mind?`;
      const history: ChatMessage[] = [{ role: 'user', text: initialPrompt }, { role: 'model', text: initialBotMessage }];
      setChatMessages(history);
  }
  
  const purchaseReward = (rewardId: string) => {
    const reward = REWARDS_CATALOG.find(r => r.id === rewardId);
    if (!reward || purchasedRewards.includes(rewardId)) return;
    if (totalFlow >= reward.cost) {
        triggerHapticFeedback('success');
        setPurchasedRewards(prev => [...prev, rewardId]);
        setPraxisFlow(log => [
            ...log,
            { id: Date.now(), reason: `Purchased: "${reward.name}"`, points: -reward.cost, timestamp: new Date() }
        ]);
        setToast({ message: `Unlocked: ${reward.name}!`, visible: true });
        
        if (reward.type === 'theme') {
            setActiveTheme(reward.value);
        }
    } else {
        setToast({ message: 'Not enough Flow!', visible: true });
    }
  };

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const renderScreen = () => {
    switch (screen) {
      case 'Dashboard': return <Dashboard tasks={tasks} notes={notes} goals={goals} praxisFlow={totalFlow} dailyStreak={dailyStreak} completionPercentage={completionPercentage} setScreen={setScreen} />;
      case 'Schedule': return <Schedule tasks={tasks} updateTask={updateTask} onViewTask={setViewingTask} addTask={addTask} projects={projects} notes={notes} onUndoTask={handleUndoCompleteTask} onCompleteTask={handleCompleteTask} categories={allCategories} onSyncCalendar={handleCalendarSync} showToast={showToast} />;
      case 'Notes': return <Notes notes={notes} setNotes={setNotes} notebooks={notebooks} setNotebooks={setNotebooks} addInsights={addInsights} updateNote={updateNote} addTask={(title, notebookId) => addTask({title, category: 'Prototyping', plannedDuration: 60, notebookId, startTime: new Date()})} startChatWithContext={startChatWithContext} />;
      case 'KikoAI': return <PraxisAI insights={insights} setInsights={setInsights} tasks={tasks} notes={notes} notebooks={notebooks} addTask={(title) => addTask({title, category: 'Prototyping', plannedDuration: 60, startTime: new Date()})} startChatWithContext={startChatWithContext} searchHistory={searchHistory} setSearchHistory={setSearchHistory} visionHistory={visionHistory} setVisionHistory={setVisionHistory} addNote={addNote} goals={goals} setGoals={setGoals} applyInsight={applyInsight} chatMessages={chatMessages} setChatMessages={setChatMessages} onSendMessage={handleSendMessage} isAiReplying={isAiReplying} projects={projects} healthData={parseHealthDataFromTasks(tasks)} showToast={showToast} />;
      case 'Profile': return <Profile isDarkMode={isDarkMode} toggleTheme={toggleTheme} onLogout={() => setIsAuthenticated(false)} praxisFlow={totalFlow} setScreen={setScreen} />;
      case 'Rewards': return <Rewards onBack={() => setScreen('Profile')} praxisFlow={totalFlow} purchasedRewards={purchasedRewards} activeTheme={activeTheme} setActiveTheme={setActiveTheme} onPurchase={purchaseReward} />;
      default: return <Dashboard tasks={tasks} notes={notes} goals={goals} praxisFlow={totalFlow} dailyStreak={dailyStreak} completionPercentage={completionPercentage} setScreen={setScreen} />;
    }
  };
  
  if (!isAuthenticated) return <Auth onLogin={() => setIsAuthenticated(true)} Logo={PraxisLogo} />;
  if (!isOnboardingComplete) return <Onboarding goals={goals} setGoals={setGoals} onComplete={() => setIsOnboardingComplete(true)} />;

  return (
    <div className="min-h-screen text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg">
      <AnimatePresence>
        {toast.visible && <Toast message={toast.message} action={toast.action} onClose={() => setToast({ ...toast, visible: false })} />}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTask && <EventDetail task={viewingTask} allTasks={tasks} notes={notes} notebooks={notebooks} projects={projects} goals={goals} updateTask={updateTask} onClose={() => setViewingTask(null)} onComplete={() => handleCompleteTask(viewingTask.id)} redirectToKikoAIWithChat={redirectToKikoAIWithChat} addNote={addNote} categories={allCategories} triggerInsightGeneration={triggerInsightGeneration} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 pb-28">
         <AppHeader />
        <main>
           <AnimatePresence mode="wait">
                <motion.div
                    key={screen}
                    variants={screenVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={{ duration: 0.3 }}
                >
                    {renderScreen()}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
       <Navigation activeScreen={screen} setScreen={setScreen} />
    </div>
  );
};

export default App;