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
 * 
 * CRITICAL TEXT CONTRAST RULESET:
 * - Text must ALWAYS be clearly visible and readable against its background
 * - For dark backgrounds (luminance < 0.5): ALWAYS use white text (#ffffff or #f0f0f0) with text shadows
 * - For light backgrounds (luminance >= 0.5): ALWAYS use black/dark text (#000000 or #1a1a1a)
 * - Minimum contrast ratio: 4.5:1 for normal text (WCAG AA compliance)
 * - Use text shadows (textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)') on white text over dark backgrounds
 * - Never use white text on light backgrounds or black text on dark backgrounds
 * - Test all text visibility before committing changes
 * - If in doubt, use ensureTextContrast() helper function to validate contrast
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen, TaskStatus } from '../types';
import { safeGet } from '../utils/validation';
import { 
    CheckCircleIcon, SparklesIcon, HeartIcon, BoltIcon, ClockIcon, 
    SunIcon, ChevronLeftIcon, ChevronRightIcon, BrainCircuitIcon, PlusIcon,
    CalendarDaysIcon, DocumentTextIcon, ActivityIcon, ArrowTrendingUpIcon,
    FlagIcon, StarIcon, BoltIcon as ZapIcon, CalendarIcon,
    ArrowRightIcon, CheckIcon, PencilIcon, TrashIcon
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
    navigateToScheduleDate: (date: Date) => void;
    inferredLocation: string | null;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number) => void;
    soenFlow?: number;
    purchasedRewards?: string[];
    activeTheme?: string;
    activeFocusBackground?: string;
}

// Enhanced color scheme matching EnhancedDashboard
const SOEN_COLORS = {
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

// CRITICAL RULESET: Ensure text contrast is always maintained
// This function calculates contrast ratio and ensures WCAG AA compliance (4.5:1 for normal text)
const ensureTextContrast = (backgroundColor: string, textColor: 'black' | 'white'): string => {
    // For dark backgrounds (luminance < 0.5), always use white text
    // For light backgrounds (luminance >= 0.5), always use black text
    if (!backgroundColor.startsWith('#')) return textColor;
    
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If background is dark (luminance < 0.5), force white text
    if (luminance < 0.5 && textColor === 'black') {
        console.warn('Text contrast violation: Dark background detected but black text specified. Forcing white text.');
        return 'white';
    }
    
    // If background is light (luminance >= 0.5), force black text
    if (luminance >= 0.5 && textColor === 'white') {
        console.warn('Text contrast violation: Light background detected but white text specified. Forcing black text.');
        return 'black';
    }
    
    return textColor;
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
const GhibliPenguin: React.FC = () => {
    return (
        <motion.div
            className="relative w-full h-full"
            animate={{ 
                rotate: [0, 3, -3, 0],
                scale: [1, 1.05, 1],
                y: [0, -3, 0]
            }}
            transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
            }}
        >
            {/* Penguin Body - More rounded and cute */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 30%, #4a5568 70%, #2d3748 100%)',
                    boxShadow: `
                        inset 0 3px 6px rgba(255,255,255,0.15),
                        inset 0 -3px 6px rgba(0,0,0,0.4),
                        0 6px 16px rgba(0,0,0,0.5),
                        0 0 0 2px rgba(255,255,255,0.2)
                    `,
                    transform: 'perspective(120px) rotateX(10deg) rotateY(-3deg)'
                }}
            >
                {/* Penguin Belly - Larger and more prominent */}
                <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-7 h-6 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(255,255,255,0.3)'
                    }}
                />
                
                {/* Big Cute Eyes - Much larger and more expressive */}
                <div 
                    className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                <div 
                    className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                
                {/* Eye pupils - Larger and more engaging */}
                <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                
                {/* Eye highlights - Sparkle effect */}
                <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                
                {/* Cute Smiley Face - Curved smile */}
                <svg 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-2"
                    viewBox="0 0 12 8"
                    style={{ fill: 'none', stroke: '#2d3748', strokeWidth: '1.5', strokeLinecap: 'round' }}
                >
                    <path d="M2 4 Q6 6 10 4" />
                </svg>
                
                {/* Penguin Beak - Smaller and cuter */}
                <div 
                    className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-1 h-0.8 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                    }}
                />
                
                {/* Enhanced Cheek blush - More prominent */}
                <div 
                    className="absolute top-4 left-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
                />
                <div 
                    className="absolute top-4 right-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
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

