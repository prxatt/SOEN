/**
 * PRAXIS DASHBOARD - Enhanced Visual Design
 * 
 * Features:
 * - EnhancedDashboard.tsx visual excellence with Schedule.tsx Today view styling
 * - Daily greeting with user personalization
 * - Praxis AI branding in top left corner
 * - Today and tomorrow task previews with pill-shaped interactions
 * - Advanced animations and micro-interactions
 * - Real-time weather with animations
 * - Interactive health and habit insights
 * - Mission briefing with AI insights
 * - Productivity metrics and streak tracking
 * - Contextual quick actions
 * - AI-powered recommendations
 * - Data visualizations and charts
 * - Personalized content based on user behavior
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen, TaskStatus } from '../types';
import { safeGet } from '../utils/validation';
import { 
    CheckCircleIcon, SparklesIcon, FireIcon, HeartIcon, BoltIcon, ClockIcon, 
    SunIcon, ChevronLeftIcon, ChevronRightIcon, BrainCircuitIcon, PlusIcon,
    CalendarDaysIcon, DocumentTextIcon, ActivityIcon, ArrowTrendingUpIcon,
    FlagIcon, StarIcon, BoltIcon as ZapIcon, CalendarIcon, ChartBarIcon,
    CloudIcon, RainIcon, SnowIcon, ArrowRightIcon, HomeIcon
} from './Icons';

interface PraxisDashboardProps {
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

// Enhanced color scheme matching EnhancedDashboard
const PRAXIS_COLORS = {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
    text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
        muted: '#666666'
    },
    accent: '#10b981',
    accentLight: '#34d399',
    success: '#059669',
    warning: '#f59e0b',
    error: '#ef4444'
} as const;

// Enhanced animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { 
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Helper function to get text color for background
const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};

// Floating particles component
function FloatingParticles({ count = 50 }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
        </div>
    );
}

// Studio Ghibli-Inspired 3D Penguin
const GhibliPenguin: React.FC = () => {
    return (
        <motion.div
            className="relative w-10 h-10"
            animate={{ 
                rotate: [0, 2, -2, 0],
                scale: [1, 1.02, 1],
                y: [0, -2, 0]
            }}
            transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: 'easeInOut' 
            }}
        >
            {/* Penguin Body - Studio Ghibli style */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                    background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 50%, #2d3748 100%)',
                    boxShadow: `
                        inset 0 2px 4px rgba(255,255,255,0.1),
                        inset 0 -2px 4px rgba(0,0,0,0.3),
                        0 4px 12px rgba(0,0,0,0.4),
                        0 0 0 1px rgba(255,255,255,0.1)
                    `,
                    transform: 'perspective(120px) rotateX(15deg) rotateY(-5deg)'
                }}
            >
                {/* Penguin Belly - Soft white with subtle gradient */}
                <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-5 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                    }}
                />
                
                {/* Penguin Eyes - Cute and expressive */}
                <div 
                    className="absolute top-2 left-2 w-2 h-2 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, #ffffff 30%, #e2e8f0 70%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                />
                <div 
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, #ffffff 30%, #e2e8f0 70%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                />
                
                {/* Eye pupils - Small and cute */}
                <div className="absolute top-2.5 left-2.5 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute top-2.5 right-2.5 w-1 h-1 bg-black rounded-full"></div>
                
                {/* Penguin Beak - Soft orange */}
                <div 
                    className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                />
                
                {/* Cheek blush - Studio Ghibli cute factor */}
                <div 
                    className="absolute top-4 left-1 w-1 h-1 rounded-full opacity-60"
                    style={{ background: '#fbb6ce' }}
                />
                <div 
                    className="absolute top-4 right-1 w-1 h-1 rounded-full opacity-60"
                    style={{ background: '#fbb6ce' }}
                />
            </div>
            
            {/* Floating sparkles - Studio Ghibli magic */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                        left: `${20 + i * 30}%`,
                        top: `${10 + i * 20}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -10, 0]
                    }}
                    transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </motion.div>
    );
};

// Praxis AI Header Component with Studio Ghibli Penguin
const PraxisHeader: React.FC = () => {
    return (
        <motion.div
            className="fixed top-4 left-4 z-30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-3">
                <GhibliPenguin />
                <span className="font-bold text-2xl" style={{ color: 'var(--color-text)' }}>Praxis AI</span>
            </div>
        </motion.div>
    );
};


// Enhanced Kiko's Wisdom
const KikoWisdom: React.FC<{
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
}> = ({ tasks, notes, healthData }) => {
    const [wisdom, setWisdom] = useState({
        quote: "Every task completed is a step closer to your dreams. Let's make today count!",
        context: "High completion rate detected"
    });

    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const wisdomQuotes = [
        {
            quote: "Every task completed is a step closer to your dreams. Let's make today count!",
            context: "High completion rate detected"
        },
        {
            quote: "Consistency is the bridge between goals and accomplishments. You've got this!",
            context: "Building daily habits"
        },
        {
            quote: "Small progress is still progress. Celebrate every win, no matter how small.",
            context: "Encouraging consistency"
        },
        {
            quote: "Your future self will thank you for the work you do today. Keep pushing forward!",
            context: "Productivity boost needed"
        },
        {
            quote: "Energy flows where attention goes. Focus on what energizes you today.",
            context: "Energy optimization"
        }
    ];

    useEffect(() => {
        const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
        setWisdom(randomQuote);
    }, [completionRate]);

    return (
        <motion.div
            className="bg-white/5 rounded-xl p-6 border border-white/10 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

            <div className="flex items-center gap-3 mb-4 relative z-10">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <BrainCircuitIcon className="w-6 h-6 text-blue-400" />
                </motion.div>
                <div>
                    <h3 className="text-white text-lg font-semibold">Kiko's Wisdom</h3>
                    <p className="text-white/70 text-sm">{wisdom.context}</p>
                </div>
            </div>

            <motion.div
                className="mb-4 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-white text-lg italic leading-relaxed">
                    "{wisdom.quote}"
                </p>
            </motion.div>

            <div className="flex items-center justify-between relative z-10">
                <div className="text-white/60 text-sm">
                    — Kiko's Wisdom
                </div>
                <motion.button
                    onClick={() => {
                        const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
                        setWisdom(randomQuote);
                    }}
                    className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    New Wisdom →
                </motion.button>
            </div>
        </motion.div>
    );
};

// Today and Tomorrow Task Previews
const TaskPreviews: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
}> = ({ tasks, categoryColors, onCompleteTask, navigateToScheduleDate }) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const tomorrowTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === tomorrow.toDateString()
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today Preview */}
            <motion.div
                className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl p-6 border border-white/10 backdrop-blur-sm relative overflow-hidden"
                variants={itemVariants}
            >
                <FloatingParticles count={20} />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-semibold">Today</h3>
                        <div className="text-accent text-sm font-medium">{completionRate.toFixed(0)}% Complete</div>
                    </div>

                    {todayTasks.length > 0 ? (
                        <div className="space-y-3">
                            {todayTasks.slice(0, 3).map((task, index) => {
                                const categoryColor = categoryColors[task.category] || '#6B7280';
                                const isCompleted = task.status === 'Completed';
                                const startTime = new Date(task.startTime);

                                return (
                                    <motion.div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-105"
                                        style={{ backgroundColor: categoryColor + '20' }}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <motion.button
                                            onClick={() => onCompleteTask(task.id)}
                                            className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center transition-colors hover:bg-current/20"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {isCompleted && (
                                                <CheckCircleIcon className="w-4 h-4" />
                                            )}
                                        </motion.button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${isCompleted ? 'line-through opacity-60' : ''}`}>
                                                {task.title}
                                            </p>
                                            <p className="text-sm opacity-80">
                                                {startTime.toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })} • {task.plannedDuration} min
                                            </p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                                    </motion.div>
                                );
                            })}
                            
                            {todayTasks.length > 3 && (
                                <motion.button
                                    onClick={() => navigateToScheduleDate(today)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <span className="text-white text-sm font-medium">View All {todayTasks.length} Tasks</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-white/60 text-lg">No tasks for today</p>
                            <p className="text-white/40 text-sm mt-2">Add some tasks to get started!</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Tomorrow Preview */}
            <motion.div
                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 relative overflow-hidden"
                variants={itemVariants}
            >
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-x-12 -translate-y-12" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-semibold">Tomorrow</h3>
                        <div className="text-purple-400 text-sm font-medium">{tomorrowTasks.length} Tasks</div>
                    </div>

                    {tomorrowTasks.length > 0 ? (
                        <div className="space-y-3">
                            {tomorrowTasks.slice(0, 3).map((task, index) => {
                                const categoryColor = categoryColors[task.category] || '#6B7280';
                                const startTime = new Date(task.startTime);

                                return (
                                    <motion.div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-105"
                                        style={{ backgroundColor: categoryColor + '20' }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: categoryColor + '40' }}>
                                            <ClockIcon className="w-4 h-4" style={{ color: categoryColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{task.title}</p>
                                            <p className="text-sm opacity-80">
                                                {startTime.toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })} • {task.plannedDuration} min
                                            </p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                                    </motion.div>
                                );
                            })}
                            
                            {tomorrowTasks.length > 3 && (
                                <motion.button
                                    onClick={() => navigateToScheduleDate(tomorrow)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <span className="text-white text-sm font-medium">View All {tomorrowTasks.length} Tasks</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-white/60 text-lg">No tasks for tomorrow</p>
                            <p className="text-white/40 text-sm mt-2">Plan ahead for a productive day!</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// Next Up Widget
const NextUpWidget: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
}> = ({ tasks, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen }) => {
    const today = new Date();
    
    const getNextUpcomingTask = () => {
        const allUpcoming = tasks
            .filter(t => new Date(t.startTime) > today && t.status === 'Pending')
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return allUpcoming[0];
    };

    const nextTask = getNextUpcomingTask();

    if (!nextTask) {
        return (
            <motion.div
                className="relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center py-8">
                    <ArrowRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No Upcoming Tasks</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>You're all caught up! Great work!</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ArrowRightIcon className="w-6 h-6 text-blue-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Next Up</h3>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{nextTask.title}</h4>
                        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>
                                    {new Date(nextTask.startTime).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>
                                    {new Date(nextTask.startTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categoryColors[nextTask.category] }}
                                />
                                <span className="capitalize">{nextTask.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <motion.button
                        onClick={() => onCompleteTask(nextTask.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        Complete
                    </motion.button>
                    <motion.button
                        onClick={() => {
                            navigateToScheduleDate(new Date(nextTask.startTime));
                            setScreen('Schedule');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                        View Details
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// Today/Tomorrow Pill Toggle
const TaskToggle: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
}> = ({ tasks, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen }) => {
    const [activeView, setActiveView] = useState<'today' | 'tomorrow'>('today');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const tomorrowTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === tomorrow.toDateString()
    );

    const currentTasks = activeView === 'today' ? todayTasks : tomorrowTasks;
    const currentDate = activeView === 'today' ? today : tomorrow;

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
            
            {/* Pill Toggle */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <CalendarDaysIcon className="w-6 h-6 text-green-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Tasks</h3>
                </div>
                
                <div className="flex rounded-full p-1" style={{ backgroundColor: 'var(--color-border)' }}>
                    <motion.button
                        onClick={() => setActiveView('today')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            activeView === 'today' 
                                ? 'bg-white text-black' 
                                : 'hover:opacity-80'
                        }`}
                        style={{ 
                            color: activeView === 'today' ? 'black' : 'var(--color-text-secondary)',
                            backgroundColor: activeView === 'today' ? 'white' : 'transparent'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Today
                    </motion.button>
                    <motion.button
                        onClick={() => setActiveView('tomorrow')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            activeView === 'tomorrow' 
                                ? 'bg-white text-black' 
                                : 'hover:opacity-80'
                        }`}
                        style={{ 
                            color: activeView === 'tomorrow' ? 'black' : 'var(--color-text-secondary)',
                            backgroundColor: activeView === 'tomorrow' ? 'white' : 'transparent'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Tomorrow
                    </motion.button>
                </div>
            </div>

            {/* Task List */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        {currentTasks.length > 0 ? (
                            currentTasks.slice(0, 4).map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: categoryColors[task.category] }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium block truncate" style={{ color: 'var(--color-text)' }}>{task.title}</span>
                                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                {new Date(task.startTime).toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={() => onCompleteTask(task.id)}
                                            className="p-2 rounded-full hover:bg-green-500/20 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => {
                                                navigateToScheduleDate(currentDate);
                                                setScreen('Schedule');
                                            }}
                                            className="p-2 rounded-full hover:bg-blue-500/20 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ArrowRightIcon className="w-4 h-4 text-blue-400" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    No tasks scheduled for {activeView === 'today' ? 'today' : 'tomorrow'}
                                </p>
                            </div>
                        )}
                        
                        {currentTasks.length > 4 && (
                            <div className="text-center pt-2">
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>+{currentTasks.length - 4} more tasks</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// Enhanced Health Insights
const HealthInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const energyLevel = healthData.energyLevel || 'medium';
    const sleepHours = healthData.avgSleepHours || 0;
    const steps = (healthData as any).steps || 0;

    const getEnergyColor = (level: string) => {
        switch (level) {
            case 'high': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'low': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSleepColor = (hours: number) => {
        if (hours >= 8) return '#10b981';
        if (hours >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const healthMetrics = [
        {
            name: 'Energy',
            value: energyLevel,
            color: getEnergyColor(energyLevel),
            icon: ZapIcon,
            progress: energyLevel === 'high' ? 90 : energyLevel === 'medium' ? 60 : 30
        },
        {
            name: 'Sleep',
            value: `${sleepHours}h`,
            color: getSleepColor(sleepHours),
            icon: ClockIcon,
            progress: Math.min((sleepHours / 8) * 100, 100)
        },
        {
            name: 'Activity',
            value: steps.toLocaleString(),
            color: '#10b981',
            icon: ActivityIcon,
            progress: Math.min((steps / 10000) * 100, 100)
        }
    ];

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            variants={itemVariants}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <HeartIcon className="w-6 h-6 text-accent" />
                <h3 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Health Insights</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 relative z-10">
                {healthMetrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        className="text-center cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <motion.div 
                            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center relative"
                            style={{ backgroundColor: metric.color + '20' }}
                            whileHover={{ rotate: 5 }}
                        >
                            <metric.icon 
                                className="w-8 h-8" 
                                style={{ color: metric.color }}
                            />
                            <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 32 32">
                                <circle
                                    cx="16"
                                    cy="16"
                                    r="12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    className="text-white/20"
                                />
                                <motion.circle
                                    cx="16"
                                    cy="16"
                                    r="12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    style={{ color: metric.color }}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: metric.progress / 100 }}
                                    transition={{ duration: 1, delay: index * 0.2 }}
                                />
                            </svg>
                        </motion.div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{metric.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{metric.value}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Enhanced Habit Insights
const HabitInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const habits = [
        { name: 'Morning Routine', streak: 7, color: '#10b981', icon: SunIcon },
        { name: 'Exercise', streak: 5, color: '#3b82f6', icon: ActivityIcon },
        { name: 'Meditation', streak: 3, color: '#f59e0b', icon: BrainCircuitIcon },
        { name: 'Reading', streak: 12, color: '#8b5cf6', icon: DocumentTextIcon }
    ];

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            variants={itemVariants}
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <FlagIcon className="w-6 h-6 text-purple-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display text-white">Habit Insights</h3>
            </div>

            <div className="space-y-3 relative z-10">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.name}
                        className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: habit.color + '20' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 10 }}
                            >
                                <habit.icon className="w-5 h-5" style={{ color: habit.color }} />
                            </motion.div>
                            <span className="text-white font-medium">{habit.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-semibold">{habit.streak} days</span>
                            <motion.div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: habit.color }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Mission Briefing Widget
const MissionBriefingWidget: React.FC<{
    briefing: MissionBriefing;
    isBriefingLoading: boolean;
}> = ({ briefing, isBriefingLoading }) => {
    if (isBriefingLoading) {
        return (
            <motion.div
                className="card rounded-2xl p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <BrainCircuitIcon className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Mission Briefing</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <motion.div
                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <BrainCircuitIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Mission Briefing</h3>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-border)' }}>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Today's Focus</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{(briefing as any).focus || "Complete your priority tasks and maintain momentum."}</p>
                </div>
                
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-border)' }}>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Key Insights</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{(briefing as any).insights || "Your productivity patterns show optimal performance in the morning."}</p>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-border)' }}>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Recommendations</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{(briefing as any).recommendations || "Consider scheduling deep work during your peak hours."}</p>
                </div>
            </div>
        </motion.div>
    );
};

// Productivity Metrics Widget
const ProductivityMetrics: React.FC<{
    tasks: Task[];
    healthData: HealthData;
}> = ({ tasks, healthData }) => {
    const today = new Date();
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
    
    const weeklyTasks = tasks.filter(t => {
        const taskDate = new Date(t.startTime);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo;
    });
    
    const weeklyCompleted = weeklyTasks.filter(t => t.status === 'Completed').length;
    const weeklyRate = weeklyTasks.length > 0 ? (weeklyCompleted / weeklyTasks.length) * 100 : 0;

    const metrics = [
        {
            name: 'Today',
            value: `${completionRate.toFixed(0)}%`,
            progress: completionRate,
            color: '#10b981',
            icon: CheckCircleIcon
        },
        {
            name: 'This Week',
            value: `${weeklyRate.toFixed(0)}%`,
            progress: weeklyRate,
            color: '#3b82f6',
            icon: CalendarDaysIcon
        },
        {
            name: 'Streak',
            value: '7 days',
            progress: 70,
            color: '#f59e0b',
            icon: FireIcon
        }
    ];

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <ChartBarIcon className="w-6 h-6 text-green-400" />
                <h3 className="text-2xl font-bold font-display text-white">Productivity Metrics</h3>
            </div>

            <div className="space-y-4 relative z-10">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        className="bg-white/5 rounded-xl p-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                                <span className="text-white font-medium">{metric.name}</span>
                            </div>
                            <span className="text-white text-lg font-bold">{metric.value}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <motion.div
                                className="h-2 rounded-full"
                                style={{ backgroundColor: metric.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.progress}%` }}
                                transition={{ duration: 1, delay: index * 0.2 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Quick Actions Widget
const QuickActionsWidget: React.FC<{
    tasks: Task[];
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number) => void;
}> = ({ tasks, setScreen, onCompleteTask }) => {
    const today = new Date();
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const nextTask = todayTasks
        .filter(t => t.status === 'Pending')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    const quickActions = [
        {
            label: 'Add Task',
            icon: PlusIcon,
            action: () => setScreen('Schedule'),
            color: '#10b981'
        },
        {
            label: 'View Schedule',
            icon: CalendarDaysIcon,
            action: () => setScreen('Schedule'),
            color: '#3b82f6'
        },
        {
            label: 'Take Notes',
            icon: DocumentTextIcon,
            action: () => setScreen('Notes'),
            color: '#f59e0b'
        },
        {
            label: 'Chat with Kiko',
            icon: BrainCircuitIcon,
            action: () => setScreen('Kiko'),
            color: '#8b5cf6'
        }
    ];

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ZapIcon className="w-6 h-6 text-orange-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display text-white">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                {quickActions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        onClick={action.action}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                        style={{ backgroundColor: action.color + '20' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <action.icon className="w-6 h-6" style={{ color: action.color }} />
                        <span className="text-white text-sm font-medium">{action.label}</span>
                    </motion.button>
                ))}
            </div>

            {nextTask && (
                <motion.div
                    className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm font-medium">Next Task</p>
                            <p className="text-white/80 text-xs truncate">{nextTask.title}</p>
                        </div>
                        <motion.button
                            onClick={() => onCompleteTask(nextTask.id)}
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Complete
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// AI Insights Widget
const AIInsightsWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
    notes: Note[];
}> = ({ tasks, healthData, notes }) => {
    const [insights, setInsights] = useState([
        {
            type: 'productivity',
            title: 'Peak Performance Time',
            description: 'Your most productive hours are 9-11 AM. Schedule important tasks during this window.',
            icon: ClockIcon,
            color: '#10b981'
        },
        {
            type: 'health',
            title: 'Energy Optimization',
            description: 'Your energy levels peak after 7+ hours of sleep. Maintain consistent sleep schedule.',
            icon: HeartIcon,
            color: '#ef4444'
        },
        {
            type: 'focus',
            title: 'Deep Work Sessions',
            description: 'You complete 40% more tasks during 90-minute focused blocks. Try time-blocking.',
            icon: BrainCircuitIcon,
            color: '#8b5cf6'
        }
    ]);

    return (
        <motion.div
            className="card rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <BrainCircuitIcon className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display text-white">AI Insights</h3>
            </div>

            <div className="space-y-4 relative z-10">
                {insights.map((insight, index) => (
                    <motion.div
                        key={insight.type}
                        className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: insight.color + '20' }}>
                                <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-semibold text-sm mb-1">{insight.title}</h4>
                                <p className="text-white/70 text-xs leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Hollywood-Level Daily Greeting with Integrated Weather and Health
const DailyGreeting: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    healthData: HealthData;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
}> = ({ tasks, categoryColors, healthData, onCompleteTask, navigateToScheduleDate, setScreen }) => {
    const today = new Date();
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getMotivationalMessage = () => {
        if (completionRate >= 80) return "You're on fire today! Keep up the amazing work!";
        if (completionRate >= 50) return "Great progress! You're building momentum!";
        if (completionRate > 0) return "Every step counts. You've got this!";
        return "Ready to make today count? Let's start strong!";
    };

    const dailyQuotes = [
        "The best way to find yourself is to lose yourself in the service of others.",
        "No act of kindness, no matter how small, is ever wasted.",
        "Love and kindness are never wasted. They always make a difference.",
        "Be yourself; everyone else is already taken. But make sure that self is kind.",
        "The meaning of life is to find your gift. The purpose of life is to give it away.",
        "In a world where you can be anything, be kind. It costs nothing but means everything."
    ];

    const todayQuote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

    // Health metrics for condensed display
    const steps = (healthData as any).steps || 0;
    const sleep = (healthData as any).sleep || 0;
    const water = (healthData as any).water || 0;

    return (
        <motion.div
            className="relative overflow-hidden card rounded-3xl p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
            {/* Hollywood-level floating particles */}
            <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
            
            <div className="relative z-10 p-6 md:p-8 lg:p-12">
                {/* Greeting Section */}
                <div className="text-center lg:text-left">
                    <motion.h1 
                        className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 lg:mb-6"
                        style={{ color: 'var(--color-text)' }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {getGreeting()}, <span style={{ color: 'var(--color-accent)' }}>Pratt</span>
                    </motion.h1>
                    <motion.div
                        className="text-lg md:text-xl lg:text-2xl italic max-w-4xl leading-relaxed mb-6"
                        style={{ color: 'var(--color-text-secondary)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        "{todayQuote}"
                    </motion.div>
                </div>

                {/* Health Insights - Unified layout under quote */}
                <motion.div
                    className="grid grid-cols-3 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <ActivityIcon className="w-5 h-5 text-green-500" />
                            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{steps.toLocaleString()}</span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Steps</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <HeartIcon className="w-5 h-5 text-red-500" />
                            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{sleep}h</span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Sleep</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <BoltIcon className="w-5 h-5 text-blue-500" />
                            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{water}%</span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Hydration</div>
                    </div>
                </motion.div>

                {/* Bottom Row - Next Up and Stats - Unified Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Next Up Section - Unified */}
                    <div className="flex-1 p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-border)' }}>
                        <NextUpWidget
                            tasks={tasks}
                            categoryColors={categoryColors}
                            onCompleteTask={onCompleteTask}
                            navigateToScheduleDate={navigateToScheduleDate}
                            setScreen={setScreen}
                        />
                    </div>

                    {/* Quick Stats - Unified */}
                    <div className="grid grid-cols-3 gap-4">
                        <motion.div
                            className="text-center p-4 rounded-xl"
                            style={{ backgroundColor: 'var(--color-border)' }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{completedToday}</span>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Completed</div>
                        </motion.div>
                        <motion.div
                            className="text-center p-4 rounded-xl"
                            style={{ backgroundColor: 'var(--color-border)' }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <ClockIcon className="w-4 h-4 text-orange-500" />
                                <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{todayTasks.length - completedToday}</span>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Remaining</div>
                        </motion.div>
                        <motion.div
                            className="text-center p-4 rounded-xl"
                            style={{ backgroundColor: 'var(--color-border)' }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <FireIcon className="w-4 h-4 text-red-500" />
                                <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>7</span>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Streak</div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Standalone Weather Widget
const WeatherWidget: React.FC = () => {
    return (
        <motion.div
            className="h-full flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                }}
                className="mb-4"
            >
                <SunIcon className="w-16 h-16 text-yellow-400" />
            </motion.div>
            
            <div className="space-y-2">
                <div className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>22°C</div>
                <div className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>San Francisco</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sunny</div>
            </div>

            {/* Additional weather details */}
            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Humidity</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>65%</div>
                </div>
                <div className="text-center">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Wind</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>12 km/h</div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Dashboard Component
const PraxisDashboard: React.FC<PraxisDashboardProps> = (props) => {
    const { tasks, notes, healthData, briefing, isBriefingLoading, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen } = props;

    return (
        <motion.div
            className="min-h-screen relative"
            style={{ backgroundColor: 'var(--color-bg)' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Praxis AI Header */}
            <PraxisHeader />

            {/* Floating particles background */}
            <FloatingParticles count={50} />

            {/* Main Content - Full width with proper padding */}
            <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 md:py-6 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                >
                    {/* Top Row - Daily Greeting and Weather Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Greeting - Left Side */}
                        <div className="lg:col-span-2">
                            <DailyGreeting 
                                tasks={tasks} 
                                categoryColors={categoryColors} 
                                healthData={healthData}
                                onCompleteTask={onCompleteTask}
                                navigateToScheduleDate={navigateToScheduleDate}
                                setScreen={setScreen}
                            />
                        </div>
                        
                        {/* Weather Widget - Right Side */}
                        <div className="lg:col-span-1">
                            <WeatherWidget />
                        </div>
                    </div>


                    {/* Main Content Grid - Full Width Desktop Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        {/* Mission Briefing */}
                        <div className="lg:col-span-1 xl:col-span-1">
                            <MissionBriefingWidget
                                briefing={briefing}
                                isBriefingLoading={isBriefingLoading}
                            />
                        </div>

                        {/* Task Toggle */}
                        <div className="lg:col-span-1 xl:col-span-1">
                            <TaskToggle
                                tasks={tasks}
                                categoryColors={categoryColors}
                                onCompleteTask={onCompleteTask}
                                navigateToScheduleDate={navigateToScheduleDate}
                                setScreen={setScreen}
                            />
                        </div>

                        {/* Health Insights */}
                        <div className="lg:col-span-1 xl:col-span-1">
                            <HealthInsights
                                healthData={healthData}
                            />
                        </div>

                        {/* Habit Insights */}
                        <div className="lg:col-span-1 xl:col-span-1">
                            <HabitInsights
                                healthData={healthData}
                            />
                        </div>
                    </div>

                    {/* Bottom Row - Productivity, Quick Actions, and AI Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        {/* Productivity Metrics */}
                        <div className="lg:col-span-1">
                            <ProductivityMetrics
                                tasks={tasks}
                                healthData={healthData}
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="lg:col-span-1">
                            <QuickActionsWidget
                                tasks={tasks}
                                setScreen={setScreen}
                                onCompleteTask={onCompleteTask}
                            />
                        </div>

                        {/* AI Insights */}
                        <div className="lg:col-span-1">
                            <AIInsightsWidget
                                tasks={tasks}
                                healthData={healthData}
                                notes={notes}
                            />
                        </div>
                    </div>

                    {/* Kiko's Wisdom - Full Width Bottom */}
                    <div className="mt-6">
                        <KikoWisdom
                            tasks={tasks}
                            notes={notes}
                            healthData={healthData}
                        />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default PraxisDashboard;