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

// Utility function to render task titles with clickable URLs
const renderTaskTitle = (title: string, className: string = '') => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = title.split(urlRegex);
    
    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    const truncatedUrl = part.length > 30 ? part.substring(0, 30) + '...' : part;
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-accent/20 text-accent rounded-md text-sm font-medium hover:bg-accent/30 transition-colors"
                            onClick={(e) => e.stopPropagation()} // Prevent triggering parent button clicks
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {truncatedUrl}
                        </a>
                    );
                }
                return part;
            })}
        </span>
    );
};

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
    const { wisdom, isLoading: wisdomLoading } = useKikoWisdom(tasks, healthData, notes);
    const [showRewardsTooltip, setShowRewardsTooltip] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    
    // Calculate Praxis Rewards System
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const todayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today.toDateString());
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const streakData = 7; // Mock streak data - could be calculated from historical data
    
    // Advanced Praxis Rewards Calculation
    const energyLevel = healthData.energyLevel === 'high' ? 95 : healthData.energyLevel === 'medium' ? 70 : 45;
    const energyMultiplier = energyLevel > 80 ? 1.5 : energyLevel > 60 ? 1.2 : 1.0;
    const streakBonus = streakData * 10;
    const completionBonus = completionRate * 2;
    const dailyPoints = (completedToday * 50 * energyMultiplier) + streakBonus + completionBonus;
    const totalPraxisPoints = Math.round(dailyPoints);
    
    // Weather simulation for 3D model (mock data)
    const weatherCondition = 'sunny'; // Could be fetched from weather API
    const weatherAnimation = weatherCondition === 'sunny' ? 'rotate' : weatherCondition === 'rainy' ? 'bounce' : 'float';
    
    // Next task or daily outlook
    const getNextTaskOrOutlook = () => {
        if (nextTask) {
            return {
                type: 'next-task',
                title: nextTask.title,
                time: new Date(nextTask.startTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                }),
                category: nextTask.category
            };
        } else if (tasksTodayCount > 0) {
            return {
                type: 'day-start',
                title: 'Your day is packed with opportunities',
                subtitle: `${tasksTodayCount} missions await your attention`,
                highlight: 'Start with your highest priority task'
            };
        } else {
            return {
                type: 'free-day',
                title: 'A clean slate awaits',
                subtitle: 'Perfect time for planning or unexpected opportunities',
                highlight: 'Consider setting a goal for tomorrow'
            };
        }
    };
    
    const dayOutlook = getNextTaskOrOutlook();
    
    return (
        <motion.div variants={itemVariants} className="col-span-full mb-8">
            {/* Vanta Black background with enhanced depth */}
            <div className="p-6 sm:p-8 relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
                {/* Enhanced atmospheric background layers */}
                <div className="absolute inset-0">
                    {/* Deep space effect with subtle color hints */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-indigo-500/8 via-purple-500/4 to-transparent rounded-full transform translate-x-72 -translate-y-72 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/6 via-blue-500/3 to-transparent rounded-full transform -translate-x-60 translate-y-60 blur-2xl"></div>
                    <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-purple-500/5 via-violet-500/2 to-transparent rounded-full blur-3xl"></div>
                    
                    {/* Subtle particle effect */}
                    <div className="absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-0.5 h-0.5 bg-white/20 rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    opacity: [0.2, 0.8, 0.2],
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Subtle depth grid - barely visible on Vanta black */}
                <div className="absolute inset-0 opacity-1" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
                    backgroundSize: '30px 30px'
                }}></div>
                
                <div className="relative z-10">
                    {/* Enhanced Header with Date and Larger Greeting */}
                    <div className="flex items-start justify-between mb-12">
                        <div className="flex-1">
                            <motion.p 
                                className="text-sm font-medium text-indigo-300/80 uppercase tracking-wider mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </motion.p>
                            
                            <motion.h1 
                                className="text-6xl sm:text-8xl font-bold bg-gradient-to-br from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight leading-tight mb-8"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                                {getGreeting()}, Pratt.
                            </motion.h1>

                            {/* Significantly Enlarged Next Task Section - Clickable */}
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {dayOutlook.type === 'next-task' ? (
                                    <motion.div 
                                        className="space-y-3 cursor-pointer group"
                                        onClick={() => setShowTaskModal(true)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <p className="text-2xl text-indigo-200 font-medium group-hover:text-indigo-100 transition-colors">
                                            Next up:
                                        </p>
                                        <motion.h2 
                                            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-tight group-hover:from-indigo-200 group-hover:via-white group-hover:to-cyan-200 transition-all duration-300"
                                            animate={{
                                                textShadow: [
                                                    "0 0 20px rgba(99, 102, 241, 0.3)",
                                                    "0 0 30px rgba(99, 102, 241, 0.5)",
                                                    "0 0 20px rgba(99, 102, 241, 0.3)"
                                                ]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            {dayOutlook.title}
                                        </motion.h2>
                                        <div className="flex items-center gap-4 text-lg text-slate-300 group-hover:text-slate-200 transition-colors">
                                            <motion.span 
                                                className="flex items-center gap-2"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <motion.div 
                                                    className="w-2 h-2 bg-indigo-400 rounded-full"
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [0.7, 1, 0.7]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                {dayOutlook.time}
                                            </motion.span>
                                            <motion.span 
                                                className="flex items-center gap-2"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <motion.div 
                                                    className="w-2 h-2 bg-purple-400 rounded-full"
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [0.7, 1, 0.7]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                                />
                                                {dayOutlook.category}
                                            </motion.span>
                                        </div>
                                        
                                        {/* Subtle click indicator */}
                                        <motion.div
                                            className="flex items-center gap-2 text-sm text-indigo-300/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            initial={{ x: -10 }}
                                            animate={{ x: 0 }}
                                        >
                                            <span>Click to view details</span>
                                            <motion.div
                                                animate={{ x: [0, 3, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                →
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3">
                                        <motion.h2 
                                            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-tight"
                                            animate={{
                                                textShadow: [
                                                    "0 0 15px rgba(99, 102, 241, 0.2)",
                                                    "0 0 25px rgba(99, 102, 241, 0.4)",
                                                    "0 0 15px rgba(99, 102, 241, 0.2)"
                                                ]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                        >
                                            {dayOutlook.title}
                                        </motion.h2>
                                        <p className="text-xl text-slate-300">{dayOutlook.subtitle}</p>
                                        <p className="text-lg text-indigo-300 font-medium">{dayOutlook.highlight}</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                        
                        {/* Enhanced 3D Weather Integration */}
                        <motion.div 
                            className="hidden sm:flex items-center justify-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {/* Ultra-Enhanced 3D Weather Model */}
                            <motion.div
                                className="w-24 h-24 flex items-center justify-center relative"
                                animate={{
                                    rotate: weatherAnimation === 'rotate' ? [0, 360] : 0,
                                    y: weatherAnimation === 'bounce' ? [-4, 4, -4] : weatherAnimation === 'float' ? [-3, 3, -3] : 0,
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                    scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Multi-layered 3D sun with enhanced depth */}
                                <div className="relative">
                                    {/* Outer glow */}
                                    <motion.div 
                                        className="absolute inset-[-4px] bg-gradient-radial from-yellow-300/30 to-transparent rounded-full blur-sm"
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    
                                    {/* Main sun body with multiple layers */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-full shadow-2xl relative">
                                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-100 via-orange-200 to-red-300 rounded-full"></div>
                                        <div className="absolute inset-2 bg-gradient-to-br from-yellow-50 via-orange-100 to-red-200 rounded-full"></div>
                                        <div className="absolute inset-3 bg-gradient-to-br from-white via-yellow-50 to-orange-100 rounded-full opacity-80"></div>
                                        
                                        {/* Core highlight */}
                                        <motion.div 
                                            className="absolute inset-4 bg-white rounded-full opacity-90"
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    </div>
                                    
                                    {/* Enhanced animated rays */}
                                    <div className="absolute inset-0">
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-0.5 h-4 bg-gradient-to-t from-yellow-400 to-transparent rounded-full"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transformOrigin: '50% 28px',
                                                    transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                                                }}
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.6, 1, 0.6]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: i * 0.1
                                                }}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Rotating outer rays */}
                                    <motion.div 
                                        className="absolute inset-0"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                    >
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-0.5 h-2 bg-gradient-to-t from-orange-300/60 to-transparent rounded-full"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transformOrigin: '50% 32px',
                                                    transform: `translate(-50%, -50%) rotate(${i * 45}deg)`
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Condensed Praxis Rewards System */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {/* Enhanced 3D Trophy Icon */}
                                <motion.div
                                    className="relative w-12 h-12 flex items-center justify-center"
                                    animate={{ 
                                        rotateY: [0, 15, -15, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ 
                                        duration: 6, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* 3D Trophy Base */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl shadow-lg transform rotate-1"></div>
                                    <div className="absolute inset-0.5 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 rounded-2xl transform -rotate-1"></div>
                                    <div className="absolute inset-1 bg-gradient-to-br from-amber-200 via-yellow-300 to-orange-300 rounded-xl"></div>
                                    
                                    {/* Trophy Icon */}
                                    <div className="relative z-10 text-2xl transform perspective-1000 rotateX-10">🏆</div>
                                    
                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl"
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                </motion.div>
                                
                                <div>
                                    <h3 className="text-lg font-bold text-white">Praxis Rewards</h3>
                                    <p className="text-xs text-indigo-300/80">Smart analytics</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Condensed Analytics */}
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-white">{completedToday}</div>
                                        <div className="text-xs text-slate-400">Done</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-600"></div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-white">{completionRate}%</div>
                                        <div className="text-xs text-slate-400">Rate</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-600"></div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-white">{streakData}</div>
                                        <div className="text-xs text-slate-400">Streak</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: [0.9, 1.05, 1] }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    >
                                        {totalPraxisPoints}
                                    </motion.div>
                                    <div className="relative">
                                        <motion.button
                                            className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/30 transition-colors"
                                            onMouseEnter={() => setShowRewardsTooltip(true)}
                                            onMouseLeave={() => setShowRewardsTooltip(false)}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <span className="text-xs text-indigo-300">?</span>
                                        </motion.button>
                                        
                                        {/* Enhanced Tooltip */}
                                        <AnimatePresence>
                                            {showRewardsTooltip && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50"
                                                    style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
                                                >
                                                    <h4 className="text-sm font-semibold text-white mb-3">How Praxis Rewards Work</h4>
                                                    <div className="space-y-2 text-xs text-slate-300">
                                                        <div className="flex justify-between">
                                                            <span>Base points per task:</span>
                                                            <span className="text-white font-medium">50 pts</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Energy multiplier:</span>
                                                            <span className="text-white font-medium">{energyMultiplier}x</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Streak bonus:</span>
                                                            <span className="text-white font-medium">{streakBonus} pts</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Completion bonus:</span>
                                                            <span className="text-white font-medium">{completionBonus} pts</span>
                                                        </div>
                                                        <div className="border-t border-indigo-500/20 pt-2 mt-2">
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-indigo-300">Today's Total:</span>
                                                                <span className="text-indigo-300">{totalPraxisPoints} pts</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-indigo-500/20">
                                                        <p className="text-xs text-slate-400">
                                                            💡 Tip: Maintain high energy and consistent streaks for maximum rewards!
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kiko's Enhanced Wisdom Section - Seamless Integration */}
                    <motion.div 
                        className="pt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <div className="flex items-start gap-4">
                            <motion.div
                                className="w-10 h-10 flex items-center justify-center text-2xl"
                                animate={{ 
                                    rotate: [0, 8, -8, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                    duration: 4,
                                    repeat: Infinity,
                                    repeatDelay: 6
                                }}
                            >
                                🐧
                            </motion.div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-base font-semibold text-white">Kiko's Daily Insight</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 capitalize">
                                        {wisdom.type}
                                    </span>
                                </div>
                                {wisdomLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-3 bg-slate-700/50 rounded animate-pulse"></div>
                                        <div className="h-3 bg-slate-700/50 rounded animate-pulse w-4/5"></div>
                                    </div>
                                ) : (
                                    <div>
                                        <motion.p 
                                            className="text-slate-200 leading-relaxed mb-2 text-sm font-medium"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            "{wisdom.quote}"
                                        </motion.p>
                                        <p className="text-xs text-slate-400">{wisdom.context}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            {/* Task Details Modal */}
            <AnimatePresence>
                {showTaskModal && nextTask && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTaskModal(false)}
                    >
                        <motion.div
                            className="bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <motion.h2 
                                        className="text-2xl font-bold text-white mb-2"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {nextTask.title}
                                    </motion.h2>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                                            {new Date(nextTask.startTime).toLocaleTimeString('en-US', { 
                                                hour: 'numeric', 
                                                minute: '2-digit',
                                                hour12: true 
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                            {nextTask.category}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                            {nextTask.plannedDuration} min
                                        </span>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => setShowTaskModal(false)}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Task Details */}
                            <motion.div 
                                className="space-y-6"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        {"No description provided for this task."}
                                    </p>
                                </div>

                                {/* Quick Actions */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <motion.button
                                            className="p-4 rounded-2xl bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="text-2xl mb-2">✅</div>
                                            <div className="font-medium">Mark Complete</div>
                                        </motion.button>
                                        
                                        <motion.button
                                            className="p-4 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="text-2xl mb-2">✏️</div>
                                            <div className="font-medium">Edit Task</div>
                                        </motion.button>
                                        
                                        <motion.button
                                            className="p-4 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="text-2xl mb-2">🐧</div>
                                            <div className="font-medium">Kiko Insights</div>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Task Summary */}
                                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-600/30">
                                    <h3 className="text-lg font-semibold text-white mb-3">Task Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-400">Status:</span>
                                            <span className="ml-2 text-white font-medium">{nextTask.status}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Priority:</span>
                                            <span className="ml-2 text-white font-medium">High</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Duration:</span>
                                            <span className="ml-2 text-white font-medium">{nextTask.plannedDuration} minutes</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Category:</span>
                                            <span className="ml-2 text-white font-medium">{nextTask.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
        <motion.div variants={itemVariants} className="card rounded-3xl p-5 col-span-full md:col-span-2 row-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
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
            
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2.5">
                {tasksToShow.length > 0 ? tasksToShow.map((task, index) => (
                    <motion.div
                        key={task.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group"
                    >
                        <div 
                            className="w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer relative overflow-hidden"
                            style={{ 
                                backgroundColor: (categoryColors[task.category] || '#111827'), 
                                color: getTextColorForBackground(categoryColors[task.category] || '#111827') 
                            }}
                        onClick={() => handleTaskClick(task)}
                        >
                            {/* Background gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10 flex items-center gap-3 w-full">
                                <div className="flex flex-col items-center min-w-[56px]">
                            <p className="font-bold text-lg">{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                    <p className="text-xs opacity-80">{task.plannedDuration}min</p>
                        </div>
                                
                                <div className="w-0.5 h-10 rounded-full opacity-50" style={{ 
                                    backgroundColor: getTextColorForBackground(categoryColors[task.category] || '#111827') === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)' 
                                }}/>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-base leading-tight ${task.status === 'Completed' ? 'line-through opacity-80' : ''}`}>
                                        {renderTaskTitle(task.title)}
                                    </div>
                                    <p className="text-xs opacity-75 capitalize mt-1">{task.category}</p>
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

// Enhanced Daily Briefing Component - Kiko Insights on Completion
const DailyBriefingCard = ({ tasks, notes, healthData, briefing, isLoading }: { 
    tasks: Task[], 
    notes: Note[], 
    healthData: HealthData, 
    briefing: MissionBriefing, 
    isLoading: boolean 
}) => {
    const [isCompleted, setIsCompleted] = useState(false);
    
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
        setIsCompleted(completionRate === 100 && todayTasks.length > 0);
    }, [completionRate, todayTasks.length]);
    
    const generateDataDrivenInsights = () => {
        // Analyze actual user data
        const taskCategories = todayTasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostProductiveCategory = Object.entries(taskCategories)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Personal';

        const averageTaskDuration = todayTasks.length > 0 
            ? Math.round(todayTasks.reduce((acc, task) => acc + task.plannedDuration, 0) / todayTasks.length)
            : 0;

        const recentNotes = notes.filter(note => {
            const noteDate = new Date(note.createdAt);
            const today = new Date();
            return noteDate.toDateString() === today.toDateString();
        });

        const totalFocusTime = todayTasks.reduce((acc, task) => 
            task.status === 'Completed' ? acc + (task.actualDuration || task.plannedDuration) : acc, 0);

            return {
            taskBreakdown: taskCategories,
            mostProductiveCategory,
            averageTaskDuration,
            totalFocusTime,
            notesCreated: recentNotes.length,
            energyPattern: healthData.energyLevel,
                    sleepQuality: healthData.sleepQuality
        };
    };
    
    const dataInsights = generateDataDrivenInsights();
    
    // Only show this component when all tasks are completed
    if (!isCompleted) {
        return null;
    }
    
    return (
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-6 col-span-full flex flex-col bg-gray-900/30 border border-gray-700/30 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Kiko Insights Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center"
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
                        <span className="text-xl">🐧</span>
                    </motion.div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Kiko's Daily Insights</h3>
                        <p className="text-sm text-gray-400">All tasks completed! Here's your productivity analysis.</p>
                    </div>
                </div>
                    <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">100%</div>
                    <div className="text-xs text-green-300">Perfect Day!</div>
                    </div>
                    </div>
                    
            {/* Meaningful Data-Driven Insights */}
                        <div className="space-y-4">
                {/* Performance Summary Cards */}
                <div className="grid grid-cols-4 gap-3">
                                        <motion.div
                        className="p-4 rounded-2xl bg-purple-600/20 border border-purple-500/30"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="text-lg font-bold text-white">{dataInsights.totalFocusTime}min</div>
                        <div className="text-xs text-purple-200">Total Focus Time</div>
                                        </motion.div>
                    
                                        <motion.div
                        className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/30"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="text-2xl mb-2">📝</div>
                        <div className="text-lg font-bold text-white">{dataInsights.notesCreated}</div>
                        <div className="text-xs text-blue-200">Notes Created</div>
                                        </motion.div>
                    
                    <motion.div 
                        className="p-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/30"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-lg font-bold text-white">{dataInsights.averageTaskDuration}min</div>
                        <div className="text-xs text-emerald-200">Avg Task Duration</div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-4 rounded-2xl bg-amber-600/20 border border-amber-500/30"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="text-2xl mb-2">🏆</div>
                        <div className="text-lg font-bold text-white">{dataInsights.mostProductiveCategory}</div>
                        <div className="text-xs text-amber-200">Top Category</div>
                    </motion.div>
                                </div>

                {/* Task Category Breakdown */}
                <div className="p-4 rounded-2xl bg-gray-800/40 border border-gray-600/30">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400"/>
                        Today's Category Distribution
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(dataInsights.taskBreakdown).map(([category, count], index) => {
                            const percentage = Math.round(((count as number) / todayTasks.length) * 100);
                            return (
                                <div key={category} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-300 w-20">{category}</span>
                                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-purple-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                        />
                            </div>
                                    <span className="text-xs text-gray-400 w-12">{count} tasks</span>
                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Kiko's Personal Insights */}
                <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-sm">🐧</div>
                        Kiko's Analysis
                    </h4>
                    <div className="space-y-3 text-sm text-gray-200">
                        <p>
                            🎉 <strong>Exceptional focus today!</strong> You completed all {todayTasks.length} tasks with an average duration of {dataInsights.averageTaskDuration} minutes per task.
                        </p>
                        <p>
                            📊 Your strongest area was <strong>{dataInsights.mostProductiveCategory}</strong> with {dataInsights.taskBreakdown[dataInsights.mostProductiveCategory]} tasks completed.
                        </p>
                        {dataInsights.notesCreated > 0 && (
                            <p>
                                📝 Great documentation! You created {dataInsights.notesCreated} notes today, showing excellent knowledge capture habits.
                            </p>
                        )}
                        <p>
                            💡 <strong>Tomorrow's strategy:</strong> Replicate today's {dataInsights.energyPattern} energy pattern. Consider starting with {dataInsights.mostProductiveCategory} tasks when you're most focused.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Enhanced Health Insights Component
const HealthInsightsCard = ({ healthData }: { healthData: HealthData }) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const healthMetrics = [
        {
            name: 'Sleep Quality',
            icon: '😴',
            value: healthData.avgSleepHours,
            target: 8,
            unit: 'hours',
            displayValue: `${healthData.avgSleepHours}h`,
            status: healthData.sleepQuality,
            color: healthData.sleepQuality === 'good' ? '#06D6A0' : healthData.sleepQuality === 'fair' ? '#FFD60A' : '#FF6B6B',
            bgColor: healthData.sleepQuality === 'good' ? 'bg-emerald-500/10' : healthData.sleepQuality === 'fair' ? 'bg-yellow-500/10' : 'bg-red-500/10',
            borderColor: healthData.sleepQuality === 'good' ? 'border-emerald-400/30' : healthData.sleepQuality === 'fair' ? 'border-yellow-400/30' : 'border-red-400/30',
            textColor: healthData.sleepQuality === 'good' ? 'text-emerald-300' : healthData.sleepQuality === 'fair' ? 'text-yellow-300' : 'text-red-300',
            insights: healthData.sleepQuality === 'good' ? 
                "Excellent sleep quality! Your rest patterns are optimizing cognitive performance." :
                healthData.sleepQuality === 'fair' ?
                "Room for improvement. Try a consistent bedtime routine for better rest." :
                "Sleep needs attention. Consider reducing screen time and creating a calm environment."
        },
        {
            name: 'Energy Level',
            icon: '⚡',
            value: healthData.energyLevel === 'high' ? 90 : healthData.energyLevel === 'medium' ? 60 : 30,
            target: 100,
            unit: '%',
            displayValue: healthData.energyLevel,
            status: healthData.energyLevel,
            color: healthData.energyLevel === 'high' ? '#00D9FF' : healthData.energyLevel === 'medium' ? '#FFD60A' : '#FF8E53',
            bgColor: healthData.energyLevel === 'high' ? 'bg-cyan-500/10' : healthData.energyLevel === 'medium' ? 'bg-yellow-500/10' : 'bg-orange-500/10',
            borderColor: healthData.energyLevel === 'high' ? 'border-cyan-400/30' : healthData.energyLevel === 'medium' ? 'border-yellow-400/30' : 'border-orange-400/30',
            textColor: healthData.energyLevel === 'high' ? 'text-cyan-300' : healthData.energyLevel === 'medium' ? 'text-yellow-300' : 'text-orange-300',
            insights: healthData.energyLevel === 'high' ?
                "Peak energy! Perfect time for challenging tasks and creative breakthroughs." :
                healthData.energyLevel === 'medium' ?
                "Steady energy. Focus on important tasks and take strategic breaks." :
                "Energy is low. Consider hydration, movement, or a healthy snack boost."
        },
        {
            name: 'Activity Level',
            icon: '🏃‍♂️',
            value: healthData.totalWorkouts,
            target: 5,
            unit: 'sessions',
            displayValue: `${healthData.totalWorkouts}/5`,
            status: healthData.totalWorkouts >= 5 ? 'excellent' : healthData.totalWorkouts >= 3 ? 'good' : 'needs-improvement',
            color: healthData.totalWorkouts >= 5 ? '#06D6A0' : healthData.totalWorkouts >= 3 ? '#00D9FF' : '#FFD60A',
            bgColor: healthData.totalWorkouts >= 5 ? 'bg-emerald-500/10' : healthData.totalWorkouts >= 3 ? 'bg-cyan-500/10' : 'bg-yellow-500/10',
            borderColor: healthData.totalWorkouts >= 5 ? 'border-emerald-400/30' : healthData.totalWorkouts >= 3 ? 'border-cyan-400/30' : 'border-yellow-400/30',
            textColor: healthData.totalWorkouts >= 5 ? 'text-emerald-300' : healthData.totalWorkouts >= 3 ? 'text-cyan-300' : 'text-yellow-300',
            insights: healthData.totalWorkouts >= 5 ?
                "Outstanding activity level! Your fitness routine is boosting overall well-being." :
                healthData.totalWorkouts >= 3 ?
                "Good activity level. Consider adding one more session for optimal health." :
                "Activity could be increased. Even 15-minute walks make a significant difference."
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
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-6 col-span-full md:col-span-1 bg-slate-900/40 border border-slate-700/30 backdrop-blur-xl"
        >
            {/* Modern Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 flex items-center justify-center"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                        <HeartIcon className="w-5 h-5 text-pink-300"/>
                    </motion.div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Health Vitals</h3>
                        <p className="text-sm text-slate-400">Real-time wellness tracking</p>
                                </div>
                </div>
                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-600/30 hover:bg-slate-700/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </motion.button>
                    </div>

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-1 gap-4">
                {healthMetrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${metric.bgColor} ${metric.borderColor} border backdrop-blur-sm hover:scale-[1.02] group`}
                        onClick={() => setSelectedMetric(selectedMetric === metric.name ? null : metric.name)}
                        whileHover={{ y: -2 }}
                    >
                        {/* Metric Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="text-2xl"
                                    animate={{ 
                                        scale: selectedMetric === metric.name ? [1, 1.2, 1] : 1,
                                        rotate: selectedMetric === metric.name ? [0, 10, -10, 0] : 0
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {metric.icon}
                                </motion.div>
                                <div>
                                    <h4 className="font-semibold text-white text-base">{metric.name}</h4>
                                    <p className={`text-sm font-medium ${metric.textColor}`}>{metric.displayValue}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-bold ${metric.textColor}`}>
                                    {typeof metric.value === 'number' ? Math.round((metric.value / metric.target) * 100) : '100'}%
                                </div>
                                <div className="text-xs text-slate-400">of target</div>
                            </div>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="relative">
                            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                            <motion.div
                                    className="h-full rounded-full relative overflow-hidden"
                                style={{ backgroundColor: metric.color }}
                                initial={{ width: 0 }}
                                animate={{ width: typeof metric.value === 'number' ? `${Math.min((metric.value / metric.target) * 100, 100)}%` : '100%' }}
                                    transition={{ duration: 1.2, delay: index * 0.2, ease: "easeOut" }}
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ duration: 1.5, delay: index * 0.2 + 0.5, ease: "easeInOut" }}
                                    />
                                </motion.div>
                            </div>
                        </div>

                        {/* Expanded Insights */}
                        <AnimatePresence>
                            {selectedMetric === metric.name && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-4 pt-4 border-t border-slate-600/30"
                                >
                                    <p className="text-sm text-slate-200 leading-relaxed">{metric.insights}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className={`absolute inset-0 rounded-2xl blur-xl ${metric.bgColor}`} style={{ filter: 'blur(20px)' }} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Smart Health Recommendations */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mt-6 p-5 rounded-2xl bg-slate-800/40 border border-slate-600/30 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center"
                                whileHover={{ rotate: 15 }}
                            >
                                <BoltIcon className="w-4 h-4 text-amber-300"/>
                            </motion.div>
                            <div>
                                <h4 className="font-semibold text-white">Wellness Recommendations</h4>
                                <p className="text-xs text-slate-400">Personalized health insights</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                    {getHealthRecommendations().map((rec, index) => (
                        <motion.div
                            key={index}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-600/20 hover:bg-slate-700/50 transition-colors group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <motion.div 
                                        className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0"
                                        whileHover={{ scale: 1.5 }}
                                    />
                                    <p className="text-sm text-slate-200 leading-relaxed group-hover:text-white transition-colors">{rec}</p>
                        </motion.div>
                    ))}
            </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Enhanced Habits Tracking Component
const HabitsTrackingCard = ({ healthData }: { healthData: HealthData }) => {
    const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
    
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
            icon: '💪',
            value: healthData.totalWorkouts, 
            target: 5, 
            unit: 'sessions', 
            streak: 5,
            color: '#00D9FF',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-400/30',
            textColor: 'text-cyan-300',
            data: generateHabitData('exercise'),
            description: 'Stay active and energized'
        },
        { 
            name: 'Meditation', 
            icon: '🧘‍♂️',
            value: 3, 
            target: 7, 
            unit: 'sessions', 
            streak: 3,
            color: '#A855F7',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-400/30',
            textColor: 'text-purple-300',
            data: generateHabitData('meditation'),
            description: 'Find inner peace and focus'
        },
        { 
            name: 'Reading', 
            icon: '📚',
            value: 4, 
            target: 7, 
            unit: 'sessions', 
            streak: 7,
            color: '#06D6A0',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-400/30',
            textColor: 'text-emerald-300',
            data: generateHabitData('reading'),
            description: 'Expand knowledge and perspective'
        },
        { 
            name: 'Journaling', 
            icon: '✍️',
            value: 2, 
            target: 5, 
            unit: 'sessions', 
            streak: 2,
            color: '#FFD60A',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-400/30',
            textColor: 'text-yellow-300',
            data: generateHabitData('journaling'),
            description: 'Reflect and capture thoughts'
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
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-6 col-span-full md:col-span-1 bg-slate-900/40 border border-slate-700/30 backdrop-blur-xl"
        >
            {/* Modern Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center"
                        whileHover={{ scale: 1.05, rotate: -5 }}
                    >
                        <ClockIcon className="w-5 h-5 text-indigo-300"/>
                    </motion.div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Habit Tracker</h3>
                        <p className="text-sm text-slate-400">Build consistent routines</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            viewMode === 'overview' 
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' 
                                : 'bg-slate-800/50 text-slate-400 border border-slate-600/30'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {viewMode === 'overview' ? 'Overview' : 'Detailed'}
                    </motion.button>
                </div>
            </div>

            {/* Habits Grid */}
            <div className="grid grid-cols-1 gap-4">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${habit.bgColor} ${habit.borderColor} border backdrop-blur-sm hover:scale-[1.02] group`}
                        onClick={() => setSelectedHabit(selectedHabit === habit.name ? null : habit.name)}
                        whileHover={{ y: -2 }}
                    >
                        {/* Habit Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="text-2xl"
                                    animate={{ 
                                        scale: selectedHabit === habit.name ? [1, 1.2, 1] : 1,
                                        rotate: selectedHabit === habit.name ? [0, 15, -15, 0] : 0
                                    }}
                                    transition={{ duration: 0.6 }}
                                >
                                    {habit.icon}
                                </motion.div>
                                <div>
                                    <h4 className="font-semibold text-white text-base">{habit.name}</h4>
                                    <p className="text-xs text-slate-400">{habit.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-bold ${habit.textColor}`}>
                                    {habit.value}/{habit.target}
                                </div>
                                <div className="text-xs text-slate-400">this week</div>
                            </div>
                        </div>
                        
                        {/* Progress Section */}
                        <div className="space-y-3">
                        {/* Progress Bar */}
                            <div className="relative">
                                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                            <motion.div
                                        className="h-full rounded-full relative overflow-hidden"
                                style={{ backgroundColor: habit.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((habit.value / habit.target) * 100, 100)}%` }}
                                        transition={{ duration: 1.2, delay: index * 0.2, ease: "easeOut" }}
                                    >
                                        {/* Shimmer effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ duration: 1.5, delay: index * 0.2 + 0.5, ease: "easeInOut" }}
                                        />
                                    </motion.div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>0</span>
                                    <span className={`font-medium ${habit.textColor}`}>
                                        {Math.round((habit.value / habit.target) * 100)}%
                                    </span>
                                    <span>{habit.target}</span>
                                </div>
                        </div>

                            {/* Weekly Streak Indicator */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <motion.div
                                        className="text-sm"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    >
                                        🔥
                                    </motion.div>
                                    <span className={`text-sm font-medium ${habit.textColor}`}>
                                        {habit.streak} day streak
                                    </span>
                                </div>
                                <div className="flex-1"></div>
                                <div className="flex gap-1">
                            {habit.data.slice(-7).map((day, dayIndex) => (
                                <motion.div
                                    key={dayIndex}
                                            className="w-2 h-2 rounded-full"
                                            style={{ 
                                                backgroundColor: day.completed ? habit.color : '#475569',
                                                opacity: day.completed ? 1 : 0.3
                                            }}
                                    initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: day.completed ? 1 : 0.3, scale: 1 }}
                                            transition={{ duration: 0.3, delay: (index * 0.1) + (dayIndex * 0.05) }}
                                            whileHover={{ scale: 1.5 }}
                                />
                            ))}
                                </div>
                            </div>
                        </div>

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className={`absolute inset-0 rounded-2xl blur-xl ${habit.bgColor}`} style={{ filter: 'blur(20px)' }} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Enhanced Detailed View */}
            <AnimatePresence>
                {selectedHabit && viewMode === 'detailed' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mt-6 p-5 bg-slate-800/40 border border-slate-600/30 rounded-2xl backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">
                                {habits.find(h => h.name === selectedHabit)?.icon}
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-lg">{selectedHabit} - 30 Day Journey</h4>
                                <p className="text-sm text-slate-400">Track your consistency and build momentum</p>
                            </div>
                        </div>
                        
                        {renderCalendarView(habits.find(h => h.name === selectedHabit)?.data || [])}
                        
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-600/30">
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-slate-300">Completed</span>
                            </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-500 opacity-30"></div>
                                    <span className="text-slate-300">Missed</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                    {Math.round((habits.find(h => h.name === selectedHabit)?.data.filter(d => d.completed).length || 0) / 30 * 100)}% consistency
                                </div>
                                <div className="text-xs text-slate-400">over 30 days</div>
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

    if (focusData.length === 0) {
        return (
            <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2">
                <h3 className="text-lg font-bold font-display mb-4">Today's Focus</h3>
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <HeartIcon className="w-8 h-8 text-accent/60" />
                    </div>
                    <p className="text-text-secondary mb-2">Taking a breather today?</p>
                    <p className="text-sm text-text-secondary/70">Sometimes the most productive thing is to rest and recharge.</p>
                </div>
            </motion.div>
        );
    }

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

    if (recentNotes.length === 0) {
        return (
            <motion.div variants={itemVariants} className="card rounded-3xl p-5 col-span-full md:col-span-2">
                <h3 className="text-lg font-bold font-display mb-3">Recent Notes</h3>
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <DocumentTextIcon className="w-8 h-8 text-accent/60" />
                    </div>
                    <p className="text-text-secondary mb-2">Your mind is clear</p>
                    <p className="text-sm text-text-secondary/70">No notes yet, but that's perfectly fine. Ideas come when they're ready.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            variants={itemVariants} 
            className="card rounded-3xl p-5 col-span-full md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
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

    if (items.length === 0) {
    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2">
                <h3 className="text-lg font-bold font-display mb-4">Smart Priorities</h3>
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-accent/60" />
                    </div>
                    <p className="text-text-secondary mb-2">You're all caught up!</p>
                    <p className="text-sm text-text-secondary/70">Enjoy this moment of completion. Balance is key to sustainable productivity.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-5 col-span-full md:col-span-2">
            <div className="flex items-center justify-between mb-3">
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
                    <li key={t.id} className="py-2.5 flex items-center gap-3 rounded-xl px-2 -mx-2 hover:bg-bg/40 transition-colors">
                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: categoryColors[t.category] }}/>
                        <button
                            onClick={() => navigateToScheduleDate(new Date(t.startTime))}
                            className="flex-1 text-left"
                        >
                            <div className="font-semibold leading-tight">{renderTaskTitle(t.title)}</div>
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
            <DailyBriefingCard 
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