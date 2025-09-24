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
            className="fixed top-4 left-20 z-30"
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




// Next Up Widget
const NextUpWidget: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
    canCompleteTasks: boolean;
}> = ({ tasks, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen, canCompleteTasks }) => {
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
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-3 mb-6">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ArrowRightIcon className="w-6 h-6 text-blue-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Next Up</h3>
            </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{nextTask.title}</h4>
                    <div className="flex items-center gap-4 text-sm opacity-80" style={{ color: 'var(--color-text)' }}>
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
                                    style={{ backgroundColor: categoryColors[nextTask.category] || '#6B7280' }}
                                />
                                <span className="capitalize">{nextTask.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {canCompleteTasks ? (
                    <motion.button
                        onClick={() => onCompleteTask(nextTask.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors"
                    style={{ 
                        backgroundColor: '#374151',
                        color: 'white'
                    }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        Complete
                    </motion.button>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl opacity-50 cursor-not-allowed"
                        style={{ 
                            backgroundColor: '#374151',
                            color: 'white'
                        }}>
                            <ClockIcon className="w-4 h-4" />
                            Focus Mode Active
                        </div>
                    )}
                    <motion.button
                        onClick={() => {
                            navigateToScheduleDate(new Date(nextTask.startTime));
                            setScreen('Schedule');
                        }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors"
                    style={{ 
                        backgroundColor: '#1f2937',
                        color: 'white'
                    }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                        View Details
                    </motion.button>
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
    canCompleteTasks: boolean;
}> = ({ tasks, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen, canCompleteTasks }) => {
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
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ 
                backgroundColor: currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981',
                color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981')
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            
            {/* Pill Toggle */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <CalendarDaysIcon className="w-6 h-6 text-green-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold font-display" style={{ color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981') }}>Tasks</h3>
                </div>
                
                <div className="flex rounded-full p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <motion.button
                        onClick={() => setActiveView('today')}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                        style={{ 
                            color: activeView === 'today' ? getTextColorForBackground('#10b981') : 'var(--color-text-secondary)',
                            backgroundColor: activeView === 'today' ? '#10b981' : 'transparent'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Today
                    </motion.button>
                    <motion.button
                        onClick={() => setActiveView('tomorrow')}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                        style={{ 
                            color: activeView === 'tomorrow' ? getTextColorForBackground('#8b5cf6') : 'var(--color-text-secondary)',
                            backgroundColor: activeView === 'tomorrow' ? '#8b5cf6' : 'transparent'
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
                                    className="flex items-center justify-between p-4 rounded-xl transition-all duration-300"
                                    style={{ 
                                        backgroundColor: categoryColors[task.category] || '#6B7280',
                                        color: getTextColorForBackground(categoryColors[task.category] || '#6B7280')
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ 
                                        scale: 1.02 
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: categoryColors[task.category] || '#6B7280' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold block truncate" style={{ color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981') }}>{task.title}</span>
                                            <span className="text-sm opacity-80" style={{ color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981') }}>
                                                {new Date(task.startTime).toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={() => canCompleteTasks && onCompleteTask(task.id)}
                                            className={`p-2 rounded-full transition-colors ${
                                                canCompleteTasks ? '' : 'opacity-50 cursor-not-allowed'
                                            }`}
                                            style={{ 
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                color: getTextColorForBackground(categoryColors[task.category] || '#6B7280')
                                            }}
                                            whileHover={canCompleteTasks ? { 
                                                scale: 1.1,
                                                backgroundColor: 'rgba(0,0,0,0.3)'
                                            } : {}}
                                            whileTap={canCompleteTasks ? { scale: 0.9 } : {}}
                                            disabled={!canCompleteTasks}
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => {
                                                navigateToScheduleDate(currentDate);
                                                setScreen('Schedule');
                                            }}
                                            className="p-2 rounded-full transition-colors"
                                            style={{ 
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                color: getTextColorForBackground(categoryColors[task.category] || '#6B7280')
                                            }}
                                            whileHover={{ 
                                                scale: 1.1,
                                                backgroundColor: 'rgba(0,0,0,0.3)'
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm" style={{ color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981') + '99' }}>
                                    No tasks scheduled for {activeView === 'today' ? 'today' : 'tomorrow'}
                                </p>
                            </div>
                        )}
                        
                        {currentTasks.length > 4 && (
                            <div className="text-center pt-2">
                                <p className="text-xs" style={{ color: getTextColorForBackground(currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981') + '99' }}>+{currentTasks.length - 4} more tasks</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// Enhanced Health Insights with Integrated Metrics
const HealthInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const energyLevel = healthData.energyLevel || 'medium';
    const sleepHours = healthData.avgSleepHours || 0;
    const steps = (healthData as any).steps || 0;

    const getStressLevel = () => {
        if (sleepHours >= 8 && energyLevel === 'high') return { level: 'Low', color: '#10b981', score: 90 };
        if (sleepHours >= 6 && energyLevel === 'medium') return { level: 'Medium', color: '#f59e0b', score: 60 };
        return { level: 'High', color: '#ef4444', score: 30 };
    };

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

    const getActivityColor = (count: number) => {
        if (count >= 10000) return '#10b981';
        if (count >= 5000) return '#f59e0b';
        return '#ef4444';
    };

    const stressData = getStressLevel();

    const healthMetrics = [
        {
            name: 'Energy',
            value: energyLevel.charAt(0).toUpperCase() + energyLevel.slice(1),
            color: getEnergyColor(energyLevel),
            icon: ZapIcon,
            progress: energyLevel === 'high' ? 90 : energyLevel === 'medium' ? 60 : 30,
            caption: 'Focus'
        },
        {
            name: 'Sleep',
            value: `${sleepHours}h`,
            color: getSleepColor(sleepHours),
            icon: ClockIcon,
            progress: Math.min((sleepHours / 8) * 100, 100),
            caption: 'Recovery'
        },
        {
            name: 'Activity',
            value: steps >= 1000 ? `${Math.round(steps/1000)}k` : steps.toString(),
            color: getActivityColor(steps),
            icon: ActivityIcon,
            progress: Math.min((steps / 10000) * 100, 100),
            caption: 'Movement'
        },
        {
            name: 'Stress',
            value: stressData.level,
            color: stressData.color,
            icon: HeartIcon,
            progress: stressData.score,
            caption: 'Balance'
        }
    ];

    return (
        <motion.div
            className="rounded-2xl p-3 sm:p-4 relative overflow-hidden h-full"
            style={{ 
                background: 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #4B5563 100%)',
                color: 'white'
            }}
            variants={itemVariants}
        >
            {/* Animated gradient blobs background */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute -top-10 -left-10 w-40 h-40 rounded-full"
                    style={{ background: 'radial-gradient(circle at 30% 30%, #34d39955, transparent 60%)' }}
                    animate={{ x: [0, 10, -10, 0], y: [0, -8, 6, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-44 h-44 rounded-full"
                    style={{ background: 'radial-gradient(circle at 70% 70%, #60a5fa40, transparent 60%)' }}
                    animate={{ x: [0, -12, 8, 0], y: [0, 10, -6, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full"
                    style={{ background: 'radial-gradient(circle, #f59e0b33, transparent 70%)' }}
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Compact grid, no explicit title */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 relative z-10">
                {healthMetrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <motion.div 
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden backdrop-blur-sm"
                            style={{ 
                                background: `linear-gradient(135deg, ${metric.color}20 0%, ${metric.color}10 50%, rgba(255,255,255,0.08) 100%)`,
                                boxShadow: `0 8px 24px ${metric.color}30, inset 0 1px 0 rgba(255,255,255,0.18)`
                            }}
                            whileHover={{ rotate: 6, scale: 1.04 }}
                        >
                            <div className="relative z-10">
                                <metric.icon 
                                    className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg" 
                                    style={{ 
                                        color: metric.color,
                                        filter: `drop-shadow(0 0 8px ${metric.color}60)`
                                    }}
                                />
                            </div>
                            <svg className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
                                <motion.circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke={metric.color}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 4px ${metric.color}80)` }}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: metric.progress / 100 }}
                                    transition={{ duration: 2, delay: index * 0.3 }}
                                />
                            </svg>
                            <div 
                                className="absolute inset-2 rounded-2xl opacity-20"
                                style={{ background: `radial-gradient(circle, ${metric.color}40 0%, transparent 70%)` }}
                            />
                        </motion.div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] sm:text-xs font-semibold text-white/90">{metric.name}</p>
                            <p className="text-base sm:text-lg font-bold" style={{ color: metric.color }}>{metric.value}</p>
                            <p className="text-[10px] sm:text-[11px] text-white/70 leading-tight">{metric.caption}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// Interactive Habit Widget inspired by Schedule.tsx
const HabitInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const [habits, setHabits] = useState([
        { id: 1, name: 'Morning Routine', streak: 7, color: '#10b981', icon: SunIcon, frequency: 'daily', selected: false },
        { id: 2, name: 'Exercise', streak: 5, color: '#3b82f6', icon: ActivityIcon, frequency: 'daily', selected: false },
        { id: 3, name: 'Meditation', streak: 3, color: '#f59e0b', icon: BrainCircuitIcon, frequency: 'daily', selected: false },
        { id: 4, name: 'Reading', streak: 12, color: '#8b5cf6', icon: DocumentTextIcon, frequency: 'daily', selected: false }
    ]);
    
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [selectedView, setSelectedView] = useState<'7day' | '30day'>('7day');

    const firstHabit = habits.find(h => h.selected) || habits[0];
    const bgColor = firstHabit ? firstHabit.color : '#6366F1';
    const textColor = getTextColorForBackground(bgColor);

    const handleAddHabit = () => {
        if (newHabitName.trim()) {
            const newHabit = {
                id: Date.now(),
                name: newHabitName.trim(),
                streak: 0,
                color: '#8b5cf6',
                icon: FlagIcon,
                frequency: 'daily',
                selected: false
            };
            setHabits([...habits, newHabit]);
            setNewHabitName('');
            setIsAddingHabit(false);
        }
    };

    const handleSelectHabit = (habitId: number) => {
        setHabits(habits.map(h => ({ ...h, selected: h.id === habitId })));
    };

    const handleEditHabit = (habitId: number, newName: string) => {
        setHabits(habits.map(h => h.id === habitId ? { ...h, name: newName } : h));
    };

    const handleFrequencyChange = (habitId: number, frequency: string) => {
        setHabits(habits.map(h => h.id === habitId ? { ...h, frequency } : h));
    };

    const generateDots = (days: number) => {
        return Array.from({ length: days }, (_, i) => ({
            day: i + 1,
            completed: Math.random() > 0.3 // Random completion for demo
        }));
    };

    const dots = selectedView === '7day' ? generateDots(7) : generateDots(30);

    return (
        <motion.div
            className="rounded-2xl p-6 relative overflow-hidden h-full"
            style={{ 
                backgroundColor: bgColor,
                color: textColor
            }}
            variants={itemVariants}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                        <FlagIcon className="w-6 h-6" style={{ color: textColor }} />
                </motion.div>
                    <h3 className="text-2xl font-bold font-display">Habits</h3>
                </div>
                <motion.button
                    onClick={() => setIsAddingHabit(true)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <PlusIcon className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Add Habit Form */}
            {isAddingHabit && (
                <motion.div
                    className="mb-4 p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="Enter habit name..."
                        className="w-full p-2 rounded-lg bg-white/20 text-white placeholder-white/60 border-none outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <motion.button
                            onClick={handleAddHabit}
                            className="px-3 py-1 bg-white/20 text-white text-sm rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Add
                        </motion.button>
                        <motion.button
                            onClick={() => setIsAddingHabit(false)}
                            className="px-3 py-1 bg-white/10 text-white text-sm rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Habit List */}
            <div className="space-y-3 relative z-10 mb-4">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                            habit.selected ? 'ring-2 ring-white/30' : ''
                        }`}
                        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelectHabit(habit.id)}
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 10 }}
                            >
                                <habit.icon className="w-5 h-5" style={{ color: textColor }} />
                            </motion.div>
                            <div>
                                <span className="font-semibold" style={{ color: textColor }}>{habit.name}</span>
                                <div className="text-xs opacity-80" style={{ color: textColor }}>
                                    {habit.frequency} • {habit.streak} days
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: textColor }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Selected Habit Details */}
            {firstHabit && (
                <motion.div
                    className="relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {/* View Toggle */}
                    <div className="flex gap-2 mb-4">
                        <motion.button
                            onClick={() => setSelectedView('7day')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                selectedView === '7day' ? 'bg-white/20' : 'bg-white/10'
                            }`}
                            style={{ color: textColor }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            7 Days
                        </motion.button>
                        <motion.button
                            onClick={() => setSelectedView('30day')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                selectedView === '30day' ? 'bg-white/20' : 'bg-white/10'
                            }`}
                            style={{ color: textColor }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            30 Days
                        </motion.button>
                    </div>

                    {/* Dots View */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {dots.map((dot, index) => (
                            <motion.div
                                key={index}
                                className={`w-3 h-3 rounded-full ${
                                    dot.completed ? 'bg-white' : 'bg-white/20'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.02 }}
                                whileHover={{ scale: 1.2 }}
                            />
                        ))}
                    </div>

                    {/* Habit Stats */}
                    <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: textColor }}>
                            {firstHabit.streak} day streak
                        </div>
                        <div className="text-sm opacity-80" style={{ color: textColor }}>
                            {Math.round((dots.filter(d => d.completed).length / dots.length) * 100)}% completion
                        </div>
            </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// Mission Briefing Widget - Integrated with Smart Insights and Key Takeaways
const MissionBriefingWidget: React.FC<{
    briefing: MissionBriefing;
    isBriefingLoading: boolean;
    tasks: Task[];
    healthData: HealthData;
    notes: Note[];
}> = ({ briefing, isBriefingLoading, tasks, healthData, notes }) => {
    const today = new Date();
    const currentHour = today.getHours();
    
    // Calculate energy patterns based on task completion times
    const getEnergyPattern = () => {
        const completedTasks = tasks.filter(t => t.status === 'Completed');
        if (completedTasks.length === 0) return { peak: '9-11 AM', level: 'medium' };
        
        const completionHours = completedTasks.map(t => new Date(t.startTime).getHours());
        const hourCounts = completionHours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        const peakHour = parseInt(Object.entries(hourCounts).reduce((a, b) => hourCounts[a[0]] > hourCounts[b[0]] ? a : b)[0]);
        
        if (peakHour >= 6 && peakHour <= 11) return { peak: '6-11 AM', level: 'high' };
        if (peakHour >= 12 && peakHour <= 17) return { peak: '12-5 PM', level: 'medium' };
        return { peak: '6-11 PM', level: 'low' };
    };

    // Calculate focus session recommendations
    const getFocusRecommendation = () => {
        const avgTaskDuration = tasks.reduce((sum, t) => sum + t.plannedDuration, 0) / tasks.length || 25;
        if (avgTaskDuration <= 30) return { duration: '25 min', type: 'Pomodoro' };
        if (avgTaskDuration <= 60) return { duration: '45 min', type: 'Deep Work' };
        return { duration: '90 min', type: 'Creative Flow' };
    };

    // Calculate context switching patterns
    const getContextSwitchingInsight = () => {
        const todayTasks = tasks.filter(t => 
            new Date(t.startTime).toDateString() === today.toDateString()
        );
        const categories = new Set(todayTasks.map(t => t.category));
        const switchCount = categories.size;
        
        if (switchCount <= 2) return { level: 'Low', advice: 'Great focus!' };
        if (switchCount <= 4) return { level: 'Medium', advice: 'Consider batching' };
        return { level: 'High', advice: 'Reduce context switching' };
    };

    // Calculate deadline intelligence
    const getDeadlineIntelligence = () => {
        const upcomingTasks = tasks.filter(t => {
            const taskDate = new Date(t.startTime);
            const daysDiff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff <= 3;
        });
        
        if (upcomingTasks.length === 0) return { status: 'Clear', message: 'No urgent deadlines' };
        if (upcomingTasks.length <= 2) return { status: 'Manageable', message: `${upcomingTasks.length} tasks this week` };
        return { status: 'Busy', message: `${upcomingTasks.length} tasks need attention` };
    };

    // Calculate creative flow timing
    const getCreativeFlowTiming = () => {
        const energyLevel = healthData.energyLevel || 'medium';
        const currentHour = today.getHours();
        
        if (energyLevel === 'high' && currentHour >= 9 && currentHour <= 11) {
            return { timing: 'Perfect', message: 'Ideal for creative work' };
        }
        if (energyLevel === 'medium' && currentHour >= 14 && currentHour <= 16) {
            return { timing: 'Good', message: 'Second wind available' };
        }
        return { timing: 'Plan ahead', message: 'Schedule creative blocks' };
    };

    // Generate Key Takeaways based on user behavior
    const getKeyTakeaways = () => {
        const completedToday = tasks.filter(t => 
            new Date(t.startTime).toDateString() === today.toDateString() && 
            t.status === 'Completed'
        ).length;
        
        const totalToday = tasks.filter(t => 
            new Date(t.startTime).toDateString() === today.toDateString()
        ).length;
        
        const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
        
        const takeaways = [];
        
        if (completionRate >= 80) {
            takeaways.push({
                type: 'monetizable',
                title: 'Peak Performance Day',
                description: 'You\'re operating at peak efficiency. Consider taking on high-value projects or client work.',
                action: 'Schedule your most important tasks for tomorrow morning.',
            color: '#10b981'
            });
        }
        
        if (healthData.energyLevel === 'high') {
            takeaways.push({
                type: 'actionable',
            title: 'Energy Optimization',
                description: 'Your energy levels are optimal. Perfect time for creative work or strategic planning.',
                action: 'Use this energy for brainstorming or complex problem-solving.',
                color: '#f59e0b'
            });
        }
        
        if (tasks.length > 0) {
            const avgDuration = tasks.reduce((sum, t) => sum + t.plannedDuration, 0) / tasks.length;
            if (avgDuration > 60) {
                takeaways.push({
                    type: 'behavioral',
                    title: 'Deep Work Preference',
                    description: 'You prefer longer, focused sessions. This suggests you work best with minimal interruptions.',
                    action: 'Block 2-3 hour windows for your most important work.',
                    color: '#8b5cf6'
                });
            }
        }
        
        return takeaways;
    };

    const energyPattern = getEnergyPattern();
    const focusRec = getFocusRecommendation();
    const contextInsight = getContextSwitchingInsight();
    const deadlineIntel = getDeadlineIntelligence();
    const creativeTiming = getCreativeFlowTiming();
    const keyTakeaways = getKeyTakeaways();

    const smartInsights = [
        {
            type: 'energy',
            title: 'Peak Energy Time',
            description: `Your most productive hours are ${energyPattern.peak}. Schedule important tasks during this window.`,
            icon: ZapIcon,
            color: '#10b981',
            actionable: true
        },
        {
            type: 'focus',
            title: 'Focus Sessions',
            description: `Try ${focusRec.duration} ${focusRec.type} sessions for optimal productivity.`,
            icon: BrainCircuitIcon,
            color: '#8b5cf6',
            actionable: true
        },
        {
            type: 'context',
            title: 'Context Switching',
            description: `${contextInsight.level} switching today. ${contextInsight.advice}.`,
            icon: ArrowTrendingUpIcon,
            color: '#f59e0b',
            actionable: true
        },
        {
            type: 'deadlines',
            title: 'Deadline Intelligence',
            description: `${deadlineIntel.status}: ${deadlineIntel.message}`,
            icon: CalendarIcon,
            color: '#ef4444',
            actionable: false
        },
        {
            type: 'creative',
            title: 'Creative Flow',
            description: `${creativeTiming.timing}: ${creativeTiming.message}`,
            icon: SparklesIcon,
            color: '#06b6d4',
            actionable: true
        }
    ];

    if (isBriefingLoading) {
        return (
            <motion.div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ 
                    backgroundColor: '#1F2937',
                    color: 'white'
                }}
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
                    <h3 className="text-lg font-semibold" style={{ color: 'white' }}>Mission Briefing</h3>
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
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ 
                backgroundColor: '#1F2937',
                color: 'white'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <BrainCircuitIcon className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display" style={{ color: 'white' }}>Mission Briefing</h3>
            </div>

            {/* Smart Insights Section */}
            <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4" style={{ color: 'white' }}>Smart Insights</h4>
                <div className="space-y-3">
                    {smartInsights.slice(0, 3).map((insight, index) => (
                    <motion.div
                        key={insight.type}
                        className="rounded-xl p-4 transition-all duration-300"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: insight.color + '20' }}>
                                    <insight.icon className="w-4 h-4" style={{ color: insight.color }} />
                </div>
                            <div className="flex-1">
                                    <h5 className="text-white font-semibold text-sm mb-1">{insight.title}</h5>
                                    <p className="text-white/70 text-xs leading-relaxed">{insight.description}</p>
                </div>
                </div>
                    </motion.div>
                ))}
                </div>
            </div>

            {/* Key Takeaways Section */}
            {keyTakeaways.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: 'white' }}>Key Takeaways</h4>
                    <div className="space-y-3">
                        {keyTakeaways.map((takeaway, index) => (
                            <motion.div
                                key={takeaway.type}
                                className="rounded-xl p-4 transition-all duration-300"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (index + 3) * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: takeaway.color + '20' }}>
                                        {takeaway.type === 'monetizable' && <StarIcon className="w-4 h-4" style={{ color: takeaway.color }} />}
                                        {takeaway.type === 'actionable' && <ArrowTrendingUpIcon className="w-4 h-4" style={{ color: takeaway.color }} />}
                                        {takeaway.type === 'behavioral' && <BrainCircuitIcon className="w-4 h-4" style={{ color: takeaway.color }} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="text-white font-semibold text-sm">{takeaway.title}</h5>
                                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: takeaway.color + '20', color: takeaway.color }}>
                                                {takeaway.type}
                                            </span>
                                        </div>
                                        <p className="text-white/70 text-xs leading-relaxed mb-2">{takeaway.description}</p>
                                        <p className="text-white/90 text-xs font-medium italic">💡 {takeaway.action}</p>
                                    </div>
            </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Enhanced Focus Timer Widget with Surface Tension-Inspired Visuals
const FocusTimerWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
    onStartFocusMode: () => void;
}> = ({ tasks, healthData, onStartFocusMode }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
    const [sessionType, setSessionType] = useState<'focus' | 'break' | 'longBreak'>('focus');
    const [completedSessions, setCompletedSessions] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const sessionTypes = {
        focus: { 
            duration: 25 * 60, 
            colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'], 
            label: 'Focus' 
        },
        break: { 
            duration: 5 * 60, 
            colors: ['#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'], 
            label: 'Break' 
        },
        longBreak: { 
            duration: 15 * 60, 
            colors: ['#a8e6cf', '#ffd3a5', '#fd9853', '#a8e6cf'], 
            label: 'Long Break' 
        }
    };

    const currentSession = sessionTypes[sessionType];
    const progress = ((currentSession.duration - timeLeft) / currentSession.duration) * 100;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Session completed
            setIsRunning(false);
            if (sessionType === 'focus') {
                setCompletedSessions(prev => prev + 1);
                if (completedSessions + 1 % 4 === 0) {
                    setSessionType('longBreak');
                } else {
                    setSessionType('break');
                }
            } else {
                setSessionType('focus');
            }
            setTimeLeft(sessionTypes[sessionType === 'focus' ? 'break' : 'focus'].duration);
        }
        return () => clearInterval(interval);
    }, [isRunning, isPaused, timeLeft, sessionType, completedSessions]);

    const startTimer = () => {
        setIsRunning(true);
        setIsPaused(false);
        onStartFocusMode();
    };

    const pauseTimer = () => {
        setIsPaused(!isPaused);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setIsPaused(false);
        setTimeLeft(currentSession.duration);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getMotivationalMessage = () => {
        if (sessionType === 'focus') {
            if (completedSessions === 0) return "Ready to focus? Let's start your first session!";
            if (completedSessions < 4) return `Great work! ${completedSessions} sessions completed.`;
            return "You're on fire! Keep the momentum going!";
        }
        if (sessionType === 'break') return "Time to recharge! Take a well-deserved break.";
        return "Extended break time! Rest and rejuvenate.";
    };

    return (
        <motion.div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ 
                background: `linear-gradient(135deg, ${currentSession.colors[0]} 0%, ${currentSession.colors[1]} 25%, ${currentSession.colors[2]} 50%, ${currentSession.colors[3]} 100%)`,
                color: 'white'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Surface Tension-inspired flowing animations */}
            <div className="absolute inset-0">
                {[...Array(25)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full opacity-40"
                        style={{
                            width: `${15 + Math.random() * 35}px`,
                            height: `${15 + Math.random() * 35}px`,
                            background: `radial-gradient(circle, ${currentSession.colors[i % currentSession.colors.length]}80, transparent)`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 80 - 40, 0],
                            y: [0, Math.random() * 80 - 40, 0],
                            scale: [1, 1.8 + Math.random(), 1],
                            rotate: [0, 360, 0],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 6,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: "easeInOut"
                        }}
                    />
                ))}
                
                {/* Flowing gradient orbs like paint in water */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={`orb-${i}`}
                        className="absolute rounded-full blur-sm"
                        style={{
                            width: `${50 + i * 8}px`,
                            height: `${50 + i * 8}px`,
                            background: `radial-gradient(circle, ${currentSession.colors[i % currentSession.colors.length]}50, transparent)`,
                            left: `${8 + i * 8}%`,
                            top: `${15 + i * 7}%`,
                        }}
                        animate={{
                            x: [0, 25, -15, 0],
                            y: [0, -15, 25, 0],
                            scale: [1, 1.3, 0.7, 1],
                        }}
                        transition={{
                            duration: 7 + i * 0.4,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                    <motion.div
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 8, 
                                repeat: Infinity, 
                                ease: 'linear' 
                            }}
                        >
                            <ClockIcon className="w-6 h-6 text-white drop-shadow-lg" />
                        </motion.div>
                        <h3 className="text-2xl font-bold font-display text-white drop-shadow-lg">Focus Timer</h3>
                            </div>
                    <div className="text-right">
                        <div className="text-sm opacity-80 text-white">Sessions Completed</div>
                        <div className="text-2xl font-bold text-white drop-shadow-lg">{completedSessions}</div>
                        </div>
                </div>

                {/* Enhanced Timer Display */}
                <div className="text-center mb-6">
                    <div className="relative w-48 h-48 mx-auto mb-4">
                        {/* Animated background circle */}
                            <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(from 0deg, ${currentSession.colors[0]}, ${currentSession.colors[1]}, ${currentSession.colors[2]}, ${currentSession.colors[3]}, ${currentSession.colors[0]})`,
                                opacity: 0.3
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                        
                        {/* Progress Circle */}
                        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="8"
                                fill="none"
                            />
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="white"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                                transition={{ duration: 0.5 }}
                                style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
                            />
                        </svg>
                        
                        {/* Timer Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <motion.div 
                                className="text-4xl font-bold font-mono text-white drop-shadow-lg"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {formatTime(timeLeft)}
                    </motion.div>
                            <div className="text-sm opacity-90 mt-1 text-white drop-shadow-lg">{currentSession.label}</div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Controls */}
                <div className="flex justify-center gap-4 mb-4">
                    <motion.button
                        onClick={isRunning ? pauseTimer : startTimer}
                        className="px-8 py-4 rounded-full font-semibold transition-all duration-300 text-white"
                        style={{ 
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                        whileHover={{ 
                            scale: 1.05,
                            background: 'rgba(255,255,255,0.35)'
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Start Focus'}
                    </motion.button>
                    <motion.button
                        onClick={resetTimer}
                        className="px-6 py-4 rounded-full font-semibold transition-all duration-300 text-white"
                        style={{ 
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                        whileHover={{ 
                            scale: 1.05,
                            background: 'rgba(255,255,255,0.25)'
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Reset
                    </motion.button>
                </div>

                {/* Motivational Message */}
                <div className="text-center">
                    <motion.p 
                        className="text-sm opacity-90 italic text-white drop-shadow-lg"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        {getMotivationalMessage()}
                    </motion.p>
                </div>
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
            className="rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ZapIcon className="w-6 h-6 text-orange-400" />
                </motion.div>
                <h3 className="text-2xl font-bold font-display text-black">Quick Actions</h3>
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
                        <span className="text-black text-sm font-medium">{action.label}</span>
                    </motion.button>
                ))}
            </div>

            {nextTask && (
                <motion.div
                    className="mt-4 p-3 rounded-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-black text-sm font-medium">Next Task</p>
                            <p className="text-black/80 text-xs truncate">{nextTask.title}</p>
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


// Hollywood-Level Daily Greeting with Integrated Weather and Health
const DailyGreeting: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    healthData: HealthData;
    briefing: MissionBriefing;
    isBriefingLoading: boolean;
    notes: Note[];
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    setScreen: (screen: Screen) => void;
    canCompleteTasks: boolean;
}> = ({ tasks, categoryColors, healthData, briefing, isBriefingLoading, notes, onCompleteTask, navigateToScheduleDate, setScreen, canCompleteTasks }) => {
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
            className="relative overflow-hidden rounded-3xl p-8"
            style={{ 
                backgroundColor: '#A855F7',
                color: 'white'
            }}
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
                {/* Greeting Section with Weather */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="text-center lg:text-left flex-1">
                    <motion.h1 
                            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2 lg:mb-4 leading-tight"
                        style={{ color: 'var(--color-text)' }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {getGreeting()}, <span style={{ color: 'var(--color-accent)' }}>Pratt</span>
                    </motion.h1>
                    <motion.div
                            className="text-sm md:text-base lg:text-lg italic max-w-3xl leading-relaxed mb-34 text-center mx-auto"
                            style={{ color: '#1F2937', opacity: 0.8 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        "{todayQuote}"
                    </motion.div>
                </div>

                    {/* Weather Section */}
                    <div className="flex-shrink-0">
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
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
                            >
                                <SunIcon className="w-8 h-8 text-yellow-400" />
                            </motion.div>
                            <div>
                                <div className="text-2xl font-bold text-white">22°C</div>
                                <div className="text-sm text-white/80">San Francisco</div>
                                <div className="text-xs text-white/60">Sunny</div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Spacer to move Next Up section down */}
                <div className="h-12"></div>

                {/* Next Up Section or Mission Briefing - Full Width */}
                {completedToday === todayTasks.length && todayTasks.length > 0 ? (
                    <div className="rounded-2xl p-6" style={{ backgroundColor: '#1F2937', color: 'white' }}>
                        <MissionBriefingWidget
                            briefing={briefing}
                            isBriefingLoading={isBriefingLoading}
                            tasks={tasks}
                            healthData={healthData}
                            notes={notes}
                        />
                    </div>
                ) : (
                <div className="rounded-2xl p-6" style={{ backgroundColor: '#F59E0B', color: 'white' }}>
                        <NextUpWidget
                            tasks={tasks}
                            categoryColors={categoryColors}
                            onCompleteTask={onCompleteTask}
                            navigateToScheduleDate={navigateToScheduleDate}
                            setScreen={setScreen}
                            canCompleteTasks={canCompleteTasks}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Enhanced Gamified Praxis Rewards Widget with 3D Penguin
const PraxisRewardsWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
}> = ({ tasks, healthData }) => {
    const [currentPoints, setCurrentPoints] = useState(0);
    const [level, setLevel] = useState(1);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);

    // Calculate points and level based on tasks and health data
    useEffect(() => {
        const calculatePoints = () => {
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            // Health multiplier based on energy level
            const energyLevel = healthData.energyLevel || 'medium';
            const energyMultiplier = energyLevel === 'high' ? 1.5 : energyLevel === 'medium' ? 1.2 : 1.0;
            
            // Calculate points
            const basePoints = completedTasks * 50;
            const completionBonus = completionRate * 2;
            const energyBonus = basePoints * (energyMultiplier - 1);
            const totalPoints = Math.round(basePoints + completionBonus + energyBonus);
            
            // Calculate level (every 500 points = 1 level)
            const newLevel = Math.floor(totalPoints / 500) + 1;
            
            setCurrentPoints(totalPoints);
            setLevel(newLevel);
        };

        calculatePoints();
    }, [tasks, healthData]);

    const nextLevelPoints = level * 500;
    const progressToNext = ((currentPoints % 500) / 500) * 100;

    const getMotivationMessage = () => {
        if (progressToNext > 80) {
            return "Almost there! Keep going!";
        } else if (progressToNext > 50) {
            return "Great progress! You're on fire!";
        } else {
            return "Every point counts! Stay consistent!";
        }
    };

    const tooltips = {
        level: "Your current achievement level. Level up by earning 500 points!",
        points: "Points earned from completing tasks, maintaining streaks, and staying healthy.",
        progress: "Progress toward your next level. Complete more tasks to advance!"
    };

    return (
                        <motion.div
            className="rounded-2xl p-4 relative overflow-hidden h-full"
            style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                color: 'white'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Holographic animated background elements */}
            <div className="absolute inset-0">
                {[...Array(15)].map((_, i) => (
                <motion.div
                        key={i}
                        className="absolute rounded-full opacity-30"
                        style={{
                            width: `${20 + Math.random() * 30}px`,
                            height: `${20 + Math.random() * 30}px`,
                            background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 50 - 25, 0],
                            y: [0, Math.random() * 50 - 25, 0],
                            scale: [1, 1.5 + Math.random(), 1],
                            rotate: [0, 360, 0],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
                
                {/* Holographic shimmer effect */}
                <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                    }}
                    animate={{
                        x: ['-100%', '100%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />
                            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <SparklesIcon className="w-5 h-5 text-yellow-400" />
                        </motion.div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">Praxis Rewards</h3>
                        <motion.div
                                className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center cursor-help"
                                onMouseEnter={() => setShowTooltip('rewards')}
                                onMouseLeave={() => setShowTooltip(null)}
                            >
                                <span className="text-xs">?</span>
                        </motion.div>
            </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-white/60">Level {level}</div>
                        <div className="text-sm font-bold text-yellow-400">{currentPoints}</div>
                    </div>
                </div>
                
                {showTooltip === 'rewards' && (
        <motion.div
                        className="absolute top-12 left-4 right-4 px-4 py-3 bg-black/90 text-white text-sm rounded-lg z-20"
                        initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                    >
                        <p className="leading-relaxed">
                            Praxis Rewards gamify your productivity journey! Earn points by completing tasks, 
                            maintaining streaks, and staying healthy. Level up every 500 points to unlock new achievements.
                        </p>
                    </motion.div>
                )}

                {/* Cute Baby Penguin with Blinking Eyes */}
                <div className="flex justify-center mb-4">
            <motion.div
                        className="relative w-16 h-16"
                animate={{ 
                            y: [0, -1, 0],
                            scale: [1, 1.01, 1]
                }}
                transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                }}
                    >
                        {/* Baby Penguin Body - More rounded and cute */}
                        <div 
                            className="absolute inset-0 rounded-full"
                            style={{ 
                                background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
                                boxShadow: `
                                    inset 0 3px 6px rgba(255,255,255,0.15),
                                    inset 0 -3px 6px rgba(0,0,0,0.4),
                                    0 6px 16px rgba(0,0,0,0.5),
                                    0 0 0 2px rgba(255,255,255,0.1)
                                `,
                                transform: 'perspective(100px) rotateX(10deg) rotateY(-3deg)'
                            }}
                        >
                            {/* Baby Penguin Belly - Larger and more prominent */}
                            <div 
                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-7 rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            
                            {/* Baby Penguin Eyes - Larger and more expressive */}
                            <motion.div 
                                className="absolute top-1.5 left-2.5 w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, #ffffff 40%, #e2e8f0 80%)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                }}
                                animate={{
                                    scaleY: [1, 0.1, 1],
                                }}
                                transition={{
                                    duration: 0.15,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    ease: "easeInOut"
                                }}
                            />
                            <motion.div 
                                className="absolute top-1.5 right-2.5 w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, #ffffff 40%, #e2e8f0 80%)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                }}
                                animate={{
                                    scaleY: [1, 0.1, 1],
                                }}
                                transition={{
                                    duration: 0.15,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    ease: "easeInOut"
                                }}
                            />
                            
                            {/* Eye pupils - Larger and more adorable */}
                            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-black rounded-full"></div>
                            <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-black rounded-full"></div>
                            
                            {/* Baby Penguin Beak - Smaller and cuter */}
                            <div 
                                className="absolute top-3 left-1/2 transform -translate-x-1/2 w-1 h-0.5 rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}
                            />
                            
                            {/* Cheek blush - More prominent for baby cuteness */}
                            <div 
                                className="absolute top-3.5 left-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                                style={{ background: '#fbb6ce' }}
                            />
                            <div 
                                className="absolute top-3.5 right-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                                style={{ background: '#fbb6ce' }}
                            />
                        </div>
                        
                        {/* Gentle floating sparkles */}
                        {[...Array(2)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                                style={{
                                    left: `${25 + i * 50}%`,
                                    top: `${15 + i * 25}%`,
                                }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    scale: [0.5, 1, 0.5],
                                    y: [0, -8, 0]
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    delay: i * 1.5,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                        
                        {/* Progress Ring around Penguin */}
                        <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="rgba(255,255,255,0.15)"
                                strokeWidth="2"
                                fill="none"
                            />
                            <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="#fbbf24"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                style={{ 
                                    filter: `drop-shadow(0 0 4px #fbbf2480)`
                                }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: progressToNext / 100 }}
                                transition={{ duration: 2, delay: 0.3 }}
                            />
                        </svg>
            </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/80">Progress</span>
                        <span className="text-xs font-semibold text-yellow-400">{Math.round(progressToNext)}%</span>
                </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Motivation Message */}
                <div className="text-center">
                    <div className="text-xs text-white/70 mb-2">
                        {getMotivationMessage()}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
                    <div className="text-center">
                        <div className="text-white font-bold text-sm">{level}</div>
                        <div className="text-white/60 text-xs">Level</div>
                    </div>
                    <div className="text-center">
                        <div className="text-white font-bold text-sm">{currentPoints}</div>
                        <div className="text-white/60 text-xs">Points</div>
                    </div>
                    <div className="text-center">
                        <div className="text-white font-bold text-sm">{Math.round(progressToNext)}%</div>
                        <div className="text-white/60 text-xs">Progress</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


// Main Dashboard Component
const PraxisDashboard: React.FC<PraxisDashboardProps> = (props) => {
    const { tasks, notes, healthData, briefing, isBriefingLoading, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen } = props;
    
    // Focus mode state
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [focusStartTime, setFocusStartTime] = useState<Date | null>(null);
    const [canCompleteTasks, setCanCompleteTasks] = useState(true);
    
    // Check if all daily tasks are completed
    const today = new Date();
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const allTasksCompleted = todayTasks.length > 0 && completedToday === todayTasks.length;

    // Focus mode logic
    const handleStartFocusMode = () => {
        setIsFocusMode(true);
        setFocusStartTime(new Date());
        setCanCompleteTasks(false);
        
        // Enable task completion after 15 minutes
        setTimeout(() => {
            setCanCompleteTasks(true);
        }, 15 * 60 * 1000); // 15 minutes
    };

    const handleExitFocusMode = () => {
        setIsFocusMode(false);
        setFocusStartTime(null);
        setCanCompleteTasks(true);
    };

    // Full-screen Focus Mode Component with Surface Tension-inspired visuals
    const FocusModeScreen: React.FC = () => {
        const [timeLeft, setTimeLeft] = useState(25 * 60);
        const [isRunning, setIsRunning] = useState(true);
        const [sessionType, setSessionType] = useState<'focus' | 'break' | 'longBreak'>('focus');

        const sessionTypes = {
            focus: { 
                duration: 25 * 60, 
                colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'], 
                label: 'Focus' 
            },
            break: { 
                duration: 5 * 60, 
                colors: ['#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'], 
                label: 'Break' 
            },
            longBreak: { 
                duration: 15 * 60, 
                colors: ['#a8e6cf', '#ffd3a5', '#fd9853', '#a8e6cf'], 
                label: 'Long Break' 
            }
        };

        const currentSession = sessionTypes[sessionType];
        const progress = ((currentSession.duration - timeLeft) / currentSession.duration) * 100;

        useEffect(() => {
            let interval: NodeJS.Timeout;
            if (isRunning && timeLeft > 0) {
                interval = setInterval(() => {
                    setTimeLeft(timeLeft => timeLeft - 1);
                }, 1000);
            } else if (timeLeft === 0) {
                setIsRunning(false);
                if (sessionType === 'focus') {
                    setSessionType('break');
                } else {
                    setSessionType('focus');
                }
                setTimeLeft(sessionTypes[sessionType === 'focus' ? 'break' : 'focus'].duration);
            }
            return () => clearInterval(interval);
        }, [isRunning, timeLeft, sessionType]);

        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        return (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ 
                    background: `linear-gradient(135deg, ${currentSession.colors[0]} 0%, ${currentSession.colors[1]} 25%, ${currentSession.colors[2]} 50%, ${currentSession.colors[3]} 100%)`
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Surface Tension-inspired flowing paint animations */}
                <div className="absolute inset-0">
                    {[...Array(40)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full opacity-30"
                            style={{
                                width: `${20 + Math.random() * 50}px`,
                                height: `${20 + Math.random() * 50}px`,
                                background: `radial-gradient(circle, ${currentSession.colors[i % currentSession.colors.length]}70, transparent)`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                x: [0, Math.random() * 150 - 75, 0],
                                y: [0, Math.random() * 150 - 75, 0],
                                scale: [1, 2.5 + Math.random(), 1],
                                rotate: [0, 360, 0],
                            }}
                            transition={{
                                duration: 12 + Math.random() * 8,
                                repeat: Infinity,
                                delay: Math.random() * 4,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                    
                    {/* Large flowing gradient orbs */}
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={`orb-${i}`}
                            className="absolute rounded-full blur-lg"
                            style={{
                                width: `${80 + i * 15}px`,
                                height: `${80 + i * 15}px`,
                                background: `radial-gradient(circle, ${currentSession.colors[i % currentSession.colors.length]}40, transparent)`,
                                left: `${5 + i * 6}%`,
                                top: `${10 + i * 5}%`,
                            }}
                            animate={{
                                x: [0, 40, -25, 0],
                                y: [0, -25, 40, 0],
                                scale: [1, 1.5, 0.8, 1],
                            }}
                            transition={{
                                duration: 10 + i * 0.6,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 text-center text-white">
                    {/* Exit Button */}
                    <motion.button
                        onClick={handleExitFocusMode}
                        className="absolute top-8 right-8 p-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <span className="text-white font-bold text-lg">✕</span>
                    </motion.button>

                    {/* Timer Display */}
                    <div className="mb-8">
                        <div className="relative w-80 h-80 mx-auto mb-6">
                            {/* Animated background circle */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(from 0deg, ${currentSession.colors[0]}, ${currentSession.colors[1]}, ${currentSession.colors[2]}, ${currentSession.colors[3]}, ${currentSession.colors[0]})`,
                                    opacity: 0.4
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            />
                            
                            {/* Progress Circle */}
                            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="white"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                                    transition={{ duration: 0.5 }}
                                    style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' }}
                                />
                            </svg>
                            
                            {/* Timer Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <motion.div 
                                    className="text-6xl font-bold font-mono drop-shadow-lg"
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {formatTime(timeLeft)}
                                </motion.div>
                                <div className="text-xl opacity-90 mt-2 drop-shadow-lg">{currentSession.label}</div>
                            </div>
                        </div>
                    </div>

                    {/* Session Info */}
                    <div className="text-lg opacity-90 mb-4">
                        {sessionType === 'focus' ? 'Stay focused and productive!' : 'Take a well-deserved break!'}
                    </div>

                    {/* Task completion notice */}
                    {!canCompleteTasks && (
                        <motion.div
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mx-auto max-w-md"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="text-sm">
                                Task completion will be available after 15 minutes of focused work.
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        );
    };

    // If in focus mode, show full-screen focus mode
    if (isFocusMode) {
        return <FocusModeScreen />;
    }

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
                                briefing={briefing}
                                isBriefingLoading={isBriefingLoading}
                                notes={notes}
                                onCompleteTask={onCompleteTask}
                                navigateToScheduleDate={navigateToScheduleDate}
                                setScreen={setScreen}
                                canCompleteTasks={canCompleteTasks}
                            />
                        </div>
                        
                        {/* Health Insights and Quick Stats - Right Side */}
                        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
                            <div className="flex-1">
                            <HealthInsights
                                healthData={healthData}
                            />
                        </div>
                            <div className="flex-1">
                                <PraxisRewardsWidget
                                tasks={tasks}
                                healthData={healthData}
                            />
                        </div>
                        </div>
                    </div>



                    {/* Main Content Grid - Clean Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        {/* Task Toggle */}
                        <div className="lg:col-span-1">
                            <TaskToggle
                                tasks={tasks}
                                categoryColors={categoryColors}
                                onCompleteTask={onCompleteTask}
                                navigateToScheduleDate={navigateToScheduleDate}
                                setScreen={setScreen}
                                canCompleteTasks={canCompleteTasks}
                            />
                        </div>

                        {/* Habit Insights */}
                        <div className="lg:col-span-1">
                            <HabitInsights
                                healthData={healthData}
                            />
                        </div>
                    </div>

                    {/* Bottom Row - Focus Timer and Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        {/* Focus Timer */}
                        <div className="lg:col-span-1">
                            <FocusTimerWidget
                                tasks={tasks}
                                healthData={healthData}
                                onStartFocusMode={handleStartFocusMode}
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
                    </div>

                </motion.div>
            </div>
        </motion.div>
    );
};

export default PraxisDashboard;