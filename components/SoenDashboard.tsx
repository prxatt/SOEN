/**
 * SOEN DASHBOARD - Enhanced Visual Design
 * 
 * Features:
 * - EnhancedDashboard.tsx visual excellence with Schedule.tsx Today view styling
 * - Daily greeting with user personalization
 * - Soen branding in top left corner
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
 * 
 * GUARD RAILS:
 * - Do not modify the overall structure of the dashboard grid without explicit instructions
 * - Ensure all new components or modifications maintain responsiveness and accessibility
 * - Avoid introducing new global state without clear justification and user approval
 * - All text colors should dynamically adapt to background using getTextColorForBackground
 * - Do not use gradient text anywhere in the application
 * - Ensure all interactive elements have proper onClick={(e) => { e.stopPropagation(); ... }} to prevent unintended parent clicks
 * - Maintain consistent widget sizing and spacing as per previous user requests
 * - All new icons must be SVG and follow the existing icon styling conventions
 * - Do not remove or alter the core functionality of existing widgets unless explicitly instructed
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileDashboardTiles from './MobileDashboardTiles';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen, TaskStatus } from '../types';
import { safeGet } from '../utils/validation';
import { 
    CheckCircleIcon, SparklesIcon, HeartIcon, BoltIcon, ClockIcon, 
    SunIcon, ChevronLeftIcon, ChevronRightIcon, BrainCircuitIcon, PlusIcon,
    CalendarDaysIcon, DocumentTextIcon, ActivityIcon, ArrowTrendingUpIcon,
    FlagIcon, StarIcon, BoltIcon as ZapIcon, CalendarIcon,
    ArrowRightIcon, CheckIcon, PencilIcon, TrashIcon, BabyPenguinIcon
} from './Icons';

interface SoenDashboardProps {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    briefing: MissionBriefing;
    goals: Goal[];
    setFocusTask: (task: Task | null) => void;
    dailyCompletionImage: string | null;
    categoryColors: Record<Category, string>;
    isBriefingLoading: boolean;
    navigateToScheduleDate: (date: Date, taskId?: number) => void;
    inferredLocation: string | null;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number) => void;
    soenFlow?: number;
    purchasedRewards?: string[];
    activeTheme?: string;
    activeFocusBackground?: string;
    userName?: string;
}

// Enhanced color scheme matching EnhancedDashboard
const SOEN_COLORS = {
    background: '#0B0B0C',
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

// Ultra-Cute Mira Baby Penguin with Engaging Design
// Cute, Charming Mira (Baby Penguin) Component - Friendly Design
const GhibliPenguin: React.FC = () => {
    return (
        <motion.div
            className="relative w-full h-full flex items-center justify-center"
            animate={{ 
                scale: [1, 1.02, 1],
                y: [0, -1, 0]
            }}
            transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
            }}
        >
            <svg
                viewBox="0 0 100 120"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="miraBodyGradientHeader" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b3b3b" />
                        <stop offset="100%" stopColor="#2a2a2a" />
                    </linearGradient>
                </defs>
                
                {/* Body - Soft, rounded ellipse */}
                <ellipse cx="50" cy="70" rx="35" ry="40" fill="url(#miraBodyGradientHeader)" />
                
                {/* Belly - Soft white/cream */}
                <ellipse cx="50" cy="75" rx="22" ry="28" fill="#fef3c7" />
                
                {/* Head - Soft, rounded circle */}
                <circle cx="50" cy="35" r="28" fill="url(#miraBodyGradientHeader)" />
                
                {/* Left Eye - Large, friendly, dark */}
                <circle cx="42" cy="32" r="7" fill="#1f2937" />
                <circle cx="43.5" cy="30.5" r="3" fill="#ffffff" />
                
                {/* Right Eye - Large, friendly, dark */}
                <circle cx="58" cy="32" r="7" fill="#1f2937" />
                <circle cx="59.5" cy="30.5" r="3" fill="#ffffff" />
                
                {/* Beak - Soft orange/yellow */}
                <polygon points="50,40 46,44 54,44" fill="#fbbf24" />
                
                {/* Cheek blush - Soft pink */}
                <circle cx="35" cy="38" r="4" fill="#fbcfe8" opacity="0.6" />
                <circle cx="65" cy="38" r="4" fill="#fbcfe8" opacity="0.6" />
                
                {/* Left Foot - Soft orange */}
                <ellipse cx="40" cy="108" rx="8" ry="5" fill="#f59e0b" />
                
                {/* Right Foot - Soft orange */}
                <ellipse cx="60" cy="108" rx="8" ry="5" fill="#f59e0b" />
            </svg>
        </motion.div>
    );
};

