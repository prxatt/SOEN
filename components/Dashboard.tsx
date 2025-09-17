import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: Import Variants type from framer-motion to correctly type animation variants.
import { motion, Variants, AnimatePresence } from 'framer-motion';
// FIX: Import XAxis and YAxis from recharts for use in the BarChart component.
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Tooltip, XAxis, YAxis, LineChart, Line, Area, AreaChart, PieChart, Pie } from 'recharts';
import { Screen, Task, Note, HealthData, Goal, Category, MissionBriefing } from '../types';
import { 
    SparklesIcon, BrainCircuitIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon, ArrowRightIcon,
    HeartIcon, BoltIcon, PlayIcon, PauseIcon, ClockIcon, BellIcon
} from './Icons';
import * as Icons from './Icons'; // For dynamic icon loading

interface DashboardProps {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    briefing: MissionBriefing;
    goals: Goal[];
    setFocusTask: (task: Task | null) => void;
    dailyCompletionImage: string | null;
    categoryColors: Record<Category, string>;
    isBriefingLoading: boolean;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
    inferredLocation: string | null;
    onCompleteTask: (taskId: number, actualDuration: number) => void;
}

// FIX: Explicitly type animation variants with the Variants type to prevent type inference issues.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  },
};

// FIX: Explicitly type animation variants with the Variants type to prevent type inference issues.
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

// Local helper: choose readable text color for a given hex background
const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
  if (!hexColor || !hexColor.startsWith('#')) return 'black';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Kiko's Contextual Wisdom Generator
const useKikoWisdom = (tasks: Task[], healthData: HealthData, notes: Note[]) => {
  const [wisdom, setWisdom] = useState<{quote: string, context: string, type: 'philosopher' | 'silly' | 'partner' | 'companion'}>({quote: '', context: '', type: 'companion'});
  const [isLoading, setIsLoading] = useState(true);
  const lastGeneratedDate = useRef<string>('');
  const quoteCount = useRef<number>(0);

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Check if we already generated quotes today (max 8, min 3)
    if (lastGeneratedDate.current === today && wisdom.quote) {
      setIsLoading(false);
      return;
    }

    // Reset quote count for new day
    if (lastGeneratedDate.current !== today) {
      quoteCount.current = 0;
      lastGeneratedDate.current = today;
    }

    // Generate contextual wisdom based on user's current state
    const generateContextualWisdom = () => {
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const isStressed = healthData.energyLevel === 'low' || healthData.sleepQuality === 'poor';
      const hasNotes = notes.length > 0;
      const isEvening = new Date().getHours() >= 18;

      // Contextual wisdom based on user's state
      if (isStressed) {
        return {
          philosopher: "In the midst of chaos, there is also opportunity. - Sun Tzu",
          silly: "Even penguins need a break! Take a deep breath and waddle through it! 🐧",
          partner: "Hey partner, stress is just your brain's way of saying 'I care too much.' Let's channel that energy!",
          companion: "I see you're feeling overwhelmed. Remember, even the strongest waves need to rest on the shore."
        };
      } else if (completionRate === 100) {
        return {
          philosopher: "Excellence is not a destination; it is a continuous journey that never ends. - Brian Tracy",
          silly: "Look at you go! You're more productive than a penguin with a fish! 🐧✨",
          partner: "Crushing it today! Want to celebrate with a victory dance? I'll do the penguin shuffle!",
          companion: "Your dedication today was beautiful to witness. You should be proud of yourself."
        };
      } else if (completionRate < 50) {
        return {
          philosopher: "The way to get started is to quit talking and begin doing. - Walt Disney",
          silly: "Procrastination is like a penguin sliding on ice - fun at first, but you'll eventually hit a wall! 🐧",
          partner: "Come on, let's tackle this together! I believe in you more than I believe in fish!",
          companion: "Every small step counts. Let's start with just one task and build from there."
        };
      } else if (isEvening) {
        return {
          philosopher: "The day is what you make it. So why not make it a great one? - Steve Jobs",
          silly: "Evening time! Time to reflect on the day like a penguin looking at its reflection in the ice! 🐧",
          partner: "How about we wind down together? Maybe share what you learned today?",
          companion: "As the day ends, remember that tomorrow is a fresh start full of new possibilities."
        };
      } else {
        return {
          philosopher: "The only way to do great work is to love what you do. - Steve Jobs",
          silly: "Ready to waddle through another amazing day? Let's make it count! 🐧",
          partner: "Good morning, partner! What adventure are we going on today?",
          companion: "I'm here with you every step of the way. Together, we can achieve anything."
        };
      }
    };

    const wisdomTypes = ['philosopher', 'silly', 'partner', 'companion'] as const;
    const randomType = wisdomTypes[Math.floor(Math.random() * wisdomTypes.length)];
    const contextualWisdom = generateContextualWisdom();
    
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isStressed = healthData.energyLevel === 'low' || healthData.sleepQuality === 'poor';
    const hasNotes = notes.length > 0;
    
    const wisdomData = {
      quote: contextualWisdom[randomType],
      context: `Based on your ${completionRate > 0 ? `${Math.round(completionRate)}% task completion` : 'current state'}, ${isStressed ? 'stress levels' : 'productivity'}, and ${hasNotes ? 'recent notes' : 'daily routine'}`,
      type: randomType
    };
    
    // Simulate AI processing time
    const timeoutId = setTimeout(() => {
      setWisdom(wisdomData);
      quoteCount.current++;
      setIsLoading(false);
    }, 1500);

    // Cleanup to avoid state updates on unmounted component
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tasks, healthData, notes]);

  return { wisdom, isLoading };
};

