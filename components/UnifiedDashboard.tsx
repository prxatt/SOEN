import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { safeGet } from '../utils/validation';
import { 
    CheckCircleIcon, SparklesIcon, FireIcon, HeartIcon, BoltIcon, ClockIcon, SunIcon, ChevronLeftIcon, ChevronRightIcon
} from './Icons';
import IntegratedHealthInsights from './IntegratedHealthInsights';
import './UnifiedDashboard.css';

interface UnifiedDashboardProps {
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
    inferredLocation: string | null;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number) => void;
}

// Original brand cohesive color scheme
const UNIFIED_COLORS = {
    background: '#0a0a0a', // Deep black background
    surface: '#1a1a1a',    // Slightly lighter surface
    text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
        muted: '#666666'
    },
    tabs: {
        dashboard: '#3b82f6',    // Blue
        schedule: '#10b981',     // Green  
        notes: '#f59e0b',        // Orange
        health: '#ef4444',       // Red
        habits: '#8b5cf6',       // Purple
        profile: '#06b6d4'       // Cyan
    }
} as const;

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
    }
};

// Weather Component
function WeatherWidget() {
    const [loading, setLoading] = useState(true);
    const [tempC, setTempC] = useState<number | null>(null);
    const [code, setCode] = useState<number | null>(null);
    const [location, setLocation] = useState<string>('');

    useEffect(() => {
        const fallback = { lat: 37.7749, lon: -122.4194, city: 'San Francisco' };
        const fetchWeather = async (lat: number, lon: number, city?: string) => {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
                const res = await fetch(url);
                const data = await res.json();
                setTempC(data?.current?.temperature_2m ?? null);
                setCode(data?.current?.weather_code ?? null);
                
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

    const getIconForCode = (code: number | null) => {
        if (code === null) return '🌡️';
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 48) return '☁️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌦️';
        if (code <= 86) return '🌨️';
        return '🌡️';
    };

    return (
        <motion.div
            className="bg-white/10 rounded-2xl p-4 border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="text-center">
                <div className="text-3xl mb-2">{getIconForCode(code)}</div>
                <div className="text-2xl font-bold text-white mb-1">
                    {loading ? '—' : tempC ? `${Math.round(tempC)}°C` : '—'}
                </div>
                <div className="text-white/70 text-sm mb-1">
                    {code !== null ? (code === 0 ? 'Clear' : code <= 3 ? 'Partly Cloudy' : 'Weather') : '—'}
                </div>
                <div className="text-white/60 text-xs">
                    {location || 'Loading...'}
                </div>
            </div>
        </motion.div>
    );
}

// Enhanced Health & Habits Widget with Schedule UI Style
function EnhancedHealthHabitsWidget({ healthData, notes, tasks }: {
    healthData: HealthData;
    notes: Note[];
    tasks: Task[];
}) {
    const [activeTab, setActiveTab] = useState<'health' | 'habits'>('health');
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Generate week data for habit tracking
    const weeks = useMemo(() => {
        const weeksData = [];
        const today = new Date();
        
        for (let i = -2; i <= 2; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            weeksData.push({
                start: weekStart,
                end: weekEnd,
                label: i === 0 ? 'This Week' : i === -1 ? 'Last Week' : i === 1 ? 'Next Week' : `Week ${i + 3}`
            });
        }
        return weeksData;
    }, []);

    // AI-powered habit analysis
    const habitAnalysis = useMemo(() => {
        const currentWeek = weeks[selectedWeek + 2];
        const weekTasks = tasks.filter(task => {
            const taskDate = new Date(task.startTime);
            return taskDate >= currentWeek.start && taskDate <= currentWeek.end;
        });

        const completedTasks = weekTasks.filter(task => task.status === 'Completed');
        const completionRate = weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0;

        // Analyze habit patterns
        const workoutHabits = weekTasks.filter(task => task.category === 'Workout').length;
        const learningHabits = weekTasks.filter(task => task.category === 'Learning').length;
        const personalHabits = weekTasks.filter(task => task.category === 'Personal').length;

        return {
            completionRate: Math.round(completionRate),
            workoutHabits,
            learningHabits,
            personalHabits,
            totalTasks: weekTasks.length,
            completedTasks: completedTasks.length
        };
    }, [tasks, weeks, selectedWeek]);

    // Health metrics with better visibility
    const healthMetrics = useMemo(() => {
        return {
            sleep: {
                hours: safeGet(healthData, 'avgSleepHours', 7.5),
                quality: healthData.sleepQuality || 'Good',
                color: '#10B981'
            },
            energy: {
                level: healthData.energyLevel || 'High',
                color: '#F59E0B'
            },
            activity: {
                steps: safeGet(healthData, 'stepsToday', 8500),
                heartRate: safeGet(healthData, 'heartRate', 72),
                calories: safeGet(healthData, 'caloriesBurned', 2100),
                color: '#EF4444'
            }
        };
    }, [healthData]);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === 'health' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                >
                    Health
                </button>
                <button
                    onClick={() => setActiveTab('habits')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === 'habits' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                >
                    Habits
                </button>
            </div>

            {/* Health Tab */}
            {activeTab === 'health' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sleep */}
                    <motion.div 
                        className="bg-white/10 rounded-2xl p-4 border border-white/20"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.sleep.color }}>
                                <SunIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Sleep</h3>
                                <p className="text-white/70 text-sm">{healthMetrics.sleep.quality}</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{healthMetrics.sleep.hours}h</div>
                        <div className="text-white/60 text-sm">Average</div>
                    </motion.div>

                    {/* Energy */}
                    <motion.div 
                        className="bg-white/10 rounded-2xl p-4 border border-white/20"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.energy.color }}>
                                <BoltIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Energy</h3>
                                <p className="text-white/70 text-sm">Level</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{healthMetrics.energy.level}</div>
                        <div className="text-white/60 text-sm">Today</div>
                    </motion.div>

                    {/* Activity */}
                    <motion.div 
                        className="bg-white/10 rounded-2xl p-4 border border-white/20"
            whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.activity.color }}>
                                <HeartIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Activity</h3>
                                <p className="text-white/70 text-sm">Today</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{healthMetrics.activity.steps.toLocaleString()}</div>
                        <div className="text-white/60 text-sm">Steps</div>
                    </motion.div>
                </div>
            )}

            {/* Habits Tab */}
            {activeTab === 'habits' && (
                <div className="space-y-4">
                    {/* Week Selector */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">Habit Progress</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedWeek(Math.max(selectedWeek - 1, -2))}
                                disabled={selectedWeek === -2}
                                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                                {weeks[selectedWeek + 2].label}
                            </span>
                            <button
                                onClick={() => setSelectedWeek(Math.min(selectedWeek + 1, 2))}
                                disabled={selectedWeek === 2}
                                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Habit Progress */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">{habitAnalysis.completionRate}%</div>
                            <div className="text-white/70 text-sm">Completion</div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">{habitAnalysis.workoutHabits}</div>
                            <div className="text-white/70 text-sm">Workouts</div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">{habitAnalysis.learningHabits}</div>
                            <div className="text-white/70 text-sm">Learning</div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">{habitAnalysis.personalHabits}</div>
                            <div className="text-white/70 text-sm">Personal</div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <motion.div 
                        className="bg-white/10 rounded-2xl p-4 border border-white/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <SparklesIcon className="w-5 h-5 text-yellow-400" />
                            <h4 className="text-white font-semibold">AI Insights</h4>
                        </div>
                        <p className="text-white/80 text-sm">
                            {habitAnalysis.completionRate > 80 
                                ? "Excellent week! Your consistency is building strong habits. Keep up the momentum!"
                                : habitAnalysis.completionRate > 60
                                ? "Good progress! Try to complete a few more tasks to reach your full potential."
                                : "Focus on completing at least one task per day to build momentum and establish better habits."
                            }
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// 3D Animated Praxis Rewards Visual
function PraxisRewardsVisual() {
    const [rotation, setRotation] = useState(0);
    const [pulseScale, setPulseScale] = useState(1);

    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setRotation(prev => (prev + 0.5) % 360);
        }, 16);

        const pulseInterval = setInterval(() => {
            setPulseScale(prev => prev === 1 ? 1.05 : 1);
        }, 2000);

        return () => {
            clearInterval(rotationInterval);
            clearInterval(pulseInterval);
        };
    }, []);

    const pointsCalculation = [
        { action: "Complete Task", points: "+50", color: "#10B981" },
        { action: "Workout", points: "+30", color: "#F59E0B" },
        { action: "Create Note", points: "+20", color: "#3B82F6" },
        { action: "Daily Streak", points: "+100", color: "#EF4444" }
    ];

    return (
        <motion.div
            className="bg-surface rounded-2xl p-6 border border-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            <div className="text-center mb-6">
                <h3 className="text-text text-xl font-semibold mb-2">Praxis Rewards</h3>
                <p className="text-text/60 text-sm">Earn points for productivity</p>
            </div>

            {/* 3D Animated Logo */}
            <div className="flex justify-center mb-6">
                <motion.div
                    className="relative w-20 h-20"
                    animate={{ 
                        rotateY: rotation,
                        scale: pulseScale
                    }}
                    transition={{ 
                        rotateY: { duration: 0.1, ease: "linear" },
                        scale: { duration: 0.5, ease: "easeInOut" }
                    }}
                >
                    <div className="w-full h-full bg-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">P</span>
                    </div>
                    <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-md"></div>
                </motion.div>
            </div>

            {/* Points Calculation */}
            <div className="space-y-3">
                {pointsCalculation.map((item, index) => (
                    <motion.div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg"
                        style={{ backgroundColor: `${item.color}10` }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <span className="text-text text-sm font-medium">{item.action}</span>
                        <span 
                            className="text-sm font-bold"
                            style={{ color: item.color }}
                        >
                            {item.points}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <div className="text-text/60 text-xs">
                    Points multiply with streaks and achievements
                </div>
            </div>
        </motion.div>
    );
}


// Dashboard Content Component - Schedule UI Style
function DashboardContent({ tasks, notes, healthData, briefing, categoryColors, onCompleteTask, setFocusTask }: {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    briefing: MissionBriefing;
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    setFocusTask: (task: Task | null) => void;
}) {
    const todayTasks = useMemo(() => 
        tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        [tasks]
    );

    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

    // Daily greeting with time-based message and user name
    const getUserName = () => {
        return localStorage.getItem('praxis-user-name') || 'there';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = getUserName();
        if (hour < 12) return `Good Morning, ${name}`;
        if (hour < 17) return `Good Afternoon, ${name}`;
        return `Good Evening, ${name}`;
    };

    // Philosophical quotes for daily inspiration
    const dailyQuotes = [
        { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
        { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
        { text: "Love and kindness are never wasted. They always make a difference.", author: "Barbara De Angelis" },
        { text: "Be yourself; everyone else is already taken. But make sure that self is kind.", author: "Oscar Wilde" },
        { text: "The meaning of life is to find your gift. The purpose of life is to give it away.", author: "Pablo Picasso" },
        { text: "In a world where you can be anything, be kind. It costs nothing but means everything.", author: "Unknown" }
    ];

    const todayQuote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

    return (
        <motion.div variants={itemVariants} className="space-y-8">
            {/* Unified Daily Greeting Section */}
            <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: categoryColors['Learning'] || '#3B82F6' }}>
                <div className="p-8">
                    {/* Main Greeting Row with Next Up and Weather */}
                    <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
                        <div className="text-center lg:text-left mb-6 lg:mb-0">
                            <h1 className="text-6xl font-bold text-white mb-4">{getGreeting()}</h1>
                            <div className="text-white/70 text-lg">
                    {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                                    day: 'numeric'
                    })}
                </div>
            </div>

                        {/* Next Up and Weather Widget */}
                        <div className="flex items-center gap-6">
                            <WeatherWidget />
                            {todayTasks.length > 0 && (
                                <div 
                                    className="bg-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/30 transition-all duration-300 min-w-[200px]"
                                    onClick={() => {
                                        const event = new CustomEvent('openEventDetail', { 
                                            detail: { task: todayTasks[0] } 
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    <h4 className="text-white font-semibold text-lg mb-1">Next Up</h4>
                                    <div className="text-white/80 text-sm mb-1">{todayTasks[0].title}</div>
                                    <div className="text-white/60 text-xs">
                                        {new Date(todayTasks[0].startTime).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })} • {todayTasks[0].plannedDuration} min
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Quote - No Box */}
                    <div className="text-center mb-8">
                        <blockquote className="text-white text-2xl italic leading-relaxed mb-3">
                            "{todayQuote.text}"
                        </blockquote>
                        <cite className="text-white/70 text-lg font-medium">— {todayQuote.author}</cite>
                </div>

                    {/* Integrated Health & Habits Widget */}
                    <div className="bg-white/10 rounded-2xl p-6">
                        <EnhancedHealthHabitsWidget 
                            healthData={healthData} 
                            notes={notes} 
                            tasks={tasks} 
                        />
                    </div>
                </div>
                        </div>

            {/* Praxis Rewards Section */}
            <div className="flex justify-center">
                <div className="w-full max-w-md">
                    <PraxisRewardsVisual />
                </div>
            </div>

            {/* Today's Tasks - Pill-shaped Interface */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-text text-xl font-semibold">Today's Tasks</h2>
                    <button
                        onClick={() => {
                            // Navigate to schedule view
                            const event = new CustomEvent('navigateToSchedule');
                            window.dispatchEvent(event);
                        }}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                    >
                        View Complete Schedule →
                    </button>
                </div>
                
                {todayTasks.length > 0 ? (
                    <div className="space-y-3">
                        {todayTasks.map((task) => {
                            const categoryColor = categoryColors[task.category] || '#6B7280';
                            const startTime = new Date(task.startTime);
                            const isCompleted = task.status === 'Completed';

                            return (
                            <motion.div
                                key={task.id}
                                    className="flex items-center gap-4 p-4 rounded-full border border-border hover:bg-surface/50 transition-all duration-300 cursor-pointer"
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => {
                                        const event = new CustomEvent('openEventDetail', { 
                                            detail: { task } 
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    {/* Category Indicator */}
                                    <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: categoryColor }}
                                    />
                                    
                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-text font-medium truncate ${isCompleted ? 'line-through opacity-60' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="text-text/60 text-sm">
                                            {startTime.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })} • {task.plannedDuration} min
                                        </div>
                                </div>
                                    
                                    {/* Complete/Undo Button */}
                                <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isCompleted) {
                                                // Undo complete - would need to implement this
                                                console.log('Undo complete task:', task.id);
                                            } else {
                                                onCompleteTask(task.id);
                                            }
                                        }}
                                        className={`p-2 rounded-full transition-colors ${
                                            isCompleted 
                                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                                : 'bg-surface/50 text-text/60 hover:bg-surface/70'
                                        }`}
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-text/40 text-lg mb-2">No tasks for today</div>
                        <div className="text-text/30 text-sm">Add some tasks to get started!</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}


// Main Unified Dashboard Component - Clean Schedule UI Style
export default function UnifiedDashboard(props: UnifiedDashboardProps) {
    const { tasks, notes, healthData, briefing, categoryColors, onCompleteTask, setFocusTask } = props;

    return (
        <div className="min-h-screen bg-bg text-text p-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <DashboardContent
                        tasks={tasks}
                        notes={notes}
                        healthData={healthData}
                        briefing={briefing}
                        categoryColors={categoryColors}
                        onCompleteTask={onCompleteTask}
                        setFocusTask={setFocusTask}
                    />
                </motion.div>
            </div>
        </div>
    );
}
