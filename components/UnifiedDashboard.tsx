import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { 
    CheckCircleIcon, SparklesIcon, FireIcon, HeartIcon, BoltIcon, ClockIcon
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

    // Daily greeting with time-based message
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
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
            {/* Unified Header Section */}
            <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: categoryColors['Learning'] || '#3B82F6' }}>
                <div className="p-8">
                    {/* Main Greeting Row */}
                    <div className="flex flex-col lg:flex-row items-center justify-between mb-6">
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
                        <div className="flex items-center gap-6">
                            <WeatherWidget />
                            {todayTasks.length > 0 && (
                                <div 
                                    className="bg-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/30 transition-all duration-300 min-w-[200px]"
                                    onClick={() => setFocusTask(todayTasks[0])}
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

                    {/* Daily Quote */}
                    <div className="bg-white/10 rounded-2xl p-6 text-center">
                        <blockquote className="text-white text-xl italic leading-relaxed mb-3">
                            "{todayQuote.text}"
                        </blockquote>
                        <cite className="text-white/70 text-base font-medium">— {todayQuote.author}</cite>
                    </div>
                </div>
                </div>
                
            {/* Enhanced Health & Habits with Visuals */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
                <IntegratedHealthInsights 
                    healthData={healthData} 
                    notes={notes} 
                    tasks={tasks} 
                />
            </div>

            {/* Dynamic Stats and Rewards Section */}
            <div className="flex flex-wrap gap-4">
                <motion.div 
                    className="flex-1 min-w-[200px] p-4 rounded-2xl text-center border border-border"
                    style={{ backgroundColor: categoryColors['Prototyping'] || '#A855F7' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-2xl font-bold text-white">{todayTasks.length}</div>
                    <div className="text-white/80 text-sm">Tasks Today</div>
                    <div className="text-white/60 text-xs">{completedToday} done</div>
                </motion.div>

                <motion.div 
                    className="flex-1 min-w-[200px] p-4 rounded-2xl text-center border border-border"
                    style={{ backgroundColor: categoryColors['Workout'] || '#EC4899' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-2xl font-bold text-white">{completionRate}%</div>
                    <div className="text-white/80 text-sm">Complete</div>
                    <div className="text-white/60 text-xs">Today's rate</div>
                </motion.div>

                <motion.div 
                    className="flex-1 min-w-[200px] p-4 rounded-2xl text-center border border-border"
                    style={{ backgroundColor: categoryColors['Personal'] || '#6366F1' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-2xl font-bold text-white">{notes.length}</div>
                    <div className="text-white/80 text-sm">Notes</div>
                    <div className="text-white/60 text-xs">Total created</div>
                </motion.div>

                <div className="flex-1 min-w-[300px]">
                    <PraxisRewardsVisual />
                </div>
            </div>

            {/* Today's Tasks - Schedule UI Style */}
            <div>
                <h2 className="text-3xl font-bold text-text mb-6">Today's Tasks</h2>
                {todayTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {todayTasks.map((task) => {
                            const categoryColor = categoryColors[task.category] || '#6B7280';
                            const startTime = new Date(task.startTime);
                            const endTime = new Date(startTime.getTime() + task.plannedDuration * 60000);
                            const isCompleted = task.status === 'Completed';

                            return (
                            <motion.div
                                key={task.id}
                                    layoutId={`task-card-${task.id}`}
                                    onClick={() => setFocusTask(task)}
                                    animate={{ opacity: isCompleted ? 0.6 : 1 }}
                                    className="p-6 rounded-3xl cursor-pointer text-white flex-shrink-0"
                                    style={{ backgroundColor: categoryColor }}
                                whileHover={{ scale: 1.02 }}
                            >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-3/4">
                                            <h3 className="text-2xl font-bold relative inline-block break-words">
                                                {task.title}
                                                {isCompleted && (
                                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current" />
                                                )}
                                            </h3>
                                </div>
                                <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCompleteTask(task.id);
                                            }}
                                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                    </div>
                                    <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                                        <div className="text-center">
                                            <p className="font-semibold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                            <p className="text-sm opacity-80">Start</p>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/20">
                                            {task.plannedDuration} Min
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold">{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                            <p className="text-sm opacity-80">End</p>
                                        </div>
                                    </div>
                            </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-text/60 text-xl">No tasks for today</p>
                        <p className="text-text/40 text-sm mt-2">Add some tasks to get started!</p>
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