// Animated Temperature Icon Component
const AnimatedTemperatureIcon = ({ temp, code }: { temp: number | null, code: number | null }) => {
  const getIconForCode = (code: number | null) => {
    if (code === null) return '🌡️';
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '⛈️';
    if (code >= 95) return '⛈️';
    return '🌡️';
  };

  const getColorForTemp = (temp: number | null) => {
    if (temp === null) return '#6B7280';
    if (temp < 0) return '#3B82F6'; // Blue for cold
    if (temp < 10) return '#06B6D4'; // Cyan for cool
    if (temp < 20) return '#10B981'; // Green for mild
    if (temp < 30) return '#F59E0B'; // Yellow for warm
    return '#EF4444'; // Red for hot
  };

  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="text-3xl"
        animate={{ 
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        {getIconForCode(code)}
      </motion.div>
      <div className="text-right">
        <motion.div 
          className="text-3xl font-bold font-display"
          style={{ color: getColorForTemp(temp) }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {temp !== null ? Math.round(temp) : '—'}°
        </motion.div>
        <motion.div 
          className="text-xs text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {code !== null ? (code === 0 ? 'Clear' : code <= 3 ? 'Partly Cloudy' : 'Weather') : '—'}
        </motion.div>
      </div>
    </motion.div>
  );
};

function WeatherMini() {
    const [loading, setLoading] = useState(true);
    const [tempC, setTempC] = useState<number | null>(null);
    const [code, setCode] = useState<number | null>(null);
    const [location, setLocation] = useState<string>('');

    React.useEffect(() => {
        const fallback = { lat: 37.7749, lon: -122.4194, city: 'San Francisco' }; // SF fallback
        const fetchWeather = async (lat: number, lon: number, city?: string) => {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
                const res = await fetch(url);
                const data = await res.json();
                setTempC(data?.current?.temperature_2m ?? null);
                setCode(data?.current?.weather_code ?? null);
                
                // Get city name from coordinates
                if (!city) {
                    try {
                        const reverseGeocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
                        const geoRes = await fetch(reverseGeocodeUrl);
                        const geoData = await geoRes.json();
                        setLocation(geoData.city || geoData.locality || 'Unknown');
                    } catch {
                        setLocation('Unknown');
                    }
                } else {
                    setLocation(city);
                }
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => fetchWeather(fallback.lat, fallback.lon, fallback.city),
                { maximumAge: 600000, timeout: 8000 }
            );
        } else {
            fetchWeather(fallback.lat, fallback.lon, fallback.city);
        }
    }, []);

    return (
        <motion.div 
          className="card rounded-2xl px-4 py-3 border border-border min-w-[180px] sm:min-w-[200px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="text-right flex-1">
                <div className="w-12 h-6 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <motion.div
                className="text-2xl sm:text-3xl"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                {code !== null ? (code === 0 ? '☀️' : code <= 3 ? '⛅' : '🌧️') : '🌡️'}
              </motion.div>
              <div className="text-right flex-1">
                <motion.div 
                  className="text-2xl sm:text-3xl font-bold font-display"
                  style={{ color: tempC !== null ? (tempC < 0 ? '#3B82F6' : tempC < 10 ? '#06B6D4' : tempC < 20 ? '#10B981' : tempC < 30 ? '#F59E0B' : '#EF4444') : '#6B7280' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {tempC !== null ? Math.round(tempC) : '—'}°
                </motion.div>
                <motion.div 
                  className="text-xs text-text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {location || 'Loading...'}
                </motion.div>
        </div>
            </div>
          )}
        </motion.div>
    );
}

const Header = ({ tasksTodayCount, nextTask, categoryColors, tasks, healthData, notes }: { 
    tasksTodayCount: number, 
    nextTask?: Task, 
    categoryColors: Record<Category, string>,
    tasks: Task[],
    healthData: HealthData,
    notes: Note[]
}) => {
    const today = new Date();
    const bgColor = nextTask ? (categoryColors[nextTask.category] || '#374151') : '#374151';
    const textColor = getTextColorForBackground(bgColor);
    const { wisdom, isLoading: wisdomLoading } = useKikoWisdom(tasks, healthData, notes);
    
    return (
        <motion.div variants={itemVariants} className="col-span-full mb-6">
            <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl" style={{ backgroundColor: bgColor, color: textColor }}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/20 transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 transform -translate-x-12 translate-y-12"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <motion.p 
                                className="text-lg opacity-80 mb-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 0.8, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </motion.p>
                            
                            <motion.h1 
                                className="text-5xl sm:text-6xl font-bold font-display tracking-tight leading-tight"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                        {getGreeting()}, Pratt.
                            </motion.h1>
                            
                            <motion.p 
                                className="text-lg sm:text-xl font-display opacity-90 mt-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 0.9, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                        You have {tasksTodayCount} mission{tasksTodayCount !== 1 ? 's' : ''} today.
                            </motion.p>

                            {/* Kiko's Contextual Wisdom */}
                            <motion.div 
                                className="mt-6 p-4 rounded-2xl backdrop-blur-sm border border-white/20"
                                style={{ backgroundColor: textColor === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <div className="flex items-start gap-3">
                                    <motion.div
                                        className="text-2xl"
                                        animate={{ 
                                            rotate: [0, 5, -5, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ 
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 4
                                        }}
                                    >
                                        🐧
                                    </motion.div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold opacity-80">Kiko's Wisdom</p>
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/20 capitalize">
                                                {wisdom.type}
                                            </span>
                    </div>
                                        {wisdomLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                                                <div className="h-4 bg-white/20 rounded animate-pulse w-3/4"></div>
                </div>
                                        ) : (
                                            <div>
                                                <motion.p 
                                                    className="text-sm italic leading-relaxed mb-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    "{wisdom.quote}"
                                                </motion.p>
                                                <p className="text-xs opacity-70">{wisdom.context}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="hidden sm:block">
                    <WeatherMini />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Next Up Component with One-Tap Complete and Focus Mode
const NextUpCard = ({ todayTasks, tomorrowTasks, navigateToScheduleDate, categoryColors, setFocusTask, onCompleteTask }: {
    todayTasks: Task[],
    tomorrowTasks: Task[],
    navigateToScheduleDate: (date: Date) => void,
    categoryColors: Record<Category, string>,
    setFocusTask: (task: Task | null) => void,
    onCompleteTask: (taskId: number, actualDuration: number) => void,
}) => {
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
    const tasksToShow = activeTab === 'today' ? todayTasks : tomorrowTasks;
    const nextTask = todayTasks.find(t => t.status !== 'Completed');

    const handleTaskClick = (task: Task) => {
        navigateToScheduleDate(new Date(task.startTime));
    };

    const handleCompleteTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        onCompleteTask(task.id, task.plannedDuration);
    };

    const handleFocusTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setFocusTask(task);
    };

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-6 col-span-full md:col-span-2 row-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                    <button 
                        onClick={() => setActiveTab('today')} 
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'today' 
                                ? 'bg-black text-white shadow-sm' 
                                : 'text-zinc-600 dark:text-zinc-300 hover:text-text hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                    >
                        Today ({todayTasks.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('tomorrow')} 
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'tomorrow' 
                                ? 'bg-black text-white shadow-sm' 
                                : 'text-zinc-600 dark:text-zinc-300 hover:text-text hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                    >
                        Tomorrow ({tomorrowTasks.length})
                    </button>
                </div>
                {nextTask && (
                    <motion.button 
                        onClick={() => setFocusTask(nextTask)}
                        className="text-sm font-semibold px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Focus Mode
                    </motion.button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3">
                {tasksToShow.length > 0 ? tasksToShow.map((task, index) => (
                    <motion.div
                        key={task.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group"
                    >
                        <div 
                            className="w-full text-left p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer relative overflow-hidden"
                            style={{ 
                                backgroundColor: (categoryColors[task.category] || '#111827'), 
                                color: getTextColorForBackground(categoryColors[task.category] || '#111827') 
                            }}
                        onClick={() => handleTaskClick(task)}
                        >
                            {/* Background gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10 flex items-center gap-4 w-full">
                                <div className="flex flex-col items-center min-w-[60px]">
                            <p className="font-bold text-lg">{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                    <p className="text-xs opacity-80">{task.plannedDuration}min</p>
                        </div>
                                
                                <div className="w-1 h-12 rounded-full opacity-60" style={{ 
                                    backgroundColor: getTextColorForBackground(categoryColors[task.category] || '#111827') === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)' 
                                }}/>
                                
                                <div className="flex-1">
                                    <p className={`font-bold text-lg ${task.status === 'Completed' ? 'line-through opacity-80' : ''}`}>
                                        {task.title}
                                    </p>
                                    <p className="text-sm opacity-80 capitalize">{task.category}</p>
                        </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {task.status !== 'Completed' && (
                                        <>
                                            <motion.button
                                                onClick={(e) => handleCompleteTask(task, e)}
                                                className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Complete Task"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                    </motion.button>
                                            <motion.button
                                                onClick={(e) => handleFocusTask(task, e)}
                                                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Focus Mode"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                        </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <CalendarDaysIcon className="w-16 h-16 mb-4 opacity-50 mx-auto"/>
                            <p className="font-semibold text-lg mb-2">No tasks scheduled for {activeTab}.</p>
                            <p className="text-sm opacity-70">Add some tasks to get started!</p>
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Enhanced Kiko Insights Component
const KikoInsightsCard = ({ tasks, notes, healthData, briefing, isLoading }: { 
    tasks: Task[], 
    notes: Note[], 
    healthData: HealthData, 
    briefing: MissionBriefing, 
    isLoading: boolean 
}) => {
    const [isCompleted, setIsCompleted] = useState(false);
    const [selectedInsight, setSelectedInsight] = useState<number | null>(null);
    
    const todayTasks = useMemo(() => {
        const today = new Date();
        return tasks.filter(t => new Date(t.startTime).toDateString() === today.toDateString());
    }, [tasks]);
    
    const completedTasks = useMemo(() => {
        return todayTasks.filter(t => t.status === 'Completed');
    }, [todayTasks]);
    
    const completionRate = useMemo(() => {
        return todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;
    }, [todayTasks, completedTasks]);
    
    useEffect(() => {
        setIsCompleted(completionRate === 100);
    }, [completionRate]);
    
    const generateKikoInsights = () => {
        const hasURLs = tasks.some(t => t.title.includes('http'));
        const hasMeetings = tasks.some(t => t.title.toLowerCase().includes('meeting') || t.title.toLowerCase().includes('call'));
        const isLearning = tasks.some(t => t.category === 'Learning' || t.title.toLowerCase().includes('learn'));
        const isWorkingOut = tasks.some(t => t.title.toLowerCase().includes('workout') || t.title.toLowerCase().includes('exercise'));
        const isStressed = healthData.energyLevel === 'low' || healthData.sleepQuality === 'poor';
        
        if (isCompleted) {
            return {
                title: "Kiko Insights",
                subtitle: "Daily Review Complete",
                keyTakeaway: "You've achieved something remarkable today - complete task execution with precision and focus.",
                goalsAndObjectives: [
                    "Review what you learned today to reinforce knowledge retention",
                    "Identify patterns that led to today's success for future replication",
                    "Plan tomorrow's most important task to maintain momentum"
                ],
                actionableInsights: [
                    {
                        title: "How to tackle tomorrow's tasks",
                        content: "Based on today's success, start with your highest priority task when energy is at its peak. Use the same focus techniques that worked today.",
                        monetizable: false
                    },
                    {
                        title: "Mindful attention areas",
                        content: "Pay special attention to maintaining the same energy management patterns that led to today's success.",
                        monetizable: false
                    },
                    {
                        title: "Real-world applications",
                        content: "Today's productivity patterns could be applied to larger projects. Consider scaling these techniques for bigger goals.",
                        monetizable: true
                    }
                ]
            };
        } else {
            return {
                title: "Kiko Insights",
                subtitle: "Task Support & Insights",
                keyTakeaway: `You have ${todayTasks.length - completedTasks.length} tasks remaining. Focus on your highest priority task to maintain momentum.`,
                goalsAndObjectives: [
                    "Complete your highest priority task first",
                    "Break down complex tasks into smaller, manageable chunks",
                    "Take strategic breaks to maintain energy levels"
                ],
                actionableInsights: [
                    {
                        title: "How to tackle your next task",
                        content: hasMeetings ? "Prepare talking points and key questions for your upcoming meeting. Review any shared documents beforehand." : 
                                isLearning ? "Create a structured learning plan. Take notes and practice what you learn immediately." :
                                "Start with the most challenging task when your energy is highest. Use the Pomodoro technique for focused work.",
                        monetizable: false
                    },
                    {
                        title: "Smart insights for success",
                        content: isStressed ? "Your stress levels are elevated. Consider taking a 10-minute break for deep breathing or a short walk before continuing." :
                                isWorkingOut ? "Remember to hydrate properly and consider your pre-workout nutrition. Track your performance metrics." :
                                "Eliminate distractions during deep work periods. Use focus techniques that have worked for you before.",
                        monetizable: false
                    },
                    {
                        title: "Real-world monetizable ideas",
                        content: isLearning ? "Consider creating content or teaching others about what you're learning. This could lead to consulting opportunities or content creation revenue." :
                                hasURLs ? "The resources you're accessing could be compiled into a valuable resource list or course for others in your field." :
                                "Your current tasks could be systematized into a process that others would pay for. Consider documenting your approach.",
                        monetizable: true
                    }
                ]
            };
        }
    };
    
    const insights = generateKikoInsights();
    
    return (
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-6 col-span-full flex flex-col bg-gradient-to-br from-gray-900/20 to-black/20 border border-gray-700/20 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="p-2 rounded-full bg-gradient-to-r from-gray-800 to-gray-600 shadow-lg"
                        animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                        }}
                    >
                        <BrainCircuitIcon className="w-6 h-6 text-white"/>
                    </motion.div>
                    <div>
                        <h3 className="text-xl font-bold font-display text-white">{insights.title}</h3>
                        <p className="text-sm text-gray-400">{insights.subtitle}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{Math.round(completionRate)}%</div>
                    <div className="text-xs text-gray-400">Complete</div>
                </div>
            </div>
            
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <motion.div
                            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-gray-400">Kiko is analyzing your day...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Key Takeaway */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30">
                        <h4 className="font-semibold mb-2 text-white flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-yellow-400"/>
                            Key Takeaway
                        </h4>
                        <p className="text-sm text-gray-200">{insights.keyTakeaway}</p>
                            </div>
                    
                    {/* Goals and Objectives */}
                    <div>
                        <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                            <BoltIcon className="w-4 h-4 text-blue-400"/>
                            Goals & Objectives
                        </h4>
                        <div className="space-y-2">
                            {insights.goalsAndObjectives.map((goal, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/40 transition-colors cursor-pointer"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-gray-200">{goal}</p>
                                </motion.div>
                        ))}
                    </div>
                    </div>
                    
                    {/* Actionable Insights */}
                    <div>
                        <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                            <FireIcon className="w-4 h-4 text-orange-400"/>
                            Actionable Insights
                        </h4>
                        <div className="space-y-3">
                            {insights.actionableInsights.map((insight, index) => (
                                <motion.div
                                    key={index}
                                    className="p-4 rounded-xl bg-gray-800/30 hover:bg-gray-700/30 transition-colors cursor-pointer border border-gray-600/20"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: (index + insights.goalsAndObjectives.length) * 0.1 }}
                                    onClick={() => setSelectedInsight(selectedInsight === index + insights.goalsAndObjectives.length ? null : index + insights.goalsAndObjectives.length)}
                                >
                                    <div className="flex items-start justify-between">
                                        <h5 className="font-medium text-white text-sm">{insight.title}</h5>
                                        {insight.monetizable && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                                💰 Monetizable
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 mt-2">{insight.content}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Health Insights Component
const HealthInsightsCard = ({ healthData }: { healthData: HealthData }) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    
    const healthMetrics = [
        {
            name: 'Sleep Quality',
            value: healthData.avgSleepHours,
            target: 8,
            unit: 'hours',
            color: healthData.sleepQuality === 'good' ? '#10B981' : healthData.sleepQuality === 'fair' ? '#F59E0B' : '#EF4444',
            insights: healthData.sleepQuality === 'good' ? 
                "Excellent sleep quality! Your rest patterns are supporting optimal cognitive function." :
                healthData.sleepQuality === 'fair' ?
                "Your sleep could be improved. Consider establishing a consistent bedtime routine." :
                "Poor sleep quality detected. Consider reducing screen time before bed and creating a relaxing environment."
        },
        {
            name: 'Energy Levels',
            value: healthData.energyLevel,
            target: 'high',
            unit: 'level',
            color: healthData.energyLevel === 'high' ? '#22C55E' : healthData.energyLevel === 'medium' ? '#F59E0B' : '#EF4444',
            insights: healthData.energyLevel === 'high' ?
                "High energy levels! Perfect time for challenging tasks and creative work." :
                healthData.energyLevel === 'medium' ?
                "Moderate energy levels. Focus on medium-complexity tasks and take breaks as needed." :
                "Low energy detected. Consider light tasks, hydration, and a short walk to boost energy."
        },
        {
            name: 'Workout Intensity',
            value: healthData.totalWorkouts,
            target: 5,
            unit: 'sessions',
            color: '#3B82F6',
            insights: healthData.totalWorkouts >= 5 ?
                "Great workout consistency! Your fitness routine is supporting overall health." :
                "Consider increasing workout frequency. Even short sessions can boost energy and focus."
        }
    ];

    const getHealthRecommendations = () => {
        const recommendations = [];
        
        if (healthData.sleepQuality === 'poor') {
            recommendations.push("Create a bedtime routine: no screens 1 hour before bed, cool room temperature, and relaxation techniques.");
        }
        
        if (healthData.energyLevel === 'low') {
            recommendations.push("Consider a 10-minute walk outside, proper hydration, and a healthy snack to boost energy naturally.");
        }
        
        if (healthData.totalWorkouts < 3) {
            recommendations.push("Start with 15-minute daily walks or bodyweight exercises. Small consistent actions build momentum.");
        }
        
        if (healthData.avgSleepHours < 7) {
            recommendations.push("Aim for 7-9 hours of sleep. Quality rest is essential for decision-making and task performance.");
        }
        
        return recommendations.length > 0 ? recommendations : ["Your health metrics look great! Keep maintaining these positive patterns."];
    };

                            return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-6 col-span-full md:col-span-1">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-white">
                    <HeartIcon className="w-6 h-6 text-red-400"/>
                    Health Insights
                </h3>
                <div className="text-sm text-gray-400">
                    Real-time analysis
                                </div>
                    </div>

            <div className="space-y-4">
                {healthMetrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                            selectedMetric === metric.name 
                                ? 'ring-2 ring-blue-500 bg-gray-800/50' 
                                : 'bg-gray-800/30 hover:bg-gray-700/40'
                        }`}
                        onClick={() => setSelectedMetric(selectedMetric === metric.name ? null : metric.name)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-white">{metric.name}</h4>
                            <div className="text-xs text-gray-400">
                                {typeof metric.value === 'number' ? `${metric.value.toFixed(1)}/${metric.target}${metric.unit}` : metric.value}
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                            <motion.div
                                className="h-2 rounded-full"
                                style={{ backgroundColor: metric.color }}
                                initial={{ width: 0 }}
                                animate={{ width: typeof metric.value === 'number' ? `${Math.min((metric.value / metric.target) * 100, 100)}%` : '100%' }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                        </div>

                        <p className="text-xs text-gray-300">{metric.insights}</p>
                    </motion.div>
                ))}
            </div>

            {/* Health Recommendations */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30">
                <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-yellow-400"/>
                    Health Recommendations
                </h4>
                <div className="space-y-2">
                    {getHealthRecommendations().map((rec, index) => (
                        <motion.div
                            key={index}
                            className="flex items-start gap-3 p-2 rounded-xl bg-gray-700/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-200">{rec}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Habits Tracking Component with 30-day Calendar View
const HabitsTrackingCard = ({ healthData }: { healthData: HealthData }) => {
    const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
    
    // Generate 30-day habit data for visualization
    const generateHabitData = (habitType: string) => {
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const isCompleted = Math.random() > 0.3; // 70% completion rate
            data.push({
                date: date.toISOString().split('T')[0],
                completed: isCompleted,
                day: date.getDate(),
                dayOfWeek: date.getDay()
            });
        }
        return data;
    };

    const habits = [
        { 
            name: 'Exercise', 
            value: healthData.totalWorkouts, 
            target: 5, 
            unit: 'sessions', 
            color: '#3B82F6',
            data: generateHabitData('exercise')
        },
        { 
            name: 'Meditation', 
            value: 3, 
            target: 7, 
            unit: 'sessions', 
            color: '#8B5CF6',
            data: generateHabitData('meditation')
        },
        { 
            name: 'Reading', 
            value: 4, 
            target: 7, 
            unit: 'sessions', 
            color: '#10B981',
            data: generateHabitData('reading')
        },
        { 
            name: 'Journaling', 
            value: 2, 
            target: 5, 
            unit: 'sessions', 
            color: '#F59E0B',
            data: generateHabitData('journaling')
        }
    ];

    const getConsistencyColor = (completed: boolean) => {
        return completed ? '#10B981' : '#EF4444';
    };

    const renderCalendarView = (habitData: any[]) => {
        const weeks = [];
        for (let i = 0; i < 30; i += 7) {
            weeks.push(habitData.slice(i, i + 7));
        }
        
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="p-1">{day}</div>
                    ))}
                </div>
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIndex) => (
                            <motion.div
                                key={dayIndex}
                                className="w-6 h-6 rounded-full cursor-pointer hover:scale-125 transition-transform flex items-center justify-center text-xs"
                                style={{ backgroundColor: getConsistencyColor(day.completed) }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.1, delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                                title={`${day.day}: ${day.completed ? 'Completed' : 'Missed'}`}
                            >
                                <span className="text-white text-xs font-medium">{day.day}</span>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-6 col-span-full md:col-span-1">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-white">
                    <ClockIcon className="w-6 h-6 text-blue-400"/>
                    Habits Tracking
                </h3>
                <div className="text-sm text-gray-400">
                    30-day calendar
                </div>
            </div>

            <div className="space-y-4">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                            selectedHabit === habit.name 
                                ? 'ring-2 ring-blue-500 bg-gray-800/50' 
                                : 'bg-gray-800/30 hover:bg-gray-700/40'
                        }`}
                        onClick={() => setSelectedHabit(selectedHabit === habit.name ? null : habit.name)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-white">{habit.name}</h4>
                            <div className="text-xs text-gray-400">
                                {habit.value}/{habit.target} {habit.unit}
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                            <motion.div
                                className="h-2 rounded-full"
                                style={{ backgroundColor: habit.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((habit.value / habit.target) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                        </div>

                        {/* Mini Calendar Preview */}
                        <div className="grid grid-cols-7 gap-1">
                            {habit.data.slice(-7).map((day, dayIndex) => (
                                <motion.div
                                    key={dayIndex}
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getConsistencyColor(day.completed) }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: (index * 0.1) + (dayIndex * 0.02) }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Calendar View for Selected Habit */}
            <AnimatePresence>
                {selectedHabit && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 p-4 bg-gray-800/40 rounded-2xl"
                    >
                        <h4 className="font-semibold mb-4 text-white">{selectedHabit} - 30 Day Calendar</h4>
                        {renderCalendarView(habits.find(h => h.name === selectedHabit)?.data || [])}
                        <div className="flex items-center gap-4 mt-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-300">Completed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-gray-300">Missed</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const DailyImageCard = ({ imageUrl }: { imageUrl: string | null }) => {
    if (imageUrl) {
        return (
            <motion.div variants={itemVariants} className="card rounded-3xl p-4 col-span-full overflow-hidden relative aspect-[2/1]">
                <img src={imageUrl} alt="Daily completion reward" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                <div className="relative z-10 text-white p-2">
                    <h3 className="font-bold text-xl">Daily Reward Unlocked</h3>
                    <p className="text-sm opacity-80">All missions complete. Well done.</p>
                </div>
            </motion.div>
        );
    }
    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-6 col-span-full flex items-center justify-between gap-4 border border-dashed border-border">
            <div>
                <h3 className="text-xl font-bold font-display mb-1">Unlock Today's Image</h3>
                <p className="text-text-secondary">Complete all missions to generate a unique daily image.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-text-secondary">
                <BoltIcon className="w-5 h-5"/>
                <span className="text-sm">Finish tasks to unlock</span>
            </div>
        </motion.div>
    );
};

const FocusBreakdownCard = ({ todayTasks, categoryColors }: { todayTasks: Task[], categoryColors: Record<Category, string> }) => {
    const focusData = useMemo(() => {
        const breakdown = todayTasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + task.plannedDuration;
            return acc;
        }, {} as Record<Category, number>);

        return Object.entries(breakdown).map(([name, value]) => ({
            name, value, fill: categoryColors[name as Category] || '#8884d8'
        }));
    }, [todayTasks, categoryColors]);

    if (focusData.length === 0) return null;

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2">
            <h3 className="text-lg font-bold font-display mb-2">Today's Focus</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} width={80} />
                        <Tooltip cursor={{ fill: 'rgba(128,128,128,0.1)' }} contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }} />
                        <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                            {focusData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

// Cinematic Notes Carousel Component
const CinematicNotesCarousel = ({ notes, setScreen }: { notes: Note[], setScreen: (s: Screen) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    
    const recentNotes = useMemo(() => {
        return [...notes]
            .filter(n => !n.deletedAt)
            .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 10);
    }, [notes]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (isScrolling) return;
        setIsScrolling(true);
        
        const newIndex = direction === 'left' 
            ? (currentIndex - 1 + recentNotes.length) % recentNotes.length
            : (currentIndex + 1) % recentNotes.length;
        
        setCurrentIndex(newIndex);
        
        setTimeout(() => setIsScrolling(false), 300);
    };

    const handleNoteClick = (note: Note) => {
        setScreen('Notes');
        // You could add logic here to scroll to specific note
    };

    if (recentNotes.length === 0) return null;

    return (
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-6 col-span-full md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-display flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6 text-accent"/>
                    Recent Notes
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleScroll('left')}
                        className="p-2 rounded-full bg-bg/40 hover:bg-bg/60 transition-colors"
                        disabled={isScrolling}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        className="p-2 rounded-full bg-bg/40 hover:bg-bg/60 transition-colors"
                        disabled={isScrolling}
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
            </div>
            </div>

            <div className="relative overflow-hidden">
                <motion.div
                    ref={carouselRef}
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {recentNotes.map((note, index) => (
                        <motion.div
                            key={note.id}
                            className="w-full flex-shrink-0 px-2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div 
                                className="p-4 rounded-2xl bg-bg/40 hover:bg-bg/60 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                onClick={() => handleNoteClick(note)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-bold text-lg line-clamp-1">{note.title}</h4>
                                    <span className="text-xs text-text-secondary">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div 
                                    className="text-sm text-text-secondary line-clamp-3 mb-3"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        <span className="text-xs text-text-secondary">Click to open</span>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-text-secondary" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
                {recentNotes.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentIndex 
                                ? 'bg-accent w-6' 
                                : 'bg-text-secondary/30 hover:bg-text-secondary/50'
                        }`}
                    />
                ))}
            </div>
        </motion.div>
    );
};

const SmartPrioritiesCard = ({ tasks, categoryColors, navigateToScheduleDate, setFocusTask }: { tasks: Task[], categoryColors: Record<Category, string>, navigateToScheduleDate: (d: Date)=>void, setFocusTask: (t: Task|null)=>void }) => {
    const items = useMemo(() => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const dayStr = (d: Date) => d.toDateString();
        const score: Record<'low'|'medium'|'high', number> = { low: 1, medium: 2, high: 3 } as const;
        return tasks
            .filter(t => [dayStr(today), dayStr(tomorrow)].includes(new Date(t.startTime).toDateString()) && t.status !== 'Completed')
            .sort((a,b) => {
                const s = (score[b.priority || 'medium'] - score[a.priority || 'medium']);
                if (s !== 0) return s;
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            })
            .slice(0, 5);
    }, [tasks]);

    if (items.length === 0) return null;

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold font-display">Smart Priorities</h3>
                {items[0] && (
                    <button
                        onClick={() => setFocusTask(items[0])}
                        className="text-sm font-semibold px-3 py-1.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: categoryColors[items[0].category] || 'var(--color-accent)' }}
                    >
                        Focus Next
                    </button>
                )}
            </div>
            <ul className="divide-y divide-border/40">
                {items.map((t) => (
                    <li key={t.id} className="py-3 flex items-center gap-3 rounded-xl px-2 -mx-2 hover:bg-bg/40 transition-colors">
                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: categoryColors[t.category] }}/>
                        <button
                            onClick={() => navigateToScheduleDate(new Date(t.startTime))}
                            className="flex-1 text-left"
                        >
                            <p className="font-semibold leading-tight">{t.title}</p>
                            <p className="text-xs text-text-secondary">
                                {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} • {t.category} • {(t.priority || 'medium').toUpperCase()}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

const QuickActionsCard = ({ navigateToScheduleDate, setScreen, nextTask, setFocusTask }: { navigateToScheduleDate: (d: Date)=>void, setScreen: (s: Screen)=>void, nextTask: Task | undefined, setFocusTask: (t: Task|null)=>void }) => {
    const today = new Date();
    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-1">
            <h3 className="text-lg font-bold font-display mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('praxis:start-daily-mode'))}
                    className="w-full px-4 py-2 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <SparklesIcon className="w-4 h-4"/> Start Daily Mode
                </button>
                <button
                    onClick={() => navigateToScheduleDate(today)}
                    className="w-full px-4 py-2 rounded-xl bg-bg hover:bg-bg/70 transition-colors border border-border ring-1 ring-border/40 flex items-center justify-center gap-2"
                >
                    <CalendarDaysIcon className="w-4 h-4"/> Open Today in Schedule
                </button>
                <button
                    onClick={() => setScreen('Notes')}
                    className="w-full px-4 py-2 rounded-xl bg-bg hover:bg-bg/70 transition-colors border border-border ring-1 ring-border/40 flex items-center justify-center gap-2"
                >
                    <DocumentTextIcon className="w-4 h-4"/> Open Notes
                </button>
            </div>
        </motion.div>
    );
};

export default function Dashboard(props: DashboardProps) {
    const { tasks, notes, briefing, isBriefingLoading, navigateToScheduleDate, categoryColors, setFocusTask, setScreen, onCompleteTask, healthData } = props;
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayTasks = useMemo(() => tasks
        .filter(t => new Date(t.startTime).toDateString() === today.toDateString())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), 
    [tasks, today]);
    
    const tomorrowTasks = useMemo(() => tasks
        .filter(t => new Date(t.startTime).toDateString() === tomorrow.toDateString())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), 
    [tasks, tomorrow]);

    const nextTask = useMemo(() => todayTasks.find(t => t.status !== 'Completed'), [todayTasks]);
    const allTasksCompleted = todayTasks.length > 0 && todayTasks.every(t => t.status === 'Completed');

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full"
        >
            {/* Header with Kiko's Wisdom and Animated Weather */}
            <Header 
                tasksTodayCount={todayTasks.length} 
                nextTask={nextTask} 
                categoryColors={categoryColors}
                tasks={tasks}
                healthData={healthData}
                notes={notes}
            />

            {/* Kiko Insights - Right underneath Daily Greeting */}
            <KikoInsightsCard 
                tasks={tasks} 
                notes={notes}
                healthData={healthData}
                briefing={briefing} 
                isLoading={isBriefingLoading} 
            />

            {/* Next Up Tasks with One-Tap Complete and Focus Mode */}
            <NextUpCard 
                todayTasks={todayTasks} 
                tomorrowTasks={tomorrowTasks} 
                navigateToScheduleDate={navigateToScheduleDate} 
                categoryColors={categoryColors}
                setFocusTask={setFocusTask}
                onCompleteTask={onCompleteTask}
            />
            
            {/* Health Insights */}
            <HealthInsightsCard healthData={healthData} />
            
            {/* Habits Tracking with 30-day Calendar */}
            <HabitsTrackingCard healthData={healthData} />

            {/* Cinematic Notes Carousel */}
            <CinematicNotesCarousel notes={notes} setScreen={setScreen} />

            {/* Daily Image Card - Only show when all tasks completed */}
            {allTasksCompleted && (
                <DailyImageCard imageUrl={props.dailyCompletionImage} />
            )}
        </motion.div>
    );
}