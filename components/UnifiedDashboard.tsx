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
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="text-2xl">{getIconForCode(code)}</div>
            <div>
                <div className="text-xl font-bold text-white">
                    {loading ? '—' : tempC ? `${Math.round(tempC)}°C` : '—'}
                </div>
                <div className="text-white/70 text-sm">
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

            {/* Health Tab - Interactive Charts */}
            {activeTab === 'health' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Sleep - Interactive */}
                    <motion.div 
                        className="bg-white/10 rounded-xl p-3 border border-white/20 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            // Trigger AI insight for sleep
                            const event = new CustomEvent('requestAIInsight', { 
                                detail: { type: 'sleep', data: healthMetrics.sleep } 
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.sleep.color }}>
                                <SunIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Sleep</h3>
                                <p className="text-white/70 text-xs">{healthMetrics.sleep.quality}</p>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-white">{healthMetrics.sleep.hours}h</div>
                        <div className="text-white/60 text-xs">Average</div>
                        {/* Mini Chart */}
                        <div className="mt-2 h-8 flex items-end gap-1">
                            {[6, 7, 8, 7.5, 8, 7, 8].map((hour, i) => (
                                <div 
                                    key={i}
                                    className="bg-white/30 rounded-sm flex-1"
                                    style={{ height: `${(hour / 10) * 100}%` }}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Energy - Interactive */}
                    <motion.div 
                        className="bg-white/10 rounded-xl p-3 border border-white/20 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            const event = new CustomEvent('requestAIInsight', { 
                                detail: { type: 'energy', data: healthMetrics.energy } 
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.energy.color }}>
                                <BoltIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Energy</h3>
                                <p className="text-white/70 text-xs">Level</p>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-white">{healthMetrics.energy.level}</div>
                        <div className="text-white/60 text-xs">Today</div>
                        {/* Energy Bar */}
                        <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full rounded-full"
                                style={{ backgroundColor: healthMetrics.energy.color }}
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    </motion.div>

                    {/* Activity - Interactive */}
                    <motion.div 
                        className="bg-white/10 rounded-xl p-3 border border-white/20 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            const event = new CustomEvent('requestAIInsight', { 
                                detail: { type: 'activity', data: healthMetrics.activity } 
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: healthMetrics.activity.color }}>
                                <HeartIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Activity</h3>
                                <p className="text-white/70 text-xs">Today</p>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-white">{healthMetrics.activity.steps.toLocaleString()}</div>
                        <div className="text-white/60 text-xs">Steps</div>
                        {/* Activity Ring */}
                        <div className="mt-2 relative w-8 h-8">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/20" />
                                <motion.circle
                                    cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" fill="none"
                                    strokeLinecap="round"
                                    className="text-white"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 0.7 }}
                                    transition={{ duration: 1, delay: 0.7 }}
                                />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Habits Tab - Interactive with Weak Week Analysis */}
            {activeTab === 'habits' && (
                <div className="space-y-3">
                    {/* Week Selector */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold text-sm">Habit Progress</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedWeek(Math.max(selectedWeek - 1, -2))}
                                disabled={selectedWeek === -2}
                                className="p-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-white text-xs">
                                {weeks[selectedWeek + 2].label}
                            </span>
                            <button
                                onClick={() => setSelectedWeek(Math.min(selectedWeek + 1, 2))}
                                disabled={selectedWeek === 2}
                                className="p-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
                            >
                                <ChevronRightIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Habit Progress - Interactive Charts */}
                    <div className="grid grid-cols-2 gap-2">
                        <motion.div 
                            className="bg-white/10 rounded-xl p-3 text-center cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                                const event = new CustomEvent('requestAIInsight', { 
                                    detail: { type: 'completion', data: habitAnalysis } 
                                });
                                window.dispatchEvent(event);
                            }}
                        >
                            <div className="text-xl font-bold text-white">{habitAnalysis.completionRate}%</div>
                            <div className="text-white/70 text-xs">Completion</div>
                            {/* Progress Ring */}
                            <div className="mt-2 relative w-8 h-8 mx-auto">
                                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/20" />
                                    <motion.circle
                                        cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" fill="none"
                                        strokeLinecap="round"
                                        className="text-white"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: habitAnalysis.completionRate / 100 }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </svg>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white/10 rounded-xl p-3 text-center cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                                const event = new CustomEvent('requestAIInsight', { 
                                    detail: { type: 'workout', data: { count: habitAnalysis.workoutHabits } } 
                                });
                                window.dispatchEvent(event);
                            }}
                        >
                            <div className="text-xl font-bold text-white">{habitAnalysis.workoutHabits}</div>
                            <div className="text-white/70 text-xs">Workouts</div>
                            {/* Mini Bar Chart */}
                            <div className="mt-2 h-6 flex items-end gap-1 justify-center">
                                {[1, 2, 0, 1, 3, 1, 2].map((count, i) => (
                                    <div 
                                        key={i}
                                        className="bg-white/40 rounded-sm w-2"
                                        style={{ height: `${Math.max(count * 20, 10)}%` }}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white/10 rounded-xl p-3 text-center cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                                const event = new CustomEvent('requestAIInsight', { 
                                    detail: { type: 'learning', data: { count: habitAnalysis.learningHabits } } 
                                });
                                window.dispatchEvent(event);
                            }}
                        >
                            <div className="text-xl font-bold text-white">{habitAnalysis.learningHabits}</div>
                            <div className="text-white/70 text-xs">Learning</div>
                            {/* Learning Streak */}
                            <div className="mt-2 flex justify-center gap-1">
                                {[true, true, false, true, true, true, false].map((completed, i) => (
                                    <div 
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${completed ? 'bg-white' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white/10 rounded-xl p-3 text-center cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                                const event = new CustomEvent('requestAIInsight', { 
                                    detail: { type: 'personal', data: { count: habitAnalysis.personalHabits } } 
                                });
                                window.dispatchEvent(event);
                            }}
                        >
                            <div className="text-xl font-bold text-white">{habitAnalysis.personalHabits}</div>
                            <div className="text-white/70 text-xs">Personal</div>
                            {/* Personal Growth Indicator */}
                            <div className="mt-2 text-xs text-white/60">
                                {habitAnalysis.personalHabits > 3 ? 'Growing!' : 'Building...'}
                            </div>
                        </motion.div>
                    </div>

                    {/* Weak Week Analysis */}
                    <motion.div 
                        className="bg-white/10 rounded-xl p-3 border border-white/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-4 h-4 text-yellow-400" />
                            <h4 className="text-white font-semibold text-sm">Weak Week Analysis</h4>
                        </div>
                        <p className="text-white/80 text-xs">
                            {habitAnalysis.completionRate > 80 
                                ? "Excellent week! Your consistency is building strong habits. Keep up the momentum!"
                                : habitAnalysis.completionRate > 60
                                ? "Good progress! Try to complete a few more tasks to reach your full potential."
                                : "Focus on completing at least one task per day to build momentum and establish better habits."
                            }
                        </p>
                        <button
                            onClick={() => {
                                const event = new CustomEvent('requestAIInsight', { 
                                    detail: { type: 'weakWeek', data: habitAnalysis } 
                                });
                                window.dispatchEvent(event);
                            }}
                            className="mt-2 text-xs text-yellow-400 hover:text-yellow-300"
                        >
                            Get Kiko's Insight →
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// Enhanced 3D Praxis Rewards Visual with Motivation
function PraxisRewardsVisual() {
    const [rotation, setRotation] = useState(0);
    const [pulseScale, setPulseScale] = useState(1);
    const [currentPoints, setCurrentPoints] = useState(1250);
    const [level, setLevel] = useState(3);

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
        { action: "Complete Task", points: "+50", color: "#10B981", icon: "✓" },
        { action: "Workout", points: "+30", color: "#F59E0B", icon: "💪" },
        { action: "Create Note", points: "+20", color: "#3B82F6", icon: "📝" },
        { action: "Daily Streak", points: "+100", color: "#EF4444", icon: "🔥" }
    ];

    const nextLevelPoints = level * 500;
    const progressToNext = ((currentPoints % 500) / 500) * 100;

    return (
        <motion.div
            className="bg-gradient-to-br from-surface to-surface/80 rounded-2xl p-4 border border-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            {/* Header with Level and Points */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-text text-lg font-semibold">Praxis Rewards</h3>
                    <p className="text-text/60 text-sm">Level {level} • {currentPoints} points</p>
                </div>
                <div className="text-right">
                    <div className="text-text/60 text-xs">Next Level</div>
                    <div className="text-text font-semibold">{nextLevelPoints - currentPoints} pts</div>
                </div>
            </div>

            {/* 3D Animated Logo with Progress Ring */}
            <div className="flex justify-center mb-4">
                <motion.div
                    className="relative w-16 h-16"
                    animate={{ 
                        rotateY: rotation,
                        scale: pulseScale
                    }}
                    transition={{ 
                        rotateY: { duration: 0.1, ease: "linear" },
                        scale: { duration: 0.5, ease: "easeInOut" }
                    }}
                >
                    <div className="w-full h-full bg-accent rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl font-bold">P</span>
                    </div>
                    <div className="absolute inset-0 bg-accent/30 rounded-xl blur-sm"></div>
                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-text/20"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            className="text-accent"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progressToNext / 100 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />
                    </svg>
                </motion.div>
            </div>

            {/* Points Calculation - Horizontal Layout */}
            <div className="grid grid-cols-2 gap-2">
                {pointsCalculation.map((item, index) => (
                    <motion.div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: `${item.color}10` }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-text text-xs font-medium truncate">{item.action}</div>
                            <div 
                                className="text-xs font-bold"
                                style={{ color: item.color }}
                            >
                                {item.points}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Motivation Message */}
            <motion.div 
                className="mt-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <div className="text-text/60 text-xs">
                    {progressToNext > 80 
                        ? "Almost there! Keep going! 🚀"
                        : progressToNext > 50
                        ? "Great progress! You're on fire! 🔥"
                        : "Every point counts! Stay consistent! 💪"
                    }
                </div>
            </motion.div>
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

    // Kiko AI Wisdom Quotes
    const kikoWisdom = [
        "Every task completed is a step closer to your dreams. Let's make today count!",
        "Consistency is the bridge between goals and accomplishments. You've got this!",
        "Small progress is still progress. Celebrate every win, no matter how small.",
        "Your future self will thank you for the work you do today. Keep pushing forward!",
        "Discipline is choosing between what you want now and what you want most.",
        "The only impossible journey is the one you never begin. Start where you are!"
    ];

    const getKikoWisdom = () => {
        return kikoWisdom[new Date().getDate() % kikoWisdom.length];
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
            {/* Compact Horizontal Daily Greeting Section */}
            <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: categoryColors['Learning'] || '#3B82F6' }}>
                <div className="p-6">
                    {/* Main Greeting Row - Horizontal Layout */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-white mb-2">{getGreeting()}</h1>
                            <div className="text-white/70 text-lg">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                        
                        {/* Weather Widget - No Box */}
                        <div className="flex items-center gap-4">
                            <WeatherWidget />
                        </div>
                    </div>

                    {/* Kiko's Wisdom - No Box */}
                    <div className="text-center mb-6">
                        <div className="text-white text-xl italic leading-relaxed mb-2">
                            "{getKikoWisdom()}"
                        </div>
                        <div className="text-white/70 text-sm">— Kiko's Wisdom</div>
                    </div>

                    {/* Integrated Health & Habits Widget - Horizontal */}
                    <div className="bg-white/10 rounded-2xl p-4">
                        <EnhancedHealthHabitsWidget 
                            healthData={healthData} 
                            notes={notes} 
                            tasks={tasks} 
                        />
                    </div>
                </div>
            </div>

            {/* Next Up Section - Right Under Greeting */}
            {todayTasks.length > 0 && (
                <div className="bg-surface rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-text text-lg font-semibold">Next Up</h3>
                        <button
                            onClick={() => {
                                const event = new CustomEvent('openEventDetail', { 
                                    detail: { task: todayTasks[0] } 
                                });
                                window.dispatchEvent(event);
                            }}
                            className="text-accent hover:text-accent/80 text-sm font-medium"
                        >
                            View Details →
                        </button>
                    </div>
                    <div 
                        className="p-4 rounded-xl cursor-pointer hover:bg-surface/50 transition-all duration-300 border border-border"
                        onClick={() => {
                            const event = new CustomEvent('openEventDetail', { 
                                detail: { task: todayTasks[0] } 
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <h4 className="text-text font-semibold text-lg mb-2">{todayTasks[0].title}</h4>
                        <div className="text-text/70 text-sm">
                            {new Date(todayTasks[0].startTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })} • {todayTasks[0].plannedDuration} min
                        </div>
                    </div>
                </div>
            )}

            {/* Praxis Rewards Section - Horizontal Layout */}
            <div className="w-full">
                <PraxisRewardsVisual />
            </div>

            {/* Today's Tasks - Interactive Pill-shaped Interface */}
            <div className="bg-surface rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-text text-lg font-semibold">Today's Tasks</h2>
                    <button
                        onClick={() => {
                            const event = new CustomEvent('navigateToSchedule');
                            window.dispatchEvent(event);
                        }}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                    >
                        View Schedule →
                    </button>
                </div>
                
                {todayTasks.length > 0 ? (
                    <div className="space-y-2">
                        {todayTasks.map((task) => {
                            const categoryColor = categoryColors[task.category] || '#6B7280';
                            const startTime = new Date(task.startTime);
                            const isCompleted = task.status === 'Completed';

                            return (
                                <motion.div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-full border border-border hover:bg-surface/50 transition-all duration-300 cursor-pointer group"
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    onClick={() => {
                                        const event = new CustomEvent('openEventDetail', { 
                                            detail: { task } 
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    {/* Category Indicator with Animation */}
                                    <motion.div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: categoryColor }}
                                        whileHover={{ scale: 1.2 }}
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
                                    
                                    {/* Complete/Undo Button with Animation */}
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isCompleted) {
                                                console.log('Undo complete task:', task.id);
                                            } else {
                                                onCompleteTask(task.id);
                                            }
                                        }}
                                        className={`p-2 rounded-full transition-colors ${
                                            isCompleted 
                                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                                : 'bg-surface/50 text-text/60 hover:bg-surface/70 group-hover:bg-accent/20 group-hover:text-accent'
                                        }`}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
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