// Scroll-Aware Soen Header Component
const SoenHeader: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled 
                    ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-2' 
                    : 'bg-transparent py-3 md:py-4'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="app-container-with-padding flex items-center justify-between">
                <motion.div
                    className="flex items-center gap-2 sm:gap-3"
                    animate={{ 
                        scale: scrolled ? 0.9 : 1,
                        opacity: scrolled ? 0.95 : 1
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 ${scrolled ? 'w-6 h-6 sm:w-8 sm:h-8' : ''}`}>
                <GhibliPenguin />
                </div>
                    <AnimatePresence mode="wait">
                        {!scrolled && (
                            <motion.span
                                key="wordmark"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.3 }}
                                className="font-bold text-lg sm:text-2xl text-white whitespace-nowrap"
                            >
                                Soen
                            </motion.span>
                        )}
                    </AnimatePresence>
        </motion.div>
            </div>
        </motion.header>
    );
};




// Next Up Widget
const NextUpWidget: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date, taskId?: number) => void;
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
                className="rounded-3xl p-4 sm:p-6 relative overflow-hidden"
                style={{ backgroundColor: '#374151', color: 'white' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center py-8">
                    <ArrowRightIcon className="w-12 h-12 text-white/60 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2 text-white">No Upcoming Tasks</h3>
                    <p className="text-sm text-white/80">You're all caught up! Great work!</p>
                </div>
            </motion.div>
        );
    }

    const bgColor = categoryColors[nextTask.category] || '#374151';
    const textColor = 'white';
    const borderColor = 'rgba(255,255,255,0.3)';

    return (
        <motion.div
            className="rounded-3xl p-4 sm:p-6 relative overflow-hidden"
            style={{ backgroundColor: bgColor, color: textColor }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-3 mb-6">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ArrowRightIcon className="w-6 h-6" style={{ color: textColor }} />
                </motion.div>
                <h3 className="text-2xl font-bold font-display text-white">Next Up</h3>
            </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                    <h4 className="text-2xl font-bold mb-2 text-white">{nextTask.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-white/80">
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
                                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                                />
                                <span className="capitalize">{nextTask.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
            <div className={`mt-6 pt-4 flex justify-between items-center`}>
                <div className="text-center">
                    <p className="font-semibold text-white">{new Date(nextTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-sm text-white/80">Start</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold`} style={{ backgroundColor: 'rgba(0,0,0,0.2)'}}>
                    <span className="text-white">{nextTask.plannedDuration} Min</span>
                </div>
                <div className="text-center">
                    <p className="font-semibold text-white">{new Date(new Date(nextTask.startTime).getTime() + nextTask.plannedDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-sm text-white/80">End</p>
                </div>
            </div>
            
            <div className="flex gap-3 mt-4">
                    {canCompleteTasks ? (
                    <motion.button
                        onClick={() => onCompleteTask(nextTask.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors"
                    style={{ 
                        backgroundColor: 'rgba(0,0,0,0.2)',
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
                        backgroundColor: 'rgba(0,0,0,0.2)',
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
                            // Open event details for this specific task
                            setTimeout(() => {
                                const eventElement = document.querySelector(`[data-task-id='${nextTask.id}']`);
                                if (eventElement && eventElement instanceof HTMLElement) {
                                    eventElement.click();
                                }
                            }, 100);
                        }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors"
                    style={{ 
                        backgroundColor: 'rgba(0,0,0,0.2)',
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

// Tasks Widget - Redesigned to match "Statements/Direct Debits" card style from reference
const TaskToggle: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date, taskId?: number) => void;
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
            className="rounded-3xl p-4 md:p-5 lg:p-6 relative overflow-hidden"
            style={{ 
                backgroundColor: '#FDE047', // Vibrant yellow matching "Statements" card
                color: '#0B0B0C' // Black text
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-black">Tasks</h3>
                </div>
                
                {/* Pill Toggle */}
                <div className="flex rounded-full p-1 bg-black/10">
                    <motion.button
                        onClick={() => setActiveView('today')}
                        className="px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 min-h-[44px]"
                        style={{ 
                            color: activeView === 'today' ? '#FDE047' : '#0B0B0C',
                            backgroundColor: activeView === 'today' ? '#0B0B0C' : 'transparent'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Today
                    </motion.button>
                    <motion.button
                        onClick={() => setActiveView('tomorrow')}
                        className="px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 min-h-[44px]"
                        style={{ 
                            color: activeView === 'tomorrow' ? '#FDE047' : '#0B0B0C',
                            backgroundColor: activeView === 'tomorrow' ? '#0B0B0C' : 'transparent'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Tomorrow
                    </motion.button>
                </div>
            </div>

            {/* Task List - equal height, scrollable on overflow (desktop) */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                    >
                        {currentTasks.length > 0 ? (
                            currentTasks.slice(0, 5).map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-black/5 hover:bg-black/10 transition-colors min-h-[44px]"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg min-w-[32px]"
                                            style={{ 
                                                backgroundColor: (() => {
                                                    const catColor = categoryColors[task.category] || '#6B7280';
                                                    // Ensure category color doesn't overlap with widget backgrounds
                                                    // Widget backgrounds: Tasks #FDE047 (yellow), Habits #F59E0B (orange), Flow #10B981 (emerald)
                                                    const widgetColors = ['#FDE047', '#F59E0B', '#10B981'];
                                                    if (widgetColors.includes(catColor.toUpperCase())) {
                                                        // Use a slight variation if there's overlap
                                                        return catColor === '#FDE047' ? '#FACC15' : 
                                                               catColor === '#F59E0B' ? '#FB923C' : 
                                                               catColor === '#10B981' ? '#34D399' : catColor;
                                                    }
                                                    return catColor;
                                                })()
                                            }}
                                        >
                                            {/* simple AI icon mapping */}
                                            {(() => {
                                                const t = `${task.title} ${task.category}`.toLowerCase();
                                                if (t.includes('meet') || t.includes('call')) return (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2"/></svg>
                                                );
                                                if (t.includes('run') || t.includes('gym') || t.includes('workout')) return (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                                );
                                                if (t.includes('read') || t.includes('study')) return (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h3l2-2h5a2 2 0 002-2V8a2 2 0 00-2-2h-5z"/></svg>
                                                );
                                                return (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-base md:text-lg font-bold text-black truncate">{task.title}</div>
                                            <div className="text-xs text-black/70 flex items-center gap-2">
                                                <span>{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="capitalize">{task.category}</span>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canCompleteTasks ? (
                                        <motion.button
                                                onClick={() => onCompleteTask(task.id)}
                                                className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-black text-white hover:bg-black/90 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </motion.button>
                                        ) : (
                                            <div className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-black/20 text-black/50 cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center">
                                                <ClockIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                        <motion.button
                                            onClick={() => {
                                                navigateToScheduleDate(currentDate);
                                                setScreen('Schedule');
                                            }}
                                            className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-black/10 text-black hover:bg-black/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-12 h-12 text-black/40 mx-auto mb-4" />
                                <p className="text-sm text-black/70">
                                    No tasks scheduled for {activeView === 'today' ? 'today' : 'tomorrow'}
                                </p>
                            </div>
                        )}
                        
                        {currentTasks.length > 5 && (
                            <div className="text-center pt-2">
                                <p className="text-xs text-black/60">+{currentTasks.length - 5} more tasks</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


// Habits Widget - Redesigned to match reference style (list-based, similar to Tasks)
const HabitInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const [habits, setHabits] = useState([
        { 
            id: 1, 
            name: 'Morning Routine', 
            streak: 7, 
            color: '#10b981', 
            icon: SunIcon
        },
        { 
            id: 2, 
            name: 'Exercise', 
            streak: 5, 
            color: '#3b82f6', 
            icon: ActivityIcon
        },
        { 
            id: 3, 
            name: 'Meditation', 
            streak: 3, 
            color: '#f59e0b', 
            icon: BrainCircuitIcon
        },
        { 
            id: 4, 
            name: 'Reading', 
            streak: 12, 
            color: '#8b5cf6', 
            icon: DocumentTextIcon
        }
    ]);
    
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const habitSuggestions = [
        'Morning meditation', 'Drink 8 glasses of water', 'Read for 30 minutes', 'Take a 10-minute walk',
        'Practice gratitude', 'Do 20 push-ups', 'Write in journal', 'Stretch for 5 minutes',
        'Call family member', 'Learn new skill', 'Practice deep breathing', 'Take vitamins',
        'Limit screen time', 'Eat vegetables', 'Practice mindfulness', 'Do yoga',
        'Listen to podcast', 'Practice instrument', 'Take breaks every hour', 'Declutter workspace',
        'Practice positive affirmations', 'Go to bed early', 'Take stairs instead of elevator',
        'Practice active listening', 'Do household chores', 'Practice patience', 'Limit caffeine',
        'Practice time management', 'Do something creative', 'Practice empathy', 'Take nature photos'
    ];

    const handleInputChange = (value: string) => {
        setNewHabitName(value);
        if (value.trim().length > 0) {
            const filtered = habitSuggestions.filter(suggestion => 
                suggestion.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setNewHabitName(suggestion);
        setShowSuggestions(false);
    };

    const getIconForHabit = (habitName: string) => {
        const name = habitName.toLowerCase();
        if (name.includes('meditation') || name.includes('mindfulness') || name.includes('breathing')) return BrainCircuitIcon;
        if (name.includes('water') || name.includes('drink') || name.includes('hydration')) return HeartIcon;
        if (name.includes('exercise') || name.includes('workout') || name.includes('push') || name.includes('walk') || name.includes('run')) return ActivityIcon;
        if (name.includes('read') || name.includes('book') || name.includes('study') || name.includes('learn')) return DocumentTextIcon;
        if (name.includes('morning') || name.includes('wake') || name.includes('sunrise')) return SunIcon;
        if (name.includes('journal') || name.includes('write') || name.includes('note')) return DocumentTextIcon;
        if (name.includes('call') || name.includes('phone') || name.includes('family') || name.includes('friend')) return HeartIcon;
        if (name.includes('vitamin') || name.includes('medicine') || name.includes('health')) return HeartIcon;
        if (name.includes('screen') || name.includes('phone') || name.includes('digital')) return ActivityIcon;
        if (name.includes('vegetable') || name.includes('eat') || name.includes('food') || name.includes('meal')) return HeartIcon;
        if (name.includes('yoga') || name.includes('stretch') || name.includes('flexibility')) return ActivityIcon;
        if (name.includes('podcast') || name.includes('listen') || name.includes('audio')) return DocumentTextIcon;
        if (name.includes('instrument') || name.includes('music') || name.includes('play')) return ActivityIcon;
        if (name.includes('break') || name.includes('rest') || name.includes('pause')) return ClockIcon;
        if (name.includes('declutter') || name.includes('clean') || name.includes('organize')) return ActivityIcon;
        if (name.includes('affirmation') || name.includes('positive') || name.includes('gratitude')) return BrainCircuitIcon;
        if (name.includes('bed') || name.includes('sleep') || name.includes('night')) return ClockIcon;
        if (name.includes('stairs') || name.includes('elevator') || name.includes('walk')) return ActivityIcon;
        if (name.includes('listening') || name.includes('patience') || name.includes('empathy')) return BrainCircuitIcon;
        if (name.includes('chore') || name.includes('household') || name.includes('clean')) return ActivityIcon;
        if (name.includes('caffeine') || name.includes('coffee') || name.includes('limit')) return HeartIcon;
        if (name.includes('time') || name.includes('management') || name.includes('schedule')) return ClockIcon;
        if (name.includes('creative') || name.includes('art') || name.includes('draw') || name.includes('paint')) return DocumentTextIcon;
        if (name.includes('photo') || name.includes('nature') || name.includes('outdoor')) return SunIcon;
        return FlagIcon; // Default icon
    };

    const getColorForHabit = (habitName: string) => {
        const name = habitName.toLowerCase();
        if (name.includes('meditation') || name.includes('mindfulness') || name.includes('breathing')) return '#8b5cf6';
        if (name.includes('water') || name.includes('drink') || name.includes('hydration')) return '#06b6d4';
        if (name.includes('exercise') || name.includes('workout') || name.includes('push') || name.includes('walk') || name.includes('run')) return '#10b981';
        if (name.includes('read') || name.includes('book') || name.includes('study') || name.includes('learn')) return '#3b82f6';
        if (name.includes('morning') || name.includes('wake') || name.includes('sunrise')) return '#f59e0b';
        if (name.includes('journal') || name.includes('write') || name.includes('note')) return '#8b5cf6';
        if (name.includes('call') || name.includes('phone') || name.includes('family') || name.includes('friend')) return '#ef4444';
        if (name.includes('vitamin') || name.includes('medicine') || name.includes('health')) return '#ef4444';
        if (name.includes('screen') || name.includes('phone') || name.includes('digital')) return '#6b7280';
        if (name.includes('vegetable') || name.includes('eat') || name.includes('food') || name.includes('meal')) return '#10b981';
        if (name.includes('yoga') || name.includes('stretch') || name.includes('flexibility')) return '#8b5cf6';
        if (name.includes('podcast') || name.includes('listen') || name.includes('audio')) return '#3b82f6';
        if (name.includes('instrument') || name.includes('music') || name.includes('play')) return '#f59e0b';
        if (name.includes('break') || name.includes('rest') || name.includes('pause')) return '#06b6d4';
        if (name.includes('declutter') || name.includes('clean') || name.includes('organize')) return '#10b981';
        if (name.includes('affirmation') || name.includes('positive') || name.includes('gratitude')) return '#f59e0b';
        if (name.includes('bed') || name.includes('sleep') || name.includes('night')) return '#3b82f6';
        if (name.includes('stairs') || name.includes('elevator') || name.includes('walk')) return '#10b981';
        if (name.includes('listening') || name.includes('patience') || name.includes('empathy')) return '#8b5cf6';
        if (name.includes('chore') || name.includes('household') || name.includes('clean')) return '#06b6d4';
        if (name.includes('caffeine') || name.includes('coffee') || name.includes('limit')) return '#ef4444';
        if (name.includes('time') || name.includes('management') || name.includes('schedule')) return '#3b82f6';
        if (name.includes('creative') || name.includes('art') || name.includes('draw') || name.includes('paint')) return '#f59e0b';
        if (name.includes('photo') || name.includes('nature') || name.includes('outdoor')) return '#10b981';
        return '#8b5cf6'; // Default color
    };

    const handleAddHabit = () => {
        if (newHabitName.trim()) {
            const selectedIcon = getIconForHabit(newHabitName.trim());
            const selectedColor = getColorForHabit(newHabitName.trim());
            
            const newHabit = {
                id: Date.now(),
                name: newHabitName.trim(),
                streak: 0,
                color: selectedColor,
                icon: selectedIcon
            };
            setHabits([...habits, newHabit]);
            setNewHabitName('');
            setIsAddingHabit(false);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <motion.div
            className="rounded-3xl p-4 md:p-5 lg:p-6 relative overflow-hidden"
            style={{ 
                backgroundColor: '#F59E0B', // Vibrant orange - different from Tasks (yellow) and Flow (emerald)
                color: '#0B0B0C' // Black text
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative z-10">
            {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FlagIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        <h3 className="text-base md:text-lg lg:text-xl font-bold text-black">Habits</h3>
                </div>
                <motion.button
                    onClick={() => setIsAddingHabit(true)}
                        className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                        <PlusIcon className="w-5 h-5 text-black" />
                </motion.button>
            </div>

            {/* Add Habit Form */}
            {isAddingHabit && (
                <motion.div
                        className="mb-4 p-4 rounded-xl bg-black/5 border border-black/10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="relative mb-3">
                    <input
                        type="text"
                        value={newHabitName}
                            onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="Type a habit..."
                                className="w-full p-3 rounded-lg bg-black/5 text-black placeholder-black/40 border border-black/10 outline-none focus:border-black/30 transition-colors min-h-[44px]"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                        autoFocus
                    />
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-lg overflow-hidden z-50"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {suggestions.map((suggestion, index) => (
                                        <button
                                        key={suggestion}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full p-3 text-left text-black hover:bg-black/5 transition-colors min-h-[44px]"
                                    >
                                        {suggestion}
                                        </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                        <div className="flex gap-2">
                        <motion.button
                            onClick={handleAddHabit}
                                className="px-4 py-2 bg-black text-white rounded-lg font-semibold text-sm hover:bg-black/90 transition-colors min-h-[44px]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                                Add
                        </motion.button>
                        <motion.button
                            onClick={() => setIsAddingHabit(false)}
                                className="px-4 py-2 bg-black/10 text-black rounded-lg font-semibold text-sm hover:bg-black/20 transition-colors min-h-[44px]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>
                    </div>
                </motion.div>
            )}

                {/* Habit List - full width, natural height (no odd negative space) */}
                <div className="space-y-2">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.id}
                            className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-black/5 hover:bg-black/10 transition-colors min-h-[44px]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg min-w-[32px]"
                                    style={{ 
                                        backgroundColor: (() => {
                                            // Ensure habit color doesn't overlap with widget backgrounds
                                            // Widget backgrounds: Tasks #FDE047 (yellow), Habits #F59E0B (orange), Flow #10B981 (emerald)
                                            const widgetColors = ['#FDE047', '#F59E0B', '#10B981'];
                                            if (widgetColors.includes(habit.color.toUpperCase())) {
                                                // Use a slight variation if there's overlap
                                                return habit.color === '#FDE047' ? '#FACC15' : 
                                                       habit.color === '#F59E0B' ? '#FB923C' : 
                                                       habit.color === '#10B981' ? '#34D399' : habit.color;
                                            }
                                            return habit.color;
                                        })()
                                    }}
                                >
                                    {(() => {
                                        const n = habit.name.toLowerCase();
                                        if (n.includes('morning')) return <SunIcon className="w-4 h-4 text-white" />;
                                        if (n.includes('exercise') || n.includes('run')) return <ActivityIcon className="w-4 h-4 text-white" />;
                                        if (n.includes('medit') || n.includes('mind')) return <BrainCircuitIcon className="w-4 h-4 text-white" />;
                                        if (n.includes('read')) return <DocumentTextIcon className="w-4 h-4 text-white" />;
                                        return <FlagIcon className="w-4 h-4 text-white" />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base md:text-lg font-bold text-black truncate">{habit.name}</div>
                                    <div className="text-xs text-black/70">{habit.streak} day streak</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded-lg bg-black/10 text-black font-semibold text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">
                                    {habit.streak}
                        </div>
                        </div>
                        </motion.div>
                    ))}
                    
                    {habits.length === 0 && (
                        <div className="text-center py-8">
                            <FlagIcon className="w-12 h-12 text-black/40 mx-auto mb-4" />
                            <p className="text-sm text-black/70">No habits yet. Add one to get started!</p>
                    </div>
                                )}
                                        </div>
            </div>
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

// Enhanced Focus Timer Widget with Pomodoro Integration and Theme Support
const FocusTimerWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
    onStartFocusMode: () => void;
    activeTheme?: string;
    activeFocusBackground?: string;
    purchasedRewards?: string[];
}> = ({ tasks, healthData, onStartFocusMode, activeTheme = 'obsidian', activeFocusBackground = 'synthwave', purchasedRewards = [] }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
    const [sessionType, setSessionType] = useState<'focus' | 'break' | 'longBreak'>('focus');
    const [completedSessions, setCompletedSessions] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [pomodoroStreak, setPomodoroStreak] = useState(0);
    const [sessionPoints, setSessionPoints] = useState(0);

    // Theme-based color functions (defined first to avoid hoisting issues)
    const getThemeColors = (theme: string): string[] => {
        const themeColorMap: Record<string, string[]> = {
            'synthwave': ['#EC4899', '#7c3aed', '#f97316', '#ef4444'],
            'solarpunk': ['#a3e635', '#16a34a', '#22c55e', '#10b981'],
            'luxe': ['#fde047', '#eab308', '#f59e0b', '#d97706'],
            'aurelian': ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
            'crimson': ['#f87171', '#dc2626', '#b91c1c', '#991b1b'],
            'oceanic': ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
            'obsidian': ['#667eea', '#764ba2', '#f093fb', '#f5576c']
        };
        return themeColorMap[theme] || themeColorMap['obsidian'];
    };

    const getBackgroundColors = (background: string): string[] => {
        const backgroundMap: Record<string, string[]> = {
            'synthwave': ['#EC4899', '#7c3aed', '#f97316', '#ef4444'],
            'lofi': ['#4f46e5', '#1e293b', '#334155', '#475569'],
            'solarpunk': ['#a3e635', '#16a34a', '#22c55e', '#10b981']
        };
        return backgroundMap[background] || backgroundMap['synthwave'];
    };

    // Enhanced Pomodoro session configurations with theme integration
    const getSessionConfig = () => {
        const baseSessions = {
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

        // Apply theme-based colors
        const themeColors = getThemeColors(activeTheme);
        const backgroundColors = getBackgroundColors(activeFocusBackground);

        return {
            focus: { 
                duration: 25 * 60, 
                colors: themeColors.length > 0 ? themeColors : baseSessions.focus.colors,
                background: backgroundColors,
                label: 'Focus'
            },
            break: { 
                duration: 5 * 60, 
                colors: baseSessions.break.colors,
                background: backgroundColors,
                label: 'Break'
            },
            longBreak: { 
                duration: 15 * 60, 
                colors: baseSessions.longBreak.colors,
                background: backgroundColors,
                label: 'Long Break'
            }
        };
    };

    const sessionTypes = getSessionConfig();
    const currentSession = sessionTypes[sessionType];
    const progress = ((currentSession.duration - timeLeft) / currentSession.duration) * 100;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Session completed - Award Pomodoro points
            handleSessionCompletion();
            
            setIsRunning(false);
            if (sessionType === 'focus') {
                setCompletedSessions(prev => prev + 1);
                const nextCompleted = completedSessions + 1;
                if (nextCompleted % 4 === 0) {
                    setSessionType('longBreak');
                    setTimeLeft(sessionTypes.longBreak.duration);
                } else {
                    setSessionType('break');
                    setTimeLeft(sessionTypes.break.duration);
                }
            } else {
                setSessionType('focus');
                setTimeLeft(sessionTypes.focus.duration);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, isPaused, timeLeft, sessionType, completedSessions]);

    // Handle Pomodoro session completion
    const handleSessionCompletion = () => {
        // Calculate points for completed session
        let points = 5; // Base Pomodoro bonus
        
        // Duration bonus
        if (currentSession.duration >= 25 * 60) points += 2; // Standard Pomodoro
        if (currentSession.duration >= 50 * 60) points += 3; // Extended session
        
        // Streak bonus
        const streakBonus = getStreakBonus();
        points += streakBonus;
        
        // Theme bonus (using premium themes gives extra points)
        if (activeTheme !== 'obsidian') {
            points += 1; // Premium theme bonus
        }
        
        setSessionPoints(prev => prev + points);
        
        // Update Pomodoro streak
        setPomodoroStreak(prev => prev + 1);
        
        console.log(`🍅 Pomodoro session completed! +${points} points (Streak: ${pomodoroStreak + 1})`);
    };

    // Calculate streak bonus
    const getStreakBonus = (): number => {
        if (pomodoroStreak >= 30) return 10; // 1 month streak
        if (pomodoroStreak >= 14) return 7;  // 2 week streak
        if (pomodoroStreak >= 7) return 5;   // 1 week streak
        if (pomodoroStreak >= 3) return 2;   // 3 day streak
        return 0;
    };

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
            className="rounded-3xl p-5 md:p-6 lg:p-8 relative overflow-hidden"
            style={{ 
                backgroundColor: '#3B82F6', // Vibrant blue - different from Habits (orange)
                color: '#FFFFFF' // White text on blue
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative z-10">
                {/* Header - Match "Engagement" card style */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        <h3 className="text-lg md:text-xl font-bold text-white">Focus Timer</h3>
                            </div>
                    <div className="text-right">
                        <div className="text-xs text-white/80">Sessions</div>
                        <div className="text-xl md:text-2xl font-bold text-white">{completedSessions}</div>
                        </div>
                </div>

                {/* Large Timer Display - Match "Engagement" card style with large percentage */}
                <div className="text-center mb-6">
                    <div className="mb-4">
                            <motion.div
                            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-2"
                            animate={{ scale: [1, 1.01, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {formatTime(timeLeft)}
                    </motion.div>
                        <div className="text-sm md:text-base text-white/80">{currentSession.label}</div>
                        </div>

                    {/* Progress Bar - Match "Engagement" card progress bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-white/80 mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats - Compact, matching reference style */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center bg-white/10 rounded-xl p-3">
                        <div className="text-2xl md:text-3xl font-extrabold text-white mb-1">{pomodoroStreak}</div>
                        <div className="text-xs text-white/80">Day Streak</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl p-3">
                        <div className="text-2xl md:text-3xl font-extrabold text-white mb-1">{completedSessions}</div>
                        <div className="text-xs text-white/80">Sessions</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl p-3">
                        <div className="text-2xl md:text-3xl font-extrabold text-white mb-1">+{sessionPoints}</div>
                        <div className="text-xs text-white/80">Points</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-3">
                    <motion.button
                        onClick={isRunning ? pauseTimer : startTimer}
                               className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-blue-600 hover:bg-white/90 transition-colors min-h-[44px]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Start Focus'}
                    </motion.button>
                    {isRunning && (
                    <motion.button
                        onClick={resetTimer}
                                   className="px-4 py-3 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors min-h-[44px]"
                            whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Reset
                    </motion.button>
                    )}
                </div>

                {/* Motivational Message */}
                <div className="text-center mt-4">
                           <p className="text-xs text-white/80 italic">
                        {getMotivationalMessage()}
                           </p>
                </div>
            </div>
        </motion.div>
    );
};




// Daily Greeting - Redesigned to match reference image (dark mode with date, weather, summary, mood buttons, task list)
const DailyGreeting: React.FC<{
    tasks: Task[];
    categoryColors: Record<Category, string>;
    healthData: HealthData;
    briefing: MissionBriefing;
    isBriefingLoading: boolean;
    notes: Note[];
    onCompleteTask: (taskId: number) => void;
    navigateToScheduleDate: (date: Date, taskId?: number) => void;
    setScreen: (screen: Screen) => void;
    canCompleteTasks: boolean;
    insightExpanded?: boolean;
    setInsightExpanded?: (expanded: boolean) => void;
    userName?: string;
    onMoodSelected?: (mood: string, date: Date) => void; // Callback to save mood data
}> = ({ tasks, categoryColors, healthData, briefing, isBriefingLoading, notes, onCompleteTask, navigateToScheduleDate, setScreen, canCompleteTasks, insightExpanded: externalInsightExpanded, setInsightExpanded: externalSetInsightExpanded, userName, onMoodSelected }) => {
    const [internalInsightExpanded, setInternalInsightExpanded] = useState(false);
    const [fullScreenInsight, setFullScreenInsight] = useState(false);
    const [undoTaskId, setUndoTaskId] = useState<number | null>(null);
    const [recentlyCompleted, setRecentlyCompleted] = useState<Set<number>>(new Set());
    
    // Use external state if provided, otherwise use internal
    const insightExpanded = externalInsightExpanded !== undefined ? externalInsightExpanded : internalInsightExpanded;
    const setInsightExpanded = externalSetInsightExpanded || setInternalInsightExpanded;
    // Load today's mood from localStorage
    const loadTodayMood = (): string | null => {
        try {
            const moodHistory = localStorage.getItem('soen-mood-history');
            if (!moodHistory) return null;
            const history = JSON.parse(moodHistory) as Array<{ date: string; mood: string }>;
            const todayStr = today.toDateString();
            const todayEntry = history.find(h => new Date(h.date).toDateString() === todayStr);
            return todayEntry?.mood || null;
        } catch {
            return null;
        }
    };

    const [selectedMood, setSelectedMood] = useState<string | null>(() => loadTodayMood());
    const [taskFilter, setTaskFilter] = useState<'all' | 'events' | 'meetings' | 'tasks'>('all');
    const today = new Date();
    
    // Save mood to localStorage and notify parent
    const handleMoodSelect = (mood: string) => {
        const newMood = selectedMood === mood ? null : mood;
        setSelectedMood(newMood);
        
        if (newMood) {
            // Save to localStorage
            try {
                const moodHistory = localStorage.getItem('soen-mood-history');
                const history: Array<{ date: string; mood: string }> = moodHistory ? JSON.parse(moodHistory) : [];
                const todayStr = today.toISOString();
                
                // Remove existing entry for today if any
                const filteredHistory = history.filter(h => new Date(h.date).toDateString() !== today.toDateString());
                
                // Add new entry
                filteredHistory.push({ date: todayStr, mood: newMood });
                
                // Keep only last 90 days
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                const recentHistory = filteredHistory.filter(h => new Date(h.date) >= ninetyDaysAgo);
                
                localStorage.setItem('soen-mood-history', JSON.stringify(recentHistory));
                
                // Notify parent component if callback provided
                if (onMoodSelected) {
                    onMoodSelected(newMood, today);
                }
            } catch (error) {
                console.error('Failed to save mood:', error);
            }
        }
    };
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    
    // Categorize tasks into events, meetings, and regular tasks
    const todayEvents = todayTasks.filter(t => 
        t.category.toLowerCase() === 'event' || t.category.toLowerCase().includes('event')
    );
    const todayMeetings = todayTasks.filter(t => 
        t.category.toLowerCase() === 'meeting' || t.category.toLowerCase().includes('meeting')
    );
    const todayRegularTasks = todayTasks.filter(t => 
        !todayEvents.includes(t) && !todayMeetings.includes(t)
    );
    
    const eventsCount = todayEvents.length;
    const meetingsCount = todayMeetings.length;
    const tasksCount = todayRegularTasks.length;
    
    // Get filtered tasks based on selection
    const getFilteredTasks = () => {
        if (taskFilter === 'events') return todayEvents;
        if (taskFilter === 'meetings') return todayMeetings;
        if (taskFilter === 'tasks') return todayRegularTasks;
        return todayTasks;
    };
    
    // Check if it's evening (9pm or later)
    const isEvening = new Date().getHours() >= 21;

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = userName || localStorage.getItem('soen-user-name') || '';
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        return name ? `${greeting}, ${name}.` : `${greeting}.`;
    };

    const getDayName = () => {
        return today.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const getShortDate = () => {
        return today.toLocaleDateString('en-US', { day: 'numeric', weekday: 'short' });
    };

    // AI icon mapping for tasks/events/meetings
    const getAiIconForItem = (title: string, category: string, isCompleted?: boolean) => {
        if (isCompleted) {
            return <CheckCircleIcon className="w-5 h-5 text-white" />;
        }
        const t = `${title} ${category}`.toLowerCase();
        if (t.includes('meet') || t.includes('call') || t.includes('zoom') || t.includes('google')) return (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4 7a3 3 0 013-3h5a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7z" />
                <path d="M15.5 9.5l4.5-3v11l-4.5-3v-5z" />
            </svg>
        );
        if (t.includes('run') || t.includes('gym') || t.includes('workout') || t.includes('yoga')) return (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        );
        if (t.includes('read') || t.includes('study') || t.includes('learn')) return (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h3l2-2h5a2 2 0 002-2V8a2 2 0 00-2-2h-5z"/></svg>
        );
        if (t.includes('eat') || t.includes('meal') || t.includes('lunch') || t.includes('dinner')) return (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 3h16M4 8h16M4 13h16M4 18h16"/></svg>
        );
    return (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/></svg>
        );
    };

    // Get week dates for calendar strip
    const getWeekDates = () => {
        const week = [];
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            // Count tasks for each day
            const dayTasks = tasks.filter(t => 
                new Date(t.startTime).toDateString() === date.toDateString()
            );
            week.push({
                date: date.getDate(),
                day: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                isToday: date.toDateString() === today.toDateString(),
                dateObj: date,
                taskCount: dayTasks.length
            });
        }
        return week;
    };

    // Find related notes for today's tasks (used in expanded insight)
    const relatedNotes = notes.filter(note => 
        todayTasks.some(task => 
            note.title?.toLowerCase().includes(task.title.toLowerCase()) ||
            note.content?.toLowerCase().includes(task.title.toLowerCase()) ||
            note.content?.toLowerCase().includes(task.category.toLowerCase())
        )
    );
    
    // Get user context: lifestyle profile, travel mode, sick mode
    const getUserContext = () => {
        try {
            const lifestyle = localStorage.getItem('soen-lifestyle-profile') || 'general';
            const travelMode = localStorage.getItem('soen-travel-mode') === 'true';
            const sickMode = localStorage.getItem('soen-sick-mode') === 'true';
            const moodHistory = localStorage.getItem('soen-mood-history');
            let recentMoods: string[] = [];
            if (moodHistory) {
                try {
                    const history = JSON.parse(moodHistory) as Array<{ date: string; mood: string }>;
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    recentMoods = history
                        .filter(h => new Date(h.date) >= sevenDaysAgo)
                        .map(h => h.mood);
                } catch {}
            }
            return { lifestyle, travelMode, sickMode, recentMoods };
        } catch {
            return { lifestyle: 'general', travelMode: false, sickMode: false, recentMoods: [] };
        }
    };

    // Check for injury/accommodation patterns (skipped workouts, sick mode, etc.)
    const detectInjuryAccommodation = (context: ReturnType<typeof getUserContext>) => {
        if (context.sickMode) return 'sick';
        // Check for skipped workout patterns (could be expanded with historical data)
        const hasScheduledWorkout = todayTasks.some(t => 
            t.category.toLowerCase().includes('workout') || 
            t.category.toLowerCase().includes('exercise') || 
            t.category.toLowerCase().includes('gym')
        );
        // If user typically has workouts but today doesn't, might be accommodating
        // This is simplified - could be enhanced with pattern detection
        return null;
    };

    // Enhanced AI insight based on schedule with meeting research, lifestyle, and accommodations
    const generateDailyInsight = () => {
        const userContext = getUserContext();
        const accommodation = detectInjuryAccommodation(userContext);
        const hasWorkout = todayTasks.some(t => t.category.toLowerCase().includes('workout') || t.category.toLowerCase().includes('exercise') || t.category.toLowerCase().includes('gym'));
        const hasMeetings = meetingsCount > 0;
        const hasWork = todayTasks.some(t => t.category.toLowerCase().includes('work'));
        
        // Get meeting-related notes for research
        const meetingNotes = notes.filter(note => 
            note.title?.toLowerCase().includes('meeting') || 
            note.content?.toLowerCase().includes('meeting') ||
            todayMeetings.some(meeting => note.title?.toLowerCase().includes(meeting.title.toLowerCase()) || note.content?.toLowerCase().includes(meeting.title.toLowerCase()))
        );
        
        // Injury/Sick accommodation insights
        if (accommodation === 'sick' || userContext.sickMode) {
            return {
                preview: "Sick Day Mode active. Focus on rest and recovery. All expectations adjusted.",
                expanded: {
                    recovery: "Prioritize rest and hydration. Your body needs time to heal.",
                    tasks: "Lighten your workload today. Postpone non-essential tasks.",
                    expectations: "All productivity expectations are adjusted. Take it easy.",
                    support: "Mira is here to help you recover. Ask for gentle activity suggestions.",
                    return: "Focus on getting better. We'll help you ease back into your routine when you're ready."
                },
                links: relatedNotes.slice(0, 1).map(note => ({ label: note.title || 'Note', type: 'note', id: note.id }))
            };
        }
        
        // Travel mode insights
        if (userContext.travelMode) {
            return {
                preview: "Travel Mode active. Your schedule has been adjusted for time zone changes.",
                expanded: {
                    timezone: "Schedule adjusted for your current timezone. All times display in local time.",
                    flexibility: "Today's schedule is flexible to accommodate travel adjustments.",
                    connectivity: "Consider connectivity needs for meetings and tasks while traveling.",
                    energy: "Travel can be draining. Prioritize rest and hydration.",
                    work: hasWork ? "Work tasks adjusted for travel context. Focus on essentials only." : "Enjoy your travel time. Minimal tasks scheduled."
                },
                links: relatedNotes.slice(0, 1).map(note => ({ label: note.title || 'Note', type: 'note', id: note.id }))
            };
        }
        
        // Lifestyle-aware insights
        const getLifestyleInsight = (lifestyle: string) => {
            switch (lifestyle.toLowerCase()) {
                case 'white-collar':
                case 'whitecollar':
                case 'office':
                    return {
                        focus: "Deadline management and meeting prep",
                        balance: "Work-life balance optimization",
                        energy: "Peak focus: 9-11am for deep work"
                    };
                case 'retail':
                case 'service':
                    return {
                        focus: "Shift scheduling and energy management",
                        balance: "Customer interaction strategies",
                        energy: "Post-shift recovery and meal timing"
                    };
                case 'student':
                    return {
                        focus: "Study schedules and exam prep",
                        balance: "Assignment deadlines and learning optimization",
                        energy: "Peak study hours: morning for memorization, evening for creative work"
                    };
                case 'freelancer':
                case 'self-employed':
                    return {
                        focus: "Project management and client communication",
                        balance: "Income optimization and workflow efficiency",
                        energy: "Client calls: morning, deep work: afternoon"
                    };
                case 'homemaker':
                    return {
                        focus: "Household management and family scheduling",
                        balance: "Personal time optimization",
                        energy: "Peak productivity: early morning, personal time: evening"
                    };
                case 'law enforcement':
                case 'officer':
                    return {
                        focus: "Shift work and stress management",
                        balance: "Recovery strategies between shifts",
                        energy: "Post-shift recovery critical for next shift performance"
                    };
                default:
                    return {
                        focus: "Productivity and goal achievement",
                        balance: "Work-life harmony",
                        energy: "Peak hours: 9-11am"
                    };
            }
        };
        const lifestyleInsight = getLifestyleInsight(userContext.lifestyle);
        
        // Workout-specific guidance (enhanced)
        if (hasWorkout && !hasMeetings) {
            const workoutTasks = todayTasks.filter(t => 
                t.category.toLowerCase().includes('workout') || 
                t.category.toLowerCase().includes('exercise') || 
                t.category.toLowerCase().includes('gym')
            );
            const workoutCount = workoutTasks.length;
            const totalWorkoutDuration = workoutTasks.reduce((sum, t) => sum + (t.plannedDuration || 30), 0);
            
            // Calculate optimal hydration based on activity level
            const hydrationTarget = totalWorkoutDuration > 90 ? '3-3.5L' : totalWorkoutDuration > 60 ? '2.5-3L' : '2-2.5L';
            
            // Determine best workout time based on schedule
            const workoutTimes = workoutTasks.map(t => new Date(t.startTime).getHours());
            const avgWorkoutTime = workoutTimes.reduce((sum, h) => sum + h, 0) / workoutTimes.length;
            const bestTime = avgWorkoutTime < 12 ? 'Morning workouts boost energy all day' : 
                           avgWorkoutTime < 17 ? 'Midday workouts break up the day nicely' : 
                           'Evening workouts help you decompress';
            
            return {
                preview: `Workout day! Focus on hydration - aim for ${hydrationTarget}. ${bestTime}.`,
                expanded: {
                    hydration: `Your ${totalWorkoutDuration}min of activity suggests ${hydrationTarget} water today. Track in Apple Health.`,
                    workoutTime: bestTime,
                    recovery: "Plan 8+ hours sleep tonight for proper recovery. Your body needs rest after today's activities.",
                    nutrition: "Refuel with protein and carbs within 30min post-workout. Your body will recover faster.",
                    goals: workoutCount > 1 ? `Great job with ${workoutCount} workouts today! You're building serious momentum.` : "You're building consistency. Keep it up!",
                    progression: "Track your performance in Apple Health. Monitor heart rate zones and energy levels.",
                    rest: "Active recovery tomorrow - light movement like walking or stretching will help."
                },
                links: relatedNotes.slice(0, 2).map(note => ({ label: note.title || 'Note', type: 'note', id: note.id }))
            };
        } else if (hasMeetings && hasWorkout) {
            // Hybrid day: Work + Workout with lifestyle awareness
            const meetingInsights = todayMeetings.map((meeting, idx) => {
                const relatedNote = meetingNotes.find(n => 
                    n.title?.toLowerCase().includes(meeting.title.toLowerCase()) ||
                    n.content?.toLowerCase().includes(meeting.title.toLowerCase())
                );
                return {
                    meeting: `${idx + 1}. ${meeting.title}`,
                    time: new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    prep: relatedNote ? "Prep notes available" : "No prep notes found",
                    link: relatedNote ? { label: relatedNote.title || 'Prep Note', type: 'note', id: relatedNote.id } : null
                };
            });
        
        return {
                preview: `${meetingsCount} meetings today. Prep notes ready. Best workout time: 6-7pm after meetings end.`,
                expanded: {
                    meetings: `Review meeting agendas 15min before each. ${meetingNotes.length > 0 ? `${meetingNotes.length} prep notes available.` : 'No prep notes found.'}`,
                    meetingDetails: meetingInsights.length > 0 ? meetingInsights.map(m => `${m.meeting} at ${m.time} - ${m.prep}`).join(' | ') : '',
                    workoutTime: "Schedule workout for 6-7pm - perfect timing after your last meeting ends. Exercise helps clear your mind.",
                    energy: `Take 5min breaks between meetings. ${lifestyleInsight.energy}. Your energy typically dips around 2-3pm.`,
                    balance: "You're balancing work and fitness well today. Keep this rhythm!",
                    lifestyle: userContext.lifestyle !== 'general' ? `${lifestyleInsight.focus} for ${userContext.lifestyle.replace(/-/g, ' ')} lifestyle.` : ""
                },
                links: [
                    ...meetingNotes.slice(0, 2).map(note => ({ label: note.title || 'Meeting Note', type: 'note', id: note.id })),
                    ...relatedNotes.slice(0, 1).map(note => ({ label: note.title || 'Related Note', type: 'note', id: note.id }))
                ]
            };
        } else if (hasMeetings) {
            const meetingInsights = todayMeetings.map((meeting, idx) => {
                const relatedNote = meetingNotes.find(n => 
                    n.title?.toLowerCase().includes(meeting.title.toLowerCase()) ||
                    n.content?.toLowerCase().includes(meeting.title.toLowerCase())
                );
                return {
                    meeting: `${idx + 1}. ${meeting.title}`,
                    time: new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agenda: relatedNote ? "Agenda & prep notes available" : "Research agenda and prepare talking points",
                    participants: "Research participants and topics",
                    link: relatedNote ? { label: relatedNote.title || 'Meeting Prep', type: 'note', id: relatedNote.id } : null
                };
            });
            
            return {
                preview: `${meetingsCount} meetings today. Key prep notes ready. Block 15min between meetings for mental reset.`,
                expanded: {
                    meetings: `Your meeting prep notes are ready. ${meetingNotes.length > 0 ? `${meetingNotes.length} prep notes found.` : 'Research meeting topics and prepare agendas.'}`,
                    meetingBreakdown: meetingInsights.map(m => `${m.meeting} at ${m.time} - ${m.agenda}`).join(' | '),
                    breaks: "Schedule 5-10min breaks between meetings. Your focus drops after 90min of back-to-backs.",
                    priority: `${todayMeetings[0]?.title || 'First meeting'} is your highest priority today. Prepare talking points in advance.`,
                    energy: "Your peak focus time is 9-11am. Schedule critical discussions then.",
                    communication: "Research participants, prepare agendas, and outline key discussion points for each meeting."
                },
                links: [
                    ...meetingNotes.slice(0, 3).map(note => ({ label: note.title || 'Meeting Prep', type: 'note', id: note.id })),
                    ...todayMeetings.slice(0, 2).map(meeting => ({ label: meeting.title, type: 'task', id: meeting.id }))
                ]
            };
        }
        
        // Default insights with lifestyle awareness
        const recentMoodTrend = userContext.recentMoods.length > 0 
            ? userContext.recentMoods.filter(m => ['Awful', 'Bad'].includes(m)).length / userContext.recentMoods.length
            : 0;
        
        const moodInsight = recentMoodTrend > 0.4 
            ? "I notice you've had some challenging days recently. Let's focus on achievable goals today and build positive momentum."
            : recentMoodTrend < 0.2 && userContext.recentMoods.length >= 3
            ? "You've been in great spirits! Keep the momentum going with today's tasks."
            : "";
        
        return {
            preview: `Today looks balanced. ${lifestyleInsight.focus}. ${moodInsight || `Focus on your top 3 tasks during ${lifestyleInsight.energy.split(':')[1]?.trim() || 'peak hours'}.`}`,
            expanded: {
                productivity: `Your energy peaks ${lifestyleInsight.energy}. Schedule your most important tasks during this window.`,
                focus: lifestyleInsight.focus,
                balance: lifestyleInsight.balance,
                momentum: todayTasks.length > 5 ? "You have a full day ahead. Pace yourself and take breaks." : "Today's schedule is manageable. You've got this!",
                insights: moodInsight || "Based on your habits, you work best with 25min focus blocks. Try Pomodoro for deep work.",
                lifestyle: userContext.lifestyle !== 'general' ? `Insights tailored for ${userContext.lifestyle.replace(/-/g, ' ')} lifestyle.` : ""
            },
            links: relatedNotes.slice(0, 2).map(note => ({ label: note.title || 'Note', type: 'note', id: note.id }))
        };
    };

    const dailyInsight = generateDailyInsight();

    const weekDates = getWeekDates();

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Main Daily Greeting Card - Dark mode style matching reference */}
                        <motion.div
                className="relative overflow-hidden rounded-3xl p-5 md:p-8 lg:p-12"
            style={{ 
                    backgroundColor: '#0B0B0C', // Dark background matching reference
                color: 'white'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
                <div className="relative z-10">
                    {/* Top Bar - Date and Weather */}
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        {/* Mobile: Day and Date */}
                        <div className="md:hidden">
                            <div className="text-2xl font-bold text-white">{getShortDate()}</div>
                        </div>
                        
                        {/* Desktop: Full Day Name and Date */}
                        <div className="hidden md:block">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-1">{getDayName()}</h1>
                            <div className="text-lg lg:text-xl text-white/80">{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>

                        {/* Weather */}
                        <div className="flex items-center gap-2 text-sm md:text-base">
                            <SunIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                            <span className="font-semibold text-white">62°</span>
                            <span className="text-white/70">SF</span>
                    </div>
                </div>

                    {/* Calendar Strip - Week dates - Clickable */}
                    <div className="flex items-center justify-between mb-4 md:mb-6 px-2">
                        {weekDates.map((day, index) => (
                            <motion.button
                                key={index}
                                onClick={async () => {
                                    navigateToScheduleDate(day.dateObj);
                                    const dayTasks = tasks.filter(t => 
                                        new Date(t.startTime).toDateString() === day.dateObj.toDateString()
                                    );
                                    
                                    // If empty day, trigger AI suggestions
                                    if (dayTasks.length === 0) {
                                        // This will be handled by Schedule component
                                        // For now, just navigate to the date
                                        setScreen('Schedule');
                                        // Schedule component will show AI suggestions for empty days
                                    } else {
                                        setScreen('Schedule');
                                    }
                                }}
                                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] justify-center relative ${
                                    day.isToday ? 'bg-emerald-500' : 'bg-white/5 hover:bg-white/10'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className={`text-xs font-semibold ${day.isToday ? 'text-white' : 'text-white/70'}`}>{day.day}</div>
                                <div className={`text-sm font-bold ${day.isToday ? 'text-white' : 'text-white'}`}>{day.date}</div>
                                {day.taskCount > 0 && (
                                    <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-white' : 'bg-emerald-400'}`} />
                                )}
                            </motion.button>
                        ))}
                            </div>

                    {/* Greeting */}
                    <div className="mb-4 md:mb-6">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
                            {getGreeting()}
                        </h2>
                        
                        {/* Daily Summary - "You have 2 events, 2 meetings and 3 tasks today." - Clickable for filtering */}
                        <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-white/90">
                            <span>You have</span>
                            {eventsCount > 0 && (
                                <>
                                    <motion.button
                                        onClick={() => setTaskFilter(taskFilter === 'events' ? 'all' : 'events')}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                            taskFilter === 'events' ? 'bg-emerald-500/30' : 'hover:bg-white/5'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CalendarIcon className="w-4 h-4 text-emerald-400" />
                                        <span className="font-semibold">{eventsCount} events</span>
                                    </motion.button>
                                    {meetingsCount > 0 || tasksCount > 0 ? <span>,</span> : <span> today.</span>}
                                </>
                            )}
                            {meetingsCount > 0 && (
                                <>
                                    <motion.button
                                        onClick={() => setTaskFilter(taskFilter === 'meetings' ? 'all' : 'meetings')}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                            taskFilter === 'meetings' ? 'bg-emerald-500/30' : 'hover:bg-white/5'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold">{meetingsCount} meetings</span>
                                    </motion.button>
                                    {tasksCount > 0 ? <span> and</span> : <span> today.</span>}
                                </>
                            )}
                            {tasksCount > 0 && (
                                <>
                                    <motion.button
                                        onClick={() => setTaskFilter(taskFilter === 'tasks' ? 'all' : 'tasks')}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                            taskFilter === 'tasks' ? 'bg-emerald-500/30' : 'hover:bg-white/5'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <span className="font-semibold">{tasksCount} tasks today.</span>
                                    </motion.button>
                                </>
                            )}
                                </div>
                                </div>

                    {/* Mood/Activity Buttons - Only show in evening (9pm+) */}
                    {isEvening && (
                        <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
                            {['Awful', 'Bad', 'Okay', 'Good', 'Great'].map((mood, index) => {
                            const icons = [
                                // Awful - Sad face (frown)
                                <svg key="awful" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
                                    <circle cx="15.5" cy="9.5" r="1.5" fill="currentColor" />
                                    <path d="M8 15.5c1 1.5 3 1.5 4 0" strokeWidth="2" strokeLinecap="round" />
                                </svg>,
                                // Bad - Neutral face (straight line)
                                <svg key="bad" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                                    <line x1="9" y1="16" x2="15" y2="16" strokeWidth="2" strokeLinecap="round" />
                                </svg>,
                                // Okay - Slight smile
                                <svg key="okay" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                                    <path d="M9 15.5c0.5 0.5 2 1 3 0" strokeWidth="2" strokeLinecap="round" />
                                </svg>,
                                // Good - Smile
                                <svg key="good" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                                    <path d="M9 14.5c1 1 3 1 4 0" strokeWidth="2" strokeLinecap="round" />
                                </svg>,
                                // Great - Big smile with star
                                <svg key="great" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                                    <path d="M8 13.5c1.5 2 4.5 2 6 0" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ];
                            
                            return (
                                <motion.button
                                    key={mood}
                                    onClick={() => handleMoodSelect(mood)}
                                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-semibold text-xs md:text-sm transition-all min-h-[44px] ${
                                        selectedMood === mood 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-white/5 text-white hover:bg-white/10'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {icons[index]}
                                    {mood}
                                </motion.button>
                            );
                        })}
                            </div>
                    )}

                    {/* Next Up Insight - Mobile: inline, Desktop: popup on right */}
                    <div className="mb-4 md:mb-6">
                        {/* Mobile: Inline expansion */}
                        <div className="md:hidden">
                            <motion.button
                                onClick={() => setInsightExpanded(!insightExpanded)}
                                className="w-full text-left"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className={`rounded-2xl p-4 transition-all duration-300 ${
                                    insightExpanded ? 'bg-white/10' : 'bg-white/5'
                                }`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-emerald-400" />
                                            <h3 className="text-base font-bold text-white">Mira Daily</h3>
                        </div>
                                        <div className="text-xs text-white/70">
                                            {insightExpanded ? 'Collapse ↑' : 'Tap to expand ↓'}
                    </div>
                </div>

                                    <p className="text-sm text-white/90 mb-2">{dailyInsight.preview}</p>

                                    <AnimatePresence>
                                        {insightExpanded && (
                        <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden space-y-3 mt-4 pt-4 border-t border-white/10"
                                            >
                                                {Object.entries(dailyInsight.expanded).map(([key, value], i) => (
                                                    <div key={key}>
                                                        <h4 className="text-xs font-semibold text-white/80 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                        <p className="text-sm text-white/90">{value}</p>
                                </div>
                                                ))}
                                                {dailyInsight.links && dailyInsight.links.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-white/10">
                                                        <h4 className="text-xs font-semibold text-white/80 mb-2">Related Links</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dailyInsight.links.map((link, i) => (
                                                                <motion.button
                                                                    key={i}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (link.type === 'note') {
                                                                            setScreen('Notes');
                                                                        } else if (link.type === 'task') {
                                                                            navigateToScheduleDate(today);
                                                                            setScreen('Schedule');
                                                                            setTimeout(() => {
                                                                                const eventElement = document.querySelector(`[data-task-id='${link.id}']`);
                                                                                if (eventElement && eventElement instanceof HTMLElement) {
                                                                                    eventElement.click();
                                                                                }
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors min-h-[44px]"
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                >
                                                                    {link.label}
                                                                </motion.button>
                        ))}
            </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.button>
                    </div>

                        {/* Desktop: Clickable button that triggers popup on right */}
                        <div className="hidden md:block">
                            <motion.button
                                onClick={() => setInsightExpanded(!insightExpanded)}
                                className="w-full text-left"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className={`rounded-2xl p-4 transition-all duration-300 ${
                                    insightExpanded ? 'bg-white/10' : 'bg-white/5'
                                }`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-emerald-400" />
                                            <h3 className="text-lg font-bold text-white">Mira Daily</h3>
                    </div>
                                        <div className="text-xs text-white/70">
                                            {insightExpanded ? 'Collapse ↑' : 'Tap to expand →'}
                        </div>
                        </div>
                                    <p className="text-sm text-white/90 mb-2">{dailyInsight.preview}</p>
                    </div>
                            </motion.button>
                    </div>
                </div>

                    {/* Desktop Mira Daily Popup removed from DailyGreeting. Overlay is rendered at grid column level. */}

                    {/* Task List - Filtered based on selection */}
                    {getFilteredTasks().length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-base md:text-lg font-bold text-white mb-3">
                                {taskFilter === 'events' && `${eventsCount} Events`}
                                {taskFilter === 'meetings' && `${meetingsCount} Meetings`}
                                {taskFilter === 'tasks' && `${tasksCount} Tasks`}
                                {taskFilter === 'all' && `Up Next`}
                            </h3>
                            {getFilteredTasks()
                                .filter(task => {
                                    // Hide completed tasks that are past undo period (more than 5 seconds ago)
                                    if (task.status === 'Completed' && !recentlyCompleted.has(task.id) && undoTaskId !== task.id) {
                                        return false; // Hide completed tasks after 5 seconds
                                    }
                                    return true;
                                })
                                .slice(0, 5)
                                .map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    onClick={() => {
                                    navigateToScheduleDate(new Date(task.startTime), task.id);
                                    setScreen('Schedule');
                                    }}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors min-h-[44px] cursor-pointer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div 
                                        className="flex items-center justify-center w-10 h-10 rounded-lg min-w-[40px] mt-0.5"
                                        style={{
                                            backgroundColor: (() => {
                                                const catColor = categoryColors[task.category] || '#10b981';
                                                // Ensure category color doesn't overlap with widget backgrounds
                                                // Widget backgrounds: Tasks #FDE047 (yellow), Habits #F59E0B (orange), Flow #10B981 (emerald)
                                                const widgetColors = ['#FDE047', '#F59E0B', '#10B981'];
                                                if (widgetColors.includes(catColor.toUpperCase())) {
                                                    // Use a slight variation if there's overlap
                                                    return catColor === '#FDE047' ? '#FACC15' : 
                                                           catColor === '#F59E0B' ? '#FB923C' : 
                                                           catColor === '#10B981' ? '#34D399' : catColor;
                                                }
                                                return catColor;
                                            })()
                                        }}
                                    >
                                        {getAiIconForItem(task.title, task.category, task.status === 'Completed')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-base md:text-lg font-bold text-white mb-1 ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}>
                                            {task.title}
                                            </div>
                                        {task.status === 'Pending' && new Date(task.startTime) < today && (
                                            <div className="text-xs text-white/70">was overdue and rescheduled from yesterday</div>
                                        )}
                                        {task.status === 'Pending' && (
                                            <div className="text-xs text-white/70">
                                                {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        )}
                                    </div>
                                    {(() => {
                                        // Show completed tasks with undo option for 5 seconds
                                        if (task.status === 'Completed') {
                                            // Show undo option for recently completed tasks (within 5 seconds)
                                            if (undoTaskId === task.id || recentlyCompleted.has(task.id)) {
                                                return (
                                            <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex flex-col items-center gap-1"
                                                    >
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Undo completion - would need to call undo handler from parent
                                                                setUndoTaskId(null);
                                                                setRecentlyCompleted(prev => {
                                                                    const next = new Set(prev);
                                                                    next.delete(task.id);
                                                                    return next;
                                                                });
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors min-h-[44px]"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            Undo
                                                        </motion.button>
                                            </motion.div>
                                                );
                                            }
                                            return null; // Completed tasks without undo show nothing
                                        }
                                        
                                        // Show complete button for pending tasks
                                        return (
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (canCompleteTasks) {
                                                        onCompleteTask(task.id);
                                                        // Start 5-second undo timer
                                                        setUndoTaskId(task.id);
                                                        setRecentlyCompleted(prev => new Set(prev).add(task.id));
                                                        
                                                        // Auto-hide after 5 seconds
                                                        setTimeout(() => {
                                                            setUndoTaskId(null);
                                                            setRecentlyCompleted(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(task.id);
                                                                return next;
                                                            });
                                                        }, 5000);
                                                    }
                                                }}
                                                className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                                    canCompleteTasks ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-white/5 opacity-50 cursor-not-allowed'
                                                }`}
                                                whileHover={canCompleteTasks ? { scale: 1.05 } : {}}
                                                whileTap={canCompleteTasks ? { scale: 0.95 } : {}}
                                                disabled={!canCompleteTasks}
                                            >
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                                            </motion.button>
                                        );
                                    })()}
                                </motion.div>
                            ))}
                            
                            {getFilteredTasks().length > 5 && (
                                <motion.button
                                    onClick={() => {
                                        setScreen('Schedule');
                                        navigateToScheduleDate(today);
                                    }}
                                    className="w-full py-3 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors min-h-[44px]"
                                    whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                    View all {getFilteredTasks().length} {taskFilter === 'all' ? 'items' : taskFilter}
                                </motion.button>
                            )}
                                            </div>
                )}
                                        </div>
                                    </motion.div>
                            </div>
    );
};

// Recent Notes Widget - Small widget with looping animation showing recent notes
const RecentNotesWidget: React.FC<{
    notes: Note[];
}> = ({ notes }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const recentNotes = notes
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 5);
    
    useEffect(() => {
        if (recentNotes.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % recentNotes.length);
        }, 4000); // Change note every 4 seconds
        return () => clearInterval(interval);
    }, [recentNotes.length]);
    
    if (recentNotes.length === 0) {
        return (
        <motion.div
                className="rounded-3xl p-4 md:p-5 relative overflow-hidden"
                style={{ 
                    backgroundColor: '#8B5CF6', // Vibrant purple - different from all other widgets
                    color: '#FFFFFF'
                }}
                initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h3 className="text-base font-bold text-white">Recent Notes</h3>
                </div>
                <p className="text-sm text-white/70">No notes yet</p>
                    </motion.div>
        );
    }

    const currentNote = recentNotes[currentIndex];
    
    return (
            <motion.div
            className="rounded-3xl p-4 md:p-5 relative overflow-hidden"
            style={{ 
                backgroundColor: '#8B5CF6', // Vibrant purple - different from all other widgets
                color: '#FFFFFF'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-base font-bold text-white">Recent Notes</h3>
                <div className="ml-auto flex gap-1">
                    {recentNotes.map((_, i) => (
                        <div
                                key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === currentIndex ? 'bg-white' : 'bg-white/30'
                            }`}
                            />
                        ))}
                </div>
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentNote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                >
                    <h4 className="text-sm font-bold text-white line-clamp-1">{currentNote.title || 'Untitled Note'}</h4>
                    <p className="text-xs text-white/80 line-clamp-2">
                        {currentNote.content?.substring(0, 100) || 'No content'}
                    </p>
                    <div className="text-[10px] text-white/60">
                        {new Date(currentNote.createdAt || currentNote.updatedAt || 0).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

// Your Flow (Rewards) Widget - Minimal, small, long rectangular on mobile, colorful but cohesive, no Mira, different color from Tasks/Habits
const SoenRewardsWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
    soenFlow?: number;
    purchasedRewards?: string[];
    activeTheme?: string;
    activeFocusBackground?: string;
    onOpenRewards?: () => void;
}> = ({ tasks, healthData, soenFlow = 500, purchasedRewards = [], activeTheme = 'obsidian', activeFocusBackground = 'synthwave', onOpenRewards }) => {
    const [currentPoints, setCurrentPoints] = useState(0);
    const [level, setLevel] = useState(1);
    const [streakDays, setStreakDays] = useState(14);

    // Simplified point calculation
    useEffect(() => {
        const today = new Date().toDateString();
        const todayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today);
        const completedTasks = todayTasks.filter(t => t.status === 'Completed');
        
        const basePoints = completedTasks.length * 10;
        const streakBonus = streakDays >= 7 ? 50 : streakDays >= 14 ? 100 : 0;
        const totalPoints = basePoints + streakBonus;
            
            setCurrentPoints(totalPoints);
        setLevel(Math.floor(totalPoints / 500) + 1);
    }, [tasks, streakDays]);

    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today);
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;

    const progressToNext = ((currentPoints % 500) / 500) * 100;

    // Use different color from Tasks (#FDE047 - yellow) and Habits (#FDE047 - yellow)
    // Flow uses #10B981 (emerald) to be different and colorful
    const flowColor = '#10B981'; // Emerald - different from Tasks/Habits yellow

    return (
                            <motion.div
            className="rounded-3xl p-4 md:p-5 lg:p-6 relative overflow-hidden"
                                style={{
                backgroundColor: flowColor, // Emerald - different from Tasks/Habits yellow
                color: '#FFFFFF' // White text on emerald
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Mobile: Small, long rectangular layout */}
            <div className="md:hidden" onClick={() => onOpenRewards && onOpenRewards()}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <SparklesIcon className="w-5 h-5 text-white flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                                   <h3 className="text-base font-bold text-white truncate">Flow Rewards</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-white">{soenFlow}</span>
                                <span className="text-xs text-white/80">Flow Points</span>
                            </div>
                                </div>
                                </div>
                    <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-white/80">Level</div>
                        <div className="text-xl font-bold text-white">{level}</div>
                    </div>
                </div>

                {/* Progress Bar - Thin, horizontal */}
                       <div className="mt-3">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                                </div>
                    <div className="flex justify-between text-xs text-white/80 mt-1">
                        <span>Progress</span>
                        <span>{Math.round(progressToNext)}%</span>
            </div>
                           {/* Minimized health insights */}
                           <div className="mt-3 flex items-center gap-2 text-[10px] text-white/80">
                               <span>Sleep {healthData.avgSleepHours?.toFixed(0) || '7'}h</span>
                               <span>•</span>
                               <span>Energy {healthData.energyLevel || 'High'}</span>
                           </div>
                    </div>
                    </div>
                    
            {/* Desktop: Compact layout - removed stats to reduce negative space */}
            <div className="hidden md:block">
                <div className="relative z-10">
                    {/* Header with Level */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            <h3 className="text-lg md:text-xl font-bold text-white">Your Flow</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-white/80">Level</div>
                            <div className="text-xl md:text-2xl font-bold text-white">{level}</div>
                        </div>
                </div>

                    {/* Compact Value Display */}
                    <div className="mb-3">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-extrabold text-white">{soenFlow}</span>
                            <span className="text-sm md:text-base text-white/80">Flow Points</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-xs text-white/80 mb-1.5">
                            <span>Progress to next level</span>
                            <span>{Math.round(progressToNext)}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNext}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                    </div>
                </div>

                    {/* Compact Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-white">{streakDays}</div>
                            <div className="text-[10px] text-white/70">Streak</div>
                    </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-white">{completedToday}</div>
                            <div className="text-[10px] text-white/70">Tasks</div>
                    </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-white">{healthData.avgSleepHours?.toFixed(0) || '7'}</div>
                            <div className="text-[10px] text-white/70">Sleep</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-white capitalize">{healthData.energyLevel?.charAt(0) || 'H'}</div>
                            <div className="text-[10px] text-white/70">Energy</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


// Main Dashboard Component
const SoenDashboard: React.FC<SoenDashboardProps> = (props) => {
    const [insightExpanded, setInsightExpanded] = useState(false);
    const { tasks, notes, healthData, briefing, isBriefingLoading, categoryColors, onCompleteTask, navigateToScheduleDate, setScreen, soenFlow = 500, purchasedRewards = [], activeTheme = 'obsidian', activeFocusBackground = 'synthwave' } = props;
    
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
        <>
            {/* Soen Header - Fixed outside main container */}
            <SoenHeader />
            
        <motion.div
            className="min-h-screen relative overflow-x-hidden"
            style={{ backgroundColor: '#0B0B0C' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Global dark background to eliminate any left gutter near the sidebar */}
            <div className="fixed inset-0 bg-[#0B0B0C] -z-10" />
            {/* Floating particles background */}
            <FloatingParticles count={50} />

            {/* Main Content - Mobile-first responsive design with proper touch targets */}
            <div className="app-container py-4 md:py-8 lg:py-10 pt-16 sm:pt-20 px-0 sm:px-0 lg:px-0 mx-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6 lg:space-y-8"
                >
                    {/* Mobile tiles removed per user request */}
                    {/* Top Row - Mobile-first responsive layout */}
                    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                        {/* Daily Greeting - Mobile: full width, Desktop: 2/3 */}
                        <div className="lg:col-span-8 order-1 relative">
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
                                insightExpanded={insightExpanded}
                                setInsightExpanded={setInsightExpanded}
                                userName={props.userName}
                            />
                        </div>
                        
                        {/* Right Column: Mira Daily (if expanded) then Flow + Notes */}
                        <div className="lg:col-span-4 order-2 space-y-4 sm:space-y-6">
                            {insightExpanded && (
                                <MiraDailyPanel
                                    tasks={tasks}
                                    notes={notes}
                                    healthData={healthData}
                                    onClose={() => setInsightExpanded(false)}
                                    setScreen={setScreen}
                                    navigateToScheduleDate={navigateToScheduleDate}
                                />
                            )}
                                <SoenRewardsWidget
                                    tasks={tasks}
                                    healthData={healthData}
                                soenFlow={soenFlow}
                                purchasedRewards={purchasedRewards}
                                activeTheme={activeTheme}
                                activeFocusBackground={activeFocusBackground}
                                    onOpenRewards={() => setScreen('Rewards')}
                            />
                            
                            {/* Recent Notes Widget - Small, looping animation */}
                            <RecentNotesWidget notes={notes} />
                        </div>

                    </div>



                    {/* Main Content Grid - Tasks removed; Habits spans full width */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                        <div className="lg:col-span-12 order-1">
                            <HabitInsights healthData={healthData} />
                        </div>
                    </div>

                    {/* Focus Timer - Only show during overlapping task time */}
                    {(() => {
                        const now = new Date();
                        const active = tasks.some(t => {
                            const start = new Date(t.startTime);
                            const end = new Date(start.getTime() + (t.plannedDuration || 25) * 60000);
                            return now >= start && now <= end && t.status !== 'Completed';
                        });
                        if (!active) return null;
                        return (
                    <div className="w-full">
                            <FocusTimerWidget
                                tasks={tasks}
                                healthData={healthData}
                                onStartFocusMode={handleStartFocusMode}
                                activeTheme={activeTheme}
                                activeFocusBackground={activeFocusBackground}
                                purchasedRewards={purchasedRewards}
                            />
                    </div>
                        );
                    })()}

                </motion.div>
            </div>
        </motion.div>
        </>
    );
};

export default SoenDashboard;

// Separate right-column widget for Mira Daily with outside-click collapse
function MiraDailyPanel({ tasks, notes, healthData, onClose, setScreen, navigateToScheduleDate }: {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    onClose: () => void;
    setScreen: (s: Screen) => void;
    navigateToScheduleDate: (d: Date, taskId?: number) => void;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [showDetailed, setShowDetailed] = useState(false);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const today = new Date();
    const todayTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today.toDateString());
    const todayMeetings = todayTasks.filter(t => 
        t.category.toLowerCase().includes('meeting') || 
        t.title.toLowerCase().includes('meeting') ||
        t.title.toLowerCase().includes('call') ||
        t.title.toLowerCase().includes('zoom') ||
        t.title.toLowerCase().includes('conference')
    );

    // Find related notes for meetings
    const getMeetingNotes = (meeting: Task) => {
        return notes.filter(n => {
            const title = (n.title || '').toLowerCase();
            const content = (n.content || '').toLowerCase();
            const meetingTitle = meeting.title.toLowerCase();
            return title.includes(meetingTitle) || 
                   content.includes(meetingTitle) ||
                   title.includes('meeting') && meetingTitle.includes(title.split(' ')[0]);
        });
    };

    const openMira = () => {
        const context = {
            date: today.toISOString(),
            counts: { tasks: todayTasks.length, meetings: todayMeetings.length },
            sampleTitles: todayTasks.slice(0, 5).map(t => t.title),
            meetings: todayMeetings.map(m => ({
                title: m.title,
                time: new Date(m.startTime).toISOString(),
                hasNotes: getMeetingNotes(m).length > 0
            }))
        };
        try { localStorage.setItem('soen-mira-transfer-context', JSON.stringify(context)); } catch {}
        setScreen('Mira');
    };

    const openMeetingPrep = (meeting: Task) => {
        const meetingNotes = getMeetingNotes(meeting);
        const context = {
            meeting: {
                title: meeting.title,
                time: new Date(meeting.startTime).toISOString(),
                duration: meeting.plannedDuration
            },
            notes: meetingNotes.map(n => ({
                title: n.title,
                content: n.content?.substring(0, 500)
            })),
            hasPrepNotes: meetingNotes.length > 0
        };
        try { localStorage.setItem('soen-mira-transfer-context', JSON.stringify(context)); } catch {}
        setScreen('Mira');
    };

    return (
        <div ref={panelRef} className="rounded-3xl p-6" style={{ backgroundColor: '#06B6D4', color: '#fff' }}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold">Mira Daily</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={openMira} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Chat with Mira</button>
                    {/* Minimal expand/collapse icon button */}
                    <button onClick={() => setShowDetailed(!showDetailed)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" aria-label="Toggle details">
                        {showDetailed ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6v6M20 10h-6V4M4 10h6V4M20 14h-6v6"/></svg>
                        ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h6V2M20 16h-6v6M4 16h6v6M20 8h-6V2"/></svg>
                        )}
                    </button>
                    <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" aria-label="Close Mira Daily">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-sm text-white/80">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs">Energy: {healthData.energyLevel || 'High'}</span>
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs">Sleep: {healthData.avgSleepHours?.toFixed(0) || '7'}h</span>
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs">Tasks: {todayTasks.length}</span>
                </div>
            </div>

            {/* Dynamic KPI Bars - Context-aware */}
            {(() => {
                const userContext = (() => {
                    try {
                        const lifestyle = localStorage.getItem('soen-lifestyle-profile') || 'general';
                        const travelMode = localStorage.getItem('soen-travel-mode') === 'true';
                        const sickMode = localStorage.getItem('soen-sick-mode') === 'true';
                        return { lifestyle, travelMode, sickMode };
                    } catch {
                        return { lifestyle: 'general', travelMode: false, sickMode: false };
                    }
                })();
                
                const hasWorkout = todayTasks.some(t => 
                    t.category.toLowerCase().includes('workout') || 
                    t.category.toLowerCase().includes('exercise') || 
                    t.category.toLowerCase().includes('gym')
                );
                const hasMeetings = todayMeetings.length > 0;
                
                // Calculate dynamic KPIs based on context
                let focusLevel = 75;
                let recoveryLevel = 60;
                let focusLabel = 'Focus';
                let recoveryLabel = 'Recovery';
                
                if (userContext.sickMode) {
                    focusLevel = 30; // Lower focus when sick
                    recoveryLevel = 90; // High recovery priority
                    recoveryLabel = 'Recovery Priority';
                } else if (userContext.travelMode) {
                    focusLevel = 50; // Lower focus during travel
                    recoveryLevel = 70;
                    focusLabel = 'Travel Energy';
                } else if (hasWorkout && !hasMeetings) {
                    focusLevel = 85; // High focus on workout days
                    recoveryLevel = 40; // Lower recovery (needs post-workout recovery)
                    recoveryLabel = 'Pre-Workout Energy';
                } else if (hasMeetings && hasWorkout) {
                    focusLevel = 70; // Balanced for hybrid days
                    recoveryLevel = 55;
                } else if (hasMeetings) {
                    focusLevel = 65; // Meetings can drain focus
                    recoveryLevel = 60;
                }
                
                return (
                    <div className="mb-4 space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                <span>{focusLabel}</span>
                                <span>{focusLevel}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full">
                                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{width:`${focusLevel}%`}}/>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                <span>{recoveryLabel}</span>
                                <span>{recoveryLevel}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full">
                                <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{width:`${recoveryLevel}%`}}/>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Meetings Today - Enhanced with note linking and prep */}
            {todayMeetings.length > 0 && (
                <div className="mt-4 mb-4">
                    <h4 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Meetings Today ({todayMeetings.length})
                    </h4>
                    <div className="space-y-2">
                        {todayMeetings.map(meeting => {
                            const meetingNotes = getMeetingNotes(meeting);
                            const url = (meeting.linkedUrl || meeting.referenceUrl || '').toString();
                            let domain = '';
                            try { domain = url ? new URL(url).hostname : ''; } catch {}
                            const isUpcoming = new Date(meeting.startTime) > new Date();
                            const minutesUntil = isUpcoming ? Math.round((new Date(meeting.startTime).getTime() - new Date().getTime()) / 60000) : null;
                            
                            return (
                                <div key={`meet-${meeting.id}`} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                                                {domain ? (
                                                    <img alt="logo" src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} className="w-5 h-5"/>
                                                ) : (
                                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm truncate">{meeting.title}</div>
                                                <div className="text-xs text-white/70 mt-0.5">
                                                    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {minutesUntil !== null && minutesUntil > 0 && (
                                                        <span className="ml-2 text-emerald-400">in {minutesUntil}m</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Meeting prep indicators */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {meetingNotes.length > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                                                <DocumentTextIcon className="w-3 h-3" />
                                                <span>{meetingNotes.length} prep note{meetingNotes.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                        {!meetingNotes.length && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs">
                                                <SparklesIcon className="w-3 h-3" />
                                                <span>Needs prep</span>
                                            </div>
                                        )}
                                        {url && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                <span>Link</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick actions */}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => {
                                                navigateToScheduleDate(new Date(meeting.startTime), meeting.id);
                                                setScreen('Schedule');
                                            }}
                                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex-1"
                                        >
                                            Open Meeting
                                        </button>
                                        {meetingNotes.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setScreen('Notes');
                                                    // Could set selected note here if we had that prop
                                                }}
                                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs"
                                            >
                                                View Notes
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openMeetingPrep(meeting)}
                                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                                        >
                                            Prep with Mira
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Other Tasks - Non-meeting tasks */}
            <div className="mt-4">
                <h4 className="text-xs font-semibold text-white/80 mb-2">
                    {todayMeetings.length > 0 ? 'Other Tasks' : 'Suggested Actions'}
                </h4>
                <div className="space-y-2">
                    {todayTasks
                        .filter(t => !todayMeetings.includes(t))
                        .slice(0, todayMeetings.length > 0 ? 3 : 6)
                        .map(t => (
                        <div key={`sug-${t.id}`} className="p-3 rounded-xl bg-white/5 text-sm flex items-center justify-between">
                            <div className="truncate mr-3">{t.title}</div>
                            <button
                                onClick={() => {
                                    navigateToScheduleDate(new Date(t.startTime), t.id);
                                    setScreen('Schedule');
                                }}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                            >Open</button>
                        </div>
                    ))}
                    {todayTasks.filter(t => !todayMeetings.includes(t)).length === 0 && todayMeetings.length > 0 && (
                        <div className="p-3 rounded-xl bg-white/5 text-white/70 text-xs">No other tasks today.</div>
                    )}
                    {todayTasks.length === 0 && (
                        <div className="p-3 rounded-xl bg-white/5 text-white/70 text-xs">No tasks today. Ask Mira for a plan.</div>
                    )}
                </div>
            </div>

            {showDetailed && (
                <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                    <h4 className="text-xs font-semibold text-white/80">Detailed Insights</h4>
                    {todayTasks.slice(0, 5).map(t => {
                        const matchingNote = notes.find(n => (n.title || '').toLowerCase().includes(t.title.toLowerCase()) || (n.content || '').toLowerCase().includes(t.title.toLowerCase()));
                        return (
                            <div key={`det-${t.id}`} className="p-3 rounded-xl bg-white/5">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-semibold truncate mr-2">{t.title}</div>
                                    <div className="text-white/60 text-xs">{new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                {matchingNote && (
                                    <div className="mt-1 text-xs text-white/80 line-clamp-2">{matchingNote.content?.substring(0, 140) || ''}</div>
                                )}
                                {!matchingNote && (
                                    <div className="mt-1 text-xs text-white/60">No linked notes found. Ask Mira to prepare notes.</div>
                                )}
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => { navigateToScheduleDate(new Date(t.startTime)); setScreen('Schedule'); }} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs">Open task</button>
                                    <button onClick={openMira} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs">Refine with Mira</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}