// Soen Header Component with Studio Ghibli Penguin - Only visible at top of dashboard
const SoenHeader: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);
            // Hide when scrolled down more than 100px
            setIsVisible(currentScrollY < 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.div
            className="fixed top-3 left-3 sm:top-4 sm:left-20 z-50 pointer-events-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
                opacity: isVisible ? 1 : 0,
                x: 0,
                y: scrollY > 100 ? -20 : 0
            }}
            transition={{ duration: 0.3 }}
            style={{ position: 'fixed' }}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10">
                <GhibliPenguin />
                </div>
                <span className="font-bold text-lg sm:text-2xl text-white">Soen</span>
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
            className="rounded-2xl p-6 relative overflow-hidden min-h-[420px] h-full"
            style={{ 
                backgroundColor: currentTasks.length > 0 ? (categoryColors[currentTasks[0].category] || '#10b981') : '#10b981',
                color: 'white'
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
                    <h3 className="text-2xl font-bold font-display text-white">Tasks</h3>
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
                                        color: 'white'
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
                                            <span className="text-xl font-bold block truncate text-white">{task.title}</span>
                                            <span className="text-sm text-white/80">
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
                                                color: 'white'
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
                                                color: 'white'
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
                                <CalendarIcon className="w-12 h-12 text-white/60 mx-auto mb-4" />
                                <p className="text-sm text-white/80">
                                    No tasks scheduled for {activeView === 'today' ? 'today' : 'tomorrow'}
                                </p>
                            </div>
                        )}
                        
                        {currentTasks.length > 4 && (
                            <div className="text-center pt-2">
                                <p className="text-xs text-white/70">+{currentTasks.length - 4} more tasks</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


// Revolutionary Habit Widget with Individual Habit Management
const HabitInsights: React.FC<{
    healthData: HealthData;
}> = ({ healthData }) => {
    const [habits, setHabits] = useState([
        { 
            id: 1, 
            name: 'Morning Routine', 
            streak: 7, 
            color: '#10b981', 
            icon: SunIcon, 
            frequency: 'daily', 
            selected: false,
            editing: false,
            viewMode: '7day' as '7day' | '30day',
            completionData: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                completed: Math.random() > 0.3,
                intensity: Math.random()
            }))
        },
        { 
            id: 2, 
            name: 'Exercise', 
            streak: 5, 
            color: '#3b82f6', 
            icon: ActivityIcon, 
            frequency: 'daily', 
            selected: false,
            editing: false,
            viewMode: '7day' as '7day' | '30day',
            completionData: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                completed: Math.random() > 0.4,
                intensity: Math.random()
            }))
        },
        { 
            id: 3, 
            name: 'Meditation', 
            streak: 3, 
            color: '#f59e0b', 
            icon: BrainCircuitIcon, 
            frequency: 'daily', 
            selected: false,
            editing: false,
            viewMode: '7day' as '7day' | '30day',
            completionData: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                completed: Math.random() > 0.5,
                intensity: Math.random()
            }))
        },
        { 
            id: 4, 
            name: 'Reading', 
            streak: 12, 
            color: '#8b5cf6', 
            icon: DocumentTextIcon, 
            frequency: 'daily', 
            selected: false,
            editing: false,
            viewMode: '7day' as '7day' | '30day',
            completionData: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                completed: Math.random() > 0.2,
                intensity: Math.random()
            }))
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
                icon: selectedIcon,
                frequency: 'flexible',
                selected: false,
                editing: false,
                viewMode: '7day' as '7day' | '30day',
                completionData: Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    completed: false,
                    intensity: 0
                }))
            };
            setHabits([...habits, newHabit]);
            setNewHabitName('');
            setIsAddingHabit(false);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectHabit = (habitId: number) => {
        setHabits(habits.map(h => {
            if (h.id !== habitId) return h;
            // When opening, default to 30-day view and exit editing mode
            if (!h.selected) {
                return { ...h, selected: true, viewMode: '30day', editing: false };
            }
            // When closing, just toggle selected
            return { ...h, selected: false };
        }));
    };

    const handleEditHabit = (habitId: number, newName: string) => {
        setHabits(habits.map(h => h.id === habitId ? { ...h, name: newName, editing: false } : h));
    };

    const handleDeleteHabit = (habitId: number) => {
        setHabits(habits.filter(h => h.id !== habitId));
    };

    const handleToggleEdit = (habitId: number) => {
        setHabits(habits.map(h => h.id === habitId ? { ...h, editing: !h.editing } : h));
    };

    const handleViewModeChange = (habitId: number, mode: '7day' | '30day') => {
        setHabits(habits.map(h => h.id === habitId ? { ...h, viewMode: mode } : h));
    };

    const handleToggleCompletion = (habitId: number, dayIndex: number) => {
        setHabits(habits.map(h => {
            if (h.id === habitId) {
                const newData = [...h.completionData];
                newData[dayIndex] = {
                    ...newData[dayIndex],
                    completed: !newData[dayIndex].completed,
                    intensity: newData[dayIndex].completed ? 0 : Math.random()
                };
                return { ...h, completionData: newData };
            }
            return h;
        }));
    };

    const getCompletionRate = (habit: any) => {
        const days = habit.viewMode === '7day' ? 7 : 30;
        const relevantData = habit.completionData.slice(0, days);
        const completed = relevantData.filter(d => d.completed).length;
        return Math.round((completed / days) * 100);
    };

    const getStreakCount = (habit: any) => {
        const days = habit.viewMode === '7day' ? 7 : 30;
        const relevantData = habit.completionData.slice(0, days);
        let streak = 0;
        for (let i = relevantData.length - 1; i >= 0; i--) {
            if (relevantData[i].completed) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    const isNegativeHabit = (name: string) => {
        const n = name.trim().toLowerCase();
        return n.startsWith('stop ') || n.startsWith("don't ") || n.startsWith('do not ') || n.startsWith('no ');
    };

    // Enhanced magical color progression based on time (changes every 2 hours)
    const widgetColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#a8edea', '#fed6e3'];
    const currentHour = new Date().getHours();
    const colorIndex = Math.floor(currentHour / 2) % widgetColors.length;
    const smartColor = widgetColors[colorIndex];

    return (
        <motion.div
            className="rounded-2xl p-4 relative overflow-hidden h-full min-h-[420px]"
            style={{ 
                backgroundColor: smartColor,
                color: 'white'
            }}
            variants={itemVariants}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute -top-20 -left-20 w-60 h-60 rounded-full"
                    style={{ background: 'radial-gradient(circle at 30% 30%, #10b98120, transparent 60%)' }}
                    animate={{ 
                        x: [0, 20, -15, 0], 
                        y: [0, -15, 10, 0],
                        scale: [1, 1.1, 0.9, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle at 70% 70%, #3b82f620, transparent 60%)' }}
                    animate={{ 
                        x: [0, -25, 15, 0], 
                        y: [0, 20, -12, 0],
                        scale: [1, 0.9, 1.1, 1]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, #8b5cf615, transparent 70%)' }}
                    animate={{ 
                        scale: [0.8, 1.2, 0.8],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                <motion.div
                        animate={{ 
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <FlagIcon className="w-7 h-7 text-emerald-400 drop-shadow-lg" />
                </motion.div>
                    <h3 className="text-xl font-bold font-display text-white">
                        Habits
                    </h3>
                </div>
                <motion.button
                    onClick={() => setIsAddingHabit(true)}
                    className="p-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <PlusIcon className="w-5 h-5 text-emerald-400" />
                </motion.button>
            </div>

            {/* Add Habit Form */}
            {isAddingHabit && (
                <motion.div
                    className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10"
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                >
                    <div className="relative">
                    <input
                        type="text"
                        value={newHabitName}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="Type a habit or choose from suggestions..."
                            className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 outline-none focus:border-emerald-400/50 transition-colors"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                        autoFocus
                    />
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden z-50"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {suggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={suggestion}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full p-3 text-left text-white hover:bg-white/10 transition-colors"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        {suggestion}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                    <div className="flex gap-3 mt-3">
                        <motion.button
                            onClick={handleAddHabit}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-lg font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Add Habit
                        </motion.button>
                        <motion.button
                            onClick={() => setIsAddingHabit(false)}
                            className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Individual Habit Cards */}
            <div className="space-y-4 relative z-10">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.id}
                        className="group rounded-xl p-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/10 cursor-pointer"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={() => handleSelectHabit(habit.id)}
                    >
                        {/* Habit Header */}
                        <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <motion.div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${habit.color}20` }}
                                    whileHover={{ rotate: 15, scale: 1.1 }}
                            >
                                    <habit.icon className="w-5 h-5" style={{ color: habit.color }} />
                            </motion.div>
                            <div>
                                    {habit.editing ? (
                                        <input
                                            type="text"
                                            value={habit.name}
                                            onChange={(e) => setHabits(habits.map(h => h.id === habit.id ? { ...h, name: e.target.value } : h))}
                                            className="bg-transparent border-none outline-none text-white font-semibold"
                                            onBlur={() => handleEditHabit(habit.id, habit.name)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleEditHabit(habit.id, habit.name)}
                                            autoFocus
                                        />
                                    ) : (
                                        <span 
                                            className="text-lg font-bold text-white cursor-pointer hover:text-emerald-200 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleEdit(habit.id);
                                            }}
                                        >
                                            {habit.name}
                                        </span>
                                    )}
                                    <div className="text-sm text-white/80">
                                        {habit.frequency} • {getStreakCount(habit)} day streak
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View Mode Buttons - Always Visible */}
                            <div className="flex gap-1">
                                <motion.button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleViewModeChange(habit.id, '7day');
                                    }}
                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                                        habit.viewMode === '7day' 
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    7D
                                </motion.button>
                                <motion.button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleViewModeChange(habit.id, '30day');
                                    }}
                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                                        habit.viewMode === '30day' 
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    30D
                                </motion.button>
                        </div>
                            
                            {habit.selected && (
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHabit(habit.id);
                                    }}
                                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                </motion.button>
                            )}
                        </div>
            </div>

                        {/* Collapsible Content */}
                        {habit.selected && (
                <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Repeat Options - only visible in Edit mode */}
                                {habit.editing && (
                                    <div className="mb-4">
                                        <h5 className="text-sm font-semibold text-white/90 mb-2">Repeat Frequency</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {['daily', 'weekly', 'monthly', 'flexible'].map((freq) => (
                        <motion.button
                                                    key={freq}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setHabits(habits.map(h => h.id === habit.id ? { ...h, frequency: freq } : h));
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                        habit.frequency === freq 
                                                            ? 'bg-emerald-500 text-white' 
                                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                                </motion.button>
                                            ))}
                                        </div>
                                        {habit.frequency === 'flexible' && (
                                            <div className="mt-3">
                                                <label className="text-xs text-white/80 mb-1 block">Custom Repeat (times per day)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    defaultValue="1"
                                                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 outline-none focus:border-emerald-400/50 transition-colors text-sm"
                                                    placeholder="Enter number of repeats"
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 1;
                                                        setHabits(habits.map(h => h.id === habit.id ? { ...h, customRepeat: value } : h));
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View Toggle Pills - only visible in Edit mode */}
                                {habit.editing && (
                                    <div className="flex gap-2 mb-3">
                                        <motion.button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleViewModeChange(habit.id, '7day');
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                habit.viewMode === '7day' 
                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            7 Days
                        </motion.button>
                        <motion.button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleViewModeChange(habit.id, '30day');
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                habit.viewMode === '30day' 
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            30 Days
                        </motion.button>
                    </div>
                                )}

                                {/* Progress Visualization - Premium Design */}
                                <div className="mb-3">
                                    <div className="grid gap-2 p-3 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                                        <div className={`grid gap-1.5 ${habit.viewMode === '7day' ? 'grid-cols-7' : 'grid-cols-6'}`}>
                                            {habit.completionData.slice(0, habit.viewMode === '7day' ? 7 : 30).map((day, dayIndex) => (
                            <motion.div
                                                    key={dayIndex}
                                                    className={`relative rounded-xl cursor-pointer transition-all duration-200 ${
                                                        day.completed 
                                                            ? 'shadow-lg ring-2 ring-white/20' 
                                                            : 'hover:bg-white/5'
                                                    }`}
                                                    style={{
                                                        backgroundColor: day.completed 
                                                            ? (isNegativeHabit(habit.name) ? '#ef4444' : habit.color)
                                                            : 'rgba(255,255,255,0.08)',
                                                        width: habit.viewMode === '7day' ? 32 : 24,
                                                        height: habit.viewMode === '7day' ? 32 : 24,
                                                        minWidth: habit.viewMode === '7day' ? 32 : 24,
                                                        minHeight: habit.viewMode === '7day' ? 32 : 24
                                                    }}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: dayIndex * 0.02, duration: 0.3 }}
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleToggleCompletion(habit.id, dayIndex);
                                                    }}
                                                >
                                                    {day.completed && (
                                                        <motion.div
                                                            className="absolute inset-0 flex items-center justify-center"
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: dayIndex * 0.02 + 0.1 }}
                                                        >
                                                            <CheckIcon className={`${habit.viewMode === '7day' ? 'w-4 h-4' : 'w-3 h-3'} text-white drop-shadow-lg`} />
                                                        </motion.div>
                                                    )}
                                                    {!day.completed && (
                                                        <motion.div
                                                            className="absolute inset-0 flex items-center justify-center"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 0.3 }}
                                                        >
                                                            <div className={`${habit.viewMode === '7day' ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-white/40`} />
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Habit Toggle */}
                                <div className="mt-4 flex justify-end">
                                    <motion.button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setHabits(habits.map(h => h.id === habit.id ? { ...h, editing: !h.editing } : h));
                                        }}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {habit.editing ? 'Done' : 'Edit Habit'}
                                    </motion.button>
                    </div>

                    {/* Habit Stats */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                    <div className="text-center">
                                            <div className="font-bold text-emerald-400">{getStreakCount(habit)}</div>
                                            <div className="text-xs text-white/70">Streak</div>
                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-blue-400">{getCompletionRate(habit)}%</div>
                                            <div className="text-xs text-white/70">Complete</div>
                        </div>
                                    </div>
                                    <motion.div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${habit.color}20` }}
                                        animate={{ 
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: habit.color }}
                                        />
                                    </motion.div>
            </div>
                </motion.div>
            )}
                    </motion.div>
                ))}
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
            className="rounded-2xl p-6 relative overflow-hidden min-h-[420px] h-full"
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

                {/* Pomodoro Stats */}
                <div className="flex justify-center gap-6 mb-6">
                    <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">{pomodoroStreak}</div>
                        <div className="text-xs text-white/60">Day Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{completedSessions}</div>
                        <div className="text-xs text-white/60">Sessions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">+{sessionPoints}</div>
                        <div className="text-xs text-white/60">Points Today</div>
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




// Hollywood-Level Daily Greeting with Integrated Weather, Health, and SOEN Rewards
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
    soenFlow?: number;
    purchasedRewards?: string[];
    activeTheme?: string;
    activeFocusBackground?: string;
}> = ({ tasks, categoryColors, healthData, briefing, isBriefingLoading, notes, onCompleteTask, navigateToScheduleDate, setScreen, canCompleteTasks, soenFlow = 500, purchasedRewards = [], activeTheme = 'obsidian', activeFocusBackground = 'synthwave' }) => {
    const today = new Date();
    const todayTasks = tasks.filter(t => 
        new Date(t.startTime).toDateString() === today.toDateString()
    );
    
    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

    // Dynamic greeting based on time (changes every 6 hours) and task completion
    const getGreeting = () => {
        const now = new Date();
        const hour = now.getHours();
        const sixHourBlock = Math.floor(hour / 6);
        
        // Check task completion status
        const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
        const allCompleted = completedToday === todayTasks.length && todayTasks.length > 0;
        const hasTasks = todayTasks.length > 0;
        
        // Time-based greetings (change every 6 hours)
        let timeGreeting = '';
        if (sixHourBlock === 0) timeGreeting = 'Good Morning'; // 0-5
        else if (sixHourBlock === 1) timeGreeting = 'Good Afternoon'; // 6-11
        else if (sixHourBlock === 2) timeGreeting = 'Good Evening'; // 12-17
        else timeGreeting = 'Good Night'; // 18-23
        
        // Task-based modifications
        if (allCompleted) {
            return `${timeGreeting}, Mission Complete!`;
        } else if (completionRate >= 80 && hasTasks) {
            return `${timeGreeting}, Almost There!`;
        } else if (completionRate >= 50 && hasTasks) {
            return `${timeGreeting}, Great Progress!`;
        } else if (completedToday > 0 && hasTasks) {
            return `${timeGreeting}, Keep Going!`;
        }
        
        return timeGreeting;
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

    // SOEN Rewards Integration - Extract logic from SoenRewardsWidget
    const [currentPoints, setCurrentPoints] = useState(0);
    const [level, setLevel] = useState(1);
    const [showRewardsDetail, setShowRewardsDetail] = useState(false);

    const themes = [
        { id: 'theme-obsidian', name: 'Obsidian Flow', cost: 0, unlocked: true, colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'] },
        { id: 'theme-synthwave', name: 'Synthwave Sunset', cost: 150, unlocked: purchasedRewards.includes('theme-synthwave'), colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444'] },
        { id: 'theme-solarpunk', name: 'Solarpunk Dawn', cost: 150, unlocked: purchasedRewards.includes('theme-solarpunk'), colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981'] },
        { id: 'theme-luxe', name: 'Luxe Marble', cost: 250, unlocked: purchasedRewards.includes('theme-luxe'), colors: ['#fde047', '#eab308', '#f59e0b', '#d97706'] },
        { id: 'theme-aurelian', name: 'Aurelian Gold', cost: 300, unlocked: purchasedRewards.includes('theme-aurelian'), colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'] },
        { id: 'theme-crimson', name: 'Crimson Fury', cost: 200, unlocked: purchasedRewards.includes('theme-crimson'), colors: ['#f87171', '#dc2626', '#b91c1c', '#991b1b'] },
        { id: 'theme-oceanic', name: 'Oceanic Depth', cost: 200, unlocked: purchasedRewards.includes('theme-oceanic'), colors: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'] }
    ];

    const focusBackgrounds = [
        { id: 'focus-synthwave', name: 'Synthwave Sunset', cost: 100, unlocked: purchasedRewards.includes('focus-synthwave'), colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444'] },
        { id: 'focus-lofi', name: 'Lofi Rain', cost: 100, unlocked: purchasedRewards.includes('focus-lofi'), colors: ['#4f46e5', '#1e293b', '#334155', '#475569'] },
        { id: 'focus-solarpunk', name: 'Solarpunk Garden', cost: 150, unlocked: purchasedRewards.includes('focus-solarpunk'), colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981'] }
    ];

    const roundToNearestFiveOrZero = (points: number): number => {
        const rounded = Math.round(points);
        const remainder = rounded % 5;
        if (remainder === 0) return rounded;
        return rounded + (remainder <= 2 ? -remainder : 5 - remainder);
    };

    const getPriorityMultiplier = (task: Task): number => {
        const categoryWeights: Record<string, number> = {
            'Deep Work': 2.0, 'Learning': 1.8, 'Prototyping': 1.6, 'Meeting': 1.2,
            'Workout': 1.4, 'Editing': 1.3, 'Personal': 1.1, 'Admin': 0.8
        };
        return categoryWeights[task.category] || 1.0;
    };

    const getHealthImpact = (basePoints: number): number => {
        const energyLevel = healthData.energyLevel || 'medium';
        const sleepQuality = healthData.sleepQuality || 'good';
        let multiplier = 1.0;
        if (energyLevel === 'low') multiplier *= 0.7;
        else if (energyLevel === 'high') multiplier *= 1.1;
        if (sleepQuality === 'poor') multiplier *= 0.8;
        else if (sleepQuality === 'good') multiplier *= 1.1;
        return roundToNearestFiveOrZero(basePoints * multiplier);
    };

    const checkPomodoroCompletion = (taskId: number): boolean => {
        return Math.random() > 0.3;
    };

    const getPomodoroStreakBonus = (): number => {
        const streak = Math.floor(Math.random() * 10) + 1;
        if (streak >= 30) return 30;
        if (streak >= 14) return 20;
        if (streak >= 7) return 10;
        return 0;
    };

    useEffect(() => {
        const calculateFlowPoints = async () => {
            const completedTasks = tasks.filter(t => t.status === 'Completed');
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
            
            let totalPoints = 0;
            let dailyPoints = 0;
            
            for (const task of completedTasks) {
                let taskPoints = 10;
                const priorityMultiplier = getPriorityMultiplier(task);
                taskPoints *= priorityMultiplier;
                const healthImpact = getHealthImpact(taskPoints);
                taskPoints = healthImpact;
                const pomodoroBonus = checkPomodoroCompletion(task.id) ? 5 : 0;
                taskPoints += pomodoroBonus;
                dailyPoints += taskPoints;
            }
            
            dailyPoints = Math.min(dailyPoints, 100);
            const streakBonus = getPomodoroStreakBonus();
            dailyPoints += streakBonus;
            const completionBonus = roundToNearestFiveOrZero(completionRate * 0.5);
            dailyPoints += completionBonus;
            totalPoints = roundToNearestFiveOrZero(dailyPoints);
            const newLevel = Math.floor(totalPoints / 500) + 1;
            
            setCurrentPoints(totalPoints);
            setLevel(newLevel);
        };

        calculateFlowPoints();
    }, [tasks, healthData]);

    const nextLevelPoints = level * 500;
    const insights = {
        unlockedThemes: themes.filter(t => t.unlocked).length,
        unlockedBackgrounds: focusBackgrounds.filter(b => b.unlocked).length
    };

    // Geolocation state
    const [location, setLocation] = useState<{ city: string; temp: number; condition: string } | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        maximumAge: 600000,
                        timeout: 8000,
                        enableHighAccuracy: false
                    });
                });

                const { latitude, longitude } = position.coords;

                // Fetch weather
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
                );

                if (weatherResponse.ok) {
                    const weatherResult = await weatherResponse.json();
                    const weatherCode = weatherResult.current?.weather_code || 0;
                    const temperature = Math.round(weatherResult.current?.temperature_2m || 0);

                    // Get location name
                    let cityName = 'Unknown Location';
                    try {
                        const geoResponse = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                        );
                        if (geoResponse.ok) {
                            const geoResult = await geoResponse.json();
                            cityName = geoResult.city || geoResult.locality || 'Unknown Location';
                        }
                    } catch (e) {
                        console.warn('Geocoding failed:', e);
                    }

                    const getCondition = (code: number): string => {
                        if (code === 0) return 'Sunny';
                        if (code <= 3) return 'Partly Cloudy';
                        if (code <= 48) return 'Cloudy';
                        if (code <= 67) return 'Rainy';
                        if (code <= 77) return 'Snowy';
                        return 'Sunny';
                    };

                    setLocation({
                        city: cityName,
                        temp: temperature,
                        condition: getCondition(weatherCode)
                    });
                }
            } catch (error) {
                console.error('Weather fetch error:', error);
                setLocation({ city: 'Unknown', temp: 0, condition: 'Sunny' });
            } finally {
                setWeatherLoading(false);
            }
        };

        fetchWeather();
    }, []);

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl p-4 md:p-6"
            style={{ 
                // Dark background with high contrast for white text readability
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff' // Explicit white text for maximum contrast
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
            {/* Subtle floating particles - reduced opacity for better text readability */}
            <div className="absolute inset-0">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/10 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0, 0.3, 0],
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
            
            {/* Dark overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
                {/* Top Section: Greeting, Weather, Rewards, and Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* Left: Greeting and Quote */}
                    <div className="lg:col-span-2 text-center lg:text-left">
                        <motion.h1 
                            className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
                            style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            {getGreeting()}, <span className="text-emerald-400" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>Pratt</span>
                        </motion.h1>
                        <motion.div
                            className="text-sm md:text-base italic max-w-2xl leading-relaxed mb-4"
                            style={{ color: '#f0f0f0', textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            "{todayQuote}"
                        </motion.div>
                    </div>

                    {/* Right: Weather, Rewards, and Health */}
                    <div className="flex flex-col gap-3">
                        {/* Weather */}
                        <motion.div
                            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <SunIcon className="w-6 h-6 text-yellow-400" />
                            </motion.div>
                            <div>
                                {weatherLoading ? (
                                    <>
                                        <div className="text-lg font-bold" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>...</div>
                                        <div className="text-xs" style={{ color: '#e0e0e0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Loading...</div>
                                    </>
                                ) : location ? (
                                    <>
                                        <div className="text-lg font-bold" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>{location.temp}°C</div>
                                        <div className="text-xs" style={{ color: '#e0e0e0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{location.city}</div>
                                        <div className="text-xs" style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{location.condition}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-lg font-bold" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>--°C</div>
                                        <div className="text-xs" style={{ color: '#e0e0e0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Location unavailable</div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* SOEN Rewards - Clickable */}
                        <motion.button
                            onClick={(e) => { e.stopPropagation(); setScreen('Profile'); }}
                            className="backdrop-blur-sm rounded-xl p-3 border transition-all text-left cursor-pointer"
                            style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 flex-shrink-0">
                                    <GhibliPenguin />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>SOEN Rewards</div>
                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#e0e0e0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                                        <span>Lv {level}</span>
                                        <span>•</span>
                                        <span>{currentPoints} pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <div className="flex items-center gap-1.5">
                                    <SparklesIcon className="w-3.5 h-3.5 text-yellow-400" />
                                    <span className="text-yellow-400 font-bold text-xs" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{soenFlow}</span>
                                </div>
                                <div className="text-xs" style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                                    {insights.unlockedThemes + insights.unlockedBackgrounds} Unlocked
                                </div>
                            </div>
                        </motion.button>

                        {/* Minimal Health Data View */}
                        <motion.div
                            className="backdrop-blur-sm rounded-xl p-3 border"
                            style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 1.0 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HeartIcon className="w-4 h-4 text-red-400" />
                                <div className="text-xs font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Health</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <BoltIcon className="w-3.5 h-3.5 text-yellow-400" />
                                    <div className="flex-1">
                                        <div style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Energy</div>
                                        <div className="font-bold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{healthData.energyLevel?.charAt(0).toUpperCase() + healthData.energyLevel?.slice(1) || 'Medium'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
                                    <div className="flex-1">
                                        <div style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Sleep</div>
                                        <div className="font-bold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{healthData.avgSleepHours || 0}h</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ActivityIcon className="w-3.5 h-3.5 text-green-400" />
                                    <div className="flex-1">
                                        <div style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Activity</div>
                                        <div className="font-bold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{healthData.stepsToday ? (healthData.stepsToday >= 10000 ? 'Excellent' : healthData.stepsToday >= 5000 ? 'Good' : 'Low') : 'Good'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                                    <div className="flex-1">
                                        <div style={{ color: '#d0d0d0', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Stress</div>
                                        <div className="font-bold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{healthData.sleepQuality === 'poor' ? 'High' : healthData.sleepQuality === 'good' ? 'Low' : 'Medium'}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Next Up Section or Mission Complete - Full Width */}
                {completedToday === todayTasks.length && todayTasks.length > 0 ? (
                    <motion.div
                        className="rounded-2xl p-6 md:p-8 mt-4"
                        style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                            color: 'white'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-center">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="mb-4"
                            >
                                <CheckCircleIcon className="w-16 h-16 mx-auto text-white" />
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Mission Complete!</h2>
                            <p className="text-xl md:text-2xl mb-1">All Tasks Completed</p>
                            <p className="text-lg opacity-90">Goal Achieved</p>
                            <div className="mt-6 text-sm opacity-80">
                                <p>You've completed all {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} for today!</p>
                                <p className="mt-2">Take a moment to celebrate this achievement. 🎉</p>
                    </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="mt-4">
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

// Enhanced Gamified Soen Rewards Widget with Flow Points Integration
const SoenRewardsWidget: React.FC<{
    tasks: Task[];
    healthData: HealthData;
    soenFlow?: number;
    purchasedRewards?: string[];
    activeTheme?: string;
    activeFocusBackground?: string;
}> = ({ tasks, healthData, soenFlow = 500, purchasedRewards = [], activeTheme = 'obsidian', activeFocusBackground = 'synthwave' }) => {
    const [currentPoints, setCurrentPoints] = useState(0);
    const [level, setLevel] = useState(1);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const [showRewardsDetail, setShowRewardsDetail] = useState(false);

    // Import REWARDS_CATALOG for theme and background data
    const themes = [
        { id: 'theme-obsidian', name: 'Obsidian Flow', cost: 0, unlocked: true, colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'] },
        { id: 'theme-synthwave', name: 'Synthwave Sunset', cost: 150, unlocked: purchasedRewards.includes('theme-synthwave'), colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444'] },
        { id: 'theme-solarpunk', name: 'Solarpunk Dawn', cost: 150, unlocked: purchasedRewards.includes('theme-solarpunk'), colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981'] },
        { id: 'theme-luxe', name: 'Luxe Marble', cost: 250, unlocked: purchasedRewards.includes('theme-luxe'), colors: ['#fde047', '#eab308', '#f59e0b', '#d97706'] },
        { id: 'theme-aurelian', name: 'Aurelian Gold', cost: 300, unlocked: purchasedRewards.includes('theme-aurelian'), colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'] },
        { id: 'theme-crimson', name: 'Crimson Fury', cost: 200, unlocked: purchasedRewards.includes('theme-crimson'), colors: ['#f87171', '#dc2626', '#b91c1c', '#991b1b'] },
        { id: 'theme-oceanic', name: 'Oceanic Depth', cost: 200, unlocked: purchasedRewards.includes('theme-oceanic'), colors: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'] }
    ];

    const focusBackgrounds = [
        { id: 'focus-synthwave', name: 'Synthwave Sunset', cost: 100, unlocked: purchasedRewards.includes('focus-synthwave'), colors: ['#EC4899', '#7c3aed', '#f97316', '#ef4444'] },
        { id: 'focus-lofi', name: 'Lofi Rain', cost: 100, unlocked: purchasedRewards.includes('focus-lofi'), colors: ['#4f46e5', '#1e293b', '#334155', '#475569'] },
        { id: 'focus-solarpunk', name: 'Solarpunk Garden', cost: 150, unlocked: purchasedRewards.includes('focus-solarpunk'), colors: ['#a3e635', '#16a34a', '#22c55e', '#10b981'] }
    ];

    // Calculate comprehensive Flow Points with new system
    useEffect(() => {
        const calculateFlowPoints = async () => {
            const completedTasks = tasks.filter(t => t.status === 'Completed');
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
            
            // NEW SYSTEM: Base points reduced to 10 per task
            let totalPoints = 0;
            let dailyPoints = 0;
            
            // Calculate points for each completed task
            for (const task of completedTasks) {
                let taskPoints = 10; // Base points per task
                
                // Apply AI priority multiplier (imported from aiPriorityService)
                const priorityMultiplier = getPriorityMultiplier(task);
                taskPoints *= priorityMultiplier;
                
                // Apply health impact (imported from healthDataService)
                const healthImpact = getHealthImpact(taskPoints);
                taskPoints = healthImpact;
                
                // Check if task was completed with Pomodoro timer
                const pomodoroBonus = checkPomodoroCompletion(task.id) ? 5 : 0;
                taskPoints += pomodoroBonus;
                
                dailyPoints += taskPoints;
            }
            
            // Apply daily cap of 100 points
            dailyPoints = Math.min(dailyPoints, 100);
            
            // Add Pomodoro streak bonuses
            const streakBonus = getPomodoroStreakBonus();
            dailyPoints += streakBonus;
            
            // Add completion rate bonus (reduced) - round to nearest 0 or 5
            const completionBonus = roundToNearestFiveOrZero(completionRate * 0.5);
            dailyPoints += completionBonus;
            
            // Final rounding to ensure points end in 0 or 5
            totalPoints = roundToNearestFiveOrZero(dailyPoints);
            
            // Calculate level (every 500 points = 1 level)
            const newLevel = Math.floor(totalPoints / 500) + 1;
            
            setCurrentPoints(totalPoints);
            setLevel(newLevel);
        };

        calculateFlowPoints();
    }, [tasks, healthData]);

    // Helper function to round points to nearest 0 or 5
    const roundToNearestFiveOrZero = (points: number): number => {
        const rounded = Math.round(points);
        const remainder = rounded % 5;
        if (remainder === 0) return rounded;
        // Round to nearest 5
        return rounded + (remainder <= 2 ? -remainder : 5 - remainder);
    };

    // Helper functions for new point system
    const getPriorityMultiplier = (task: Task): number => {
        // AI Priority System Integration
        const categoryWeights: Record<string, number> = {
            'Deep Work': 2.0,
            'Learning': 1.8,
            'Prototyping': 1.6,
            'Meeting': 1.2,
            'Workout': 1.4,
            'Editing': 1.3,
            'Personal': 1.1,
            'Admin': 0.8
        };
        
        return categoryWeights[task.category] || 1.0;
    };

    const getHealthImpact = (basePoints: number): number => {
        // Health Data Service Integration
        const energyLevel = healthData.energyLevel || 'medium';
        const sleepQuality = healthData.sleepQuality || 'good';
        
        let multiplier = 1.0;
        
        // Energy level impact
        if (energyLevel === 'low') multiplier *= 0.7;
        else if (energyLevel === 'high') multiplier *= 1.1;
        
        // Sleep quality impact
        if (sleepQuality === 'poor') multiplier *= 0.8;
        else if (sleepQuality === 'good') multiplier *= 1.1;
        
        return roundToNearestFiveOrZero(basePoints * multiplier);
    };

    const checkPomodoroCompletion = (taskId: number): boolean => {
        // Pomodoro Service Integration - Check if task was completed with timer
        return Math.random() > 0.3; // Simulated: 70% chance task was completed with Pomodoro
    };

    const getPomodoroStreakBonus = (): number => {
        // Pomodoro Streak Bonus - returns values ending in 0 or 5
        const streak = Math.floor(Math.random() * 10) + 1; // Simulated streak
        
        if (streak >= 30) return 30; // 1 month streak
        if (streak >= 14) return 20; // 2 week streak
        if (streak >= 7) return 10; // 1 week streak
        
        return 0;
    };

    const nextLevelPoints = level * 500;
    const progressToNext = ((currentPoints % 500) / 500) * 100;

    // Smart insights and recommendations
    const getSmartInsights = () => {
        const unlockedThemes = themes.filter(t => t.unlocked).length;
        const unlockedBackgrounds = focusBackgrounds.filter(b => b.unlocked).length;
        const nextAffordableTheme = themes.find(t => !t.unlocked && soenFlow >= t.cost);
        const nextAffordableBackground = focusBackgrounds.find(b => !b.unlocked && soenFlow >= b.cost);
        
        return {
            unlockedThemes,
            unlockedBackgrounds,
            nextAffordableTheme,
            nextAffordableBackground,
            totalUnlocked: unlockedThemes + unlockedBackgrounds,
            totalAvailable: themes.length + focusBackgrounds.length
        };
    };

    const insights = getSmartInsights();

    const getMotivationMessage = () => {
        if (progressToNext > 80) {
            return "Almost there! Keep going!";
        } else if (progressToNext > 50) {
            return "Great progress! You're on fire!";
        } else {
            return "Every point counts! Stay consistent!";
        }
    };

    const getNextUnlockRecommendation = () => {
        if (insights.nextAffordableBackground) {
            return `Unlock "${insights.nextAffordableBackground.name}" focus background for ${insights.nextAffordableBackground.cost} Flow Points`;
        }
        if (insights.nextAffordableTheme) {
            return `Unlock "${insights.nextAffordableTheme.name}" theme for ${insights.nextAffordableTheme.cost} Flow Points`;
        }
        return "Complete more tasks to earn Flow Points for unlocks!";
    };

    const tooltips = {
        level: "Your current achievement level. Level up by earning 500 points!",
        points: "Points earned from completing tasks, maintaining streaks, and staying healthy.",
        progress: "Progress toward your next level. Complete more tasks to advance!",
        themes: `You've unlocked ${insights.unlockedThemes}/${themes.length} themes`,
        backgrounds: `You've unlocked ${insights.unlockedBackgrounds}/${focusBackgrounds.length} focus backgrounds`
    };

    return (
                        <motion.div
            className="rounded-2xl p-3 sm:p-4 relative overflow-hidden h-full min-h-[320px]"
            style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                color: 'white'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Simplified Background */}
            <div className="absolute inset-0">
                {[...Array(4)].map((_, i) => (
                <motion.div
                        key={i}
                        className="absolute opacity-15"
                        style={{
                            width: `${4 + Math.random() * 4}px`,
                            height: `${4 + Math.random() * 4}px`,
                                background: `rgba(255,255,255,0.3)`,
                                borderRadius: '50%',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, Math.random() * 10 - 5, 0],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
                            </div>

            <div className="relative z-10">
                {/* Condensed Header */}
                <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                        {/* Mira Penguin Icon - Exact same as dashboard header */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                            <GhibliPenguin />
                                </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight">Soen Rewards</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-white/80 text-xs font-semibold">Lv {level}</span>
                                <div className="w-0.5 h-0.5 bg-white/40 rounded-full"></div>
                                <span className="text-white/80 text-xs font-semibold">{currentPoints} pts</span>
                                </div>
                            </div>
                        </div>
                    <div className="text-right">
                        <div className="text-xs text-white/60">Next</div>
                        <div className="text-white font-bold text-sm">{roundToNearestFiveOrZero(nextLevelPoints - currentPoints)} pts</div>
                    </div>
                </div>

                {/* Health Data Checkpoints - Critical for understanding user behavior */}
                <div className="mb-3 p-2.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-2 mb-2.5">
                        <HeartIcon className="w-4 h-4 text-red-400" />
                        <h4 className="text-white font-semibold text-xs">Health Checkpoints</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { 
                                name: 'Energy', 
                                value: healthData.energyLevel?.charAt(0).toUpperCase() + healthData.energyLevel?.slice(1) || 'Medium', 
                                icon: ZapIcon, 
                                color: healthData.energyLevel === 'high' ? '#10b981' : healthData.energyLevel === 'low' ? '#ef4444' : '#f59e0b' 
                            },
                            { 
                                name: 'Sleep', 
                                value: `${healthData.avgSleepHours || 0}h`, 
                                icon: ClockIcon, 
                                color: (healthData.avgSleepHours || 0) >= 8 ? '#10b981' : (healthData.avgSleepHours || 0) >= 6 ? '#f59e0b' : '#ef4444' 
                            },
                            { 
                                name: 'Activity', 
                                value: healthData.stepsToday ? (healthData.stepsToday >= 10000 ? 'Excellent' : healthData.stepsToday >= 5000 ? 'Good' : 'Low') : 'Good', 
                                icon: ActivityIcon, 
                                color: healthData.stepsToday && healthData.stepsToday >= 10000 ? '#10b981' : healthData.stepsToday && healthData.stepsToday >= 5000 ? '#f59e0b' : '#10b981' 
                            },
                            { 
                                name: 'Stress', 
                                value: healthData.sleepQuality === 'poor' ? 'High' : healthData.sleepQuality === 'good' ? 'Low' : 'Medium', 
                                icon: HeartIcon, 
                                color: healthData.sleepQuality === 'poor' ? '#ef4444' : healthData.sleepQuality === 'good' ? '#10b981' : '#f59e0b' 
                            }
                        ].map((metric, index) => (
                        <motion.div
                                key={metric.name}
                                className="text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg mx-auto mb-1 flex items-center justify-center bg-white/15">
                                    <metric.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: metric.color }} />
                                </div>
                                <p className="text-xs text-white/80 font-semibold">{metric.name}</p>
                                <p className="text-xs text-white font-bold">{metric.value}</p>
                        </motion.div>
                        ))}
            </div>
                    </div>

                {/* Condensed Stats and Flow Points */}
                <div className="flex items-center justify-between mb-3 p-2 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold text-sm">{soenFlow}</span>
                        <span className="text-white/60 text-xs">Flow Points</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-white/60">{insights.unlockedThemes + insights.unlockedBackgrounds} Unlocked</div>
                    </div>
                </div>

                {/* Compact Unlock Progress */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-xs font-semibold">Progress</span>
                        <button 
                            onClick={() => setShowRewardsDetail(!showRewardsDetail)}
                            className="text-white/60 hover:text-white text-xs transition-colors"
                        >
                            {showRewardsDetail ? '−' : '+'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-white/10 rounded-lg">
                            <div className="text-white font-bold text-xs">{insights.unlockedThemes}/{themes.length}</div>
                            <div className="text-white/60 text-xs">Themes</div>
                        </div>
                        <div className="text-center p-2 bg-white/10 rounded-lg">
                            <div className="text-white font-bold text-xs">{insights.unlockedBackgrounds}/{focusBackgrounds.length}</div>
                            <div className="text-white/60 text-xs">Focus BGs</div>
                        </div>
                    </div>
                </div>

                {/* Collapsible Theme Preview */}
                {showRewardsDetail && (
                    <motion.div
                        className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {themes.slice(0, 3).map((theme) => (
                                <div key={theme.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${theme.unlocked ? 'bg-green-400' : 'bg-gray-400'}`} />
                                        <span className="text-white/90 truncate">{theme.name}</span>
                                    </div>
                                    <span className="text-yellow-400 font-bold">{theme.cost}</span>
                                            </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Motivation Message */}
                <div className="text-center pt-2 border-t border-white/10">
                    <div className="text-xs text-white/70">
                        {getMotivationMessage()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


// Main Dashboard Component
const SoenDashboard: React.FC<SoenDashboardProps> = (props) => {
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
            style={{ backgroundColor: 'var(--color-bg)' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Floating particles background */}
            <FloatingParticles count={50} />

            {/* Main Content - Mobile-first responsive design with proper touch targets */}
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 pt-16 sm:pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                >
                    {/* Top Row - Daily Greeting with Integrated SOEN Rewards */}
                    <div className="w-full">
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
                                soenFlow={soenFlow}
                                purchasedRewards={purchasedRewards}
                                activeTheme={activeTheme}
                                activeFocusBackground={activeFocusBackground}
                            />
                    </div>



                    {/* Main Content Grid - Mobile-first responsive layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Task Toggle - Mobile: full width, Desktop: 1/2 */}
                        <div className="lg:col-span-1 order-1 h-full">
                            <TaskToggle
                                tasks={tasks}
                                categoryColors={categoryColors}
                                onCompleteTask={onCompleteTask}
                                navigateToScheduleDate={navigateToScheduleDate}
                                setScreen={setScreen}
                                canCompleteTasks={canCompleteTasks}
                            />
                        </div>

                        {/* Focus Timer - Mobile: full width, Desktop: 1/2 */}
                        {/* Habit Insights section hidden for future iterations */}
                        <div className="lg:col-span-1 order-2 h-full">
                            <FocusTimerWidget
                                tasks={tasks}
                                healthData={healthData}
                                onStartFocusMode={handleStartFocusMode}
                                activeTheme={activeTheme}
                                activeFocusBackground={activeFocusBackground}
                                purchasedRewards={purchasedRewards}
                            />
                        </div>
                    </div>

                </motion.div>
            </div>
        </motion.div>
        </>
    );
};

export default SoenDashboard;