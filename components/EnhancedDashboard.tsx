import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Screen, Task, Note, HealthData, Goal, Category, MissionBriefing } from '../types';
import { 
    SparklesIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon,
    HeartIcon, BoltIcon, ClockIcon, PlayIcon, PauseIcon, 
    BabyPenguinIcon, GiftIcon
} from './Icons';

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
    inferredLocation: string | null;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number, actualDuration?: number) => void;
}

// Enhanced Design System with Gamification Colors
const ENHANCED_DESIGN = {
    colors: {
        primary: '#101C2E',
        accent: '#5D8BFF',
        teal: '#65F5ED',
        yellow: '#FCFF52',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        purple: '#8B5CF6',
        pink: '#EC4899',
        surface: '#FAFAFA',
        dark: '#1F2937',
        // Gamification colors
        xp: '#7C3AED',
        reward: '#F59E0B',
        streak: '#EF4444',
        achievement: '#10B981'
    },
    gradients: {
        primary: 'linear-gradient(135deg, #5D8BFF 0%, #8B5CF6 100%)',
        success: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
        warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        xp: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        achievement: 'linear-gradient(135deg, #FCFF52 0%, #F59E0B 100%)'
    }
} as const;

// Philosophical quotes focused on kindness, love, and purpose
const PHILOSOPHICAL_QUOTES = [
    {
        quote: "The best way to find yourself is to lose yourself in the service of others.",
        author: "Gandhi",
        context: "on purpose"
    },
    {
        quote: "No act of kindness, no matter how small, is ever wasted.",
        author: "Aesop", 
        context: "on compassion"
    },
    {
        quote: "Love and kindness are never wasted. They always make a difference.",
        author: "Barbara De Angelis",
        context: "on impact"
    },
    {
        quote: "Be yourself; everyone else is already taken. But make sure that self is kind.",
        author: "Oscar Wilde (adapted)",
        context: "on authenticity"
    },
    {
        quote: "The meaning of life is to find your gift. The purpose of life is to give it away.",
        author: "Pablo Picasso",
        context: "on contribution"
    },
    {
        quote: "In a world where you can be anything, be kind. It costs nothing but means everything.",
        author: "Unknown Wisdom",
        context: "on choice"
    }
];

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { 
            duration: 0.6, 
            ease: [0.25, 0.46, 0.45, 0.94] 
        }
    }
};

const microAnimations = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
    float: {
        y: [-2, 2, -2],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

// Enhanced Header with Philosophical Quotes
const PhilosophicalHeader = ({ tasks, praxisFlow = 1250 }: { 
    tasks: Task[]; 
    praxisFlow?: number; 
}) => {
    const [currentQuote, setCurrentQuote] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote(prev => (prev + 1) % PHILOSOPHICAL_QUOTES.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    });

    const completedTasks = todayTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = todayTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

    return (
        <motion.div 
            variants={cardVariants}
            className="col-span-full"
        >
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
                {/* Floating background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div 
                        className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"
                        animate={microAnimations.float}
                    />
                    <motion.div 
                        className="absolute top-1/2 -left-8 w-16 h-16 bg-white/5 rounded-full"
                        animate={{ ...microAnimations.float, transition: { ...microAnimations.float.transition, delay: 1 } }}
                    />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Philosophical Quote Section */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    animate={microAnimations.float}
                                    className="p-2 bg-white/10 rounded-xl"
                                >
                                    <SparklesIcon className="w-6 h-6" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold">Daily Wisdom</h1>
                                    <p className="text-white/80 text-sm">Inspiration for meaningful living</p>
                                </div>
                            </div>
                            
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuote}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-2"
                                >
                                    <blockquote className="text-lg lg:text-xl font-medium italic leading-relaxed">
                                        "{PHILOSOPHICAL_QUOTES[currentQuote].quote}"
                                    </blockquote>
                                    <cite className="text-white/70 text-sm">
                                        — {PHILOSOPHICAL_QUOTES[currentQuote].author} {PHILOSOPHICAL_QUOTES[currentQuote].context}
                                    </cite>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Progress & Rewards Section */}
                        <div className="lg:w-80">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                                {/* Progress Ring */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/80 text-sm">Today's Progress</p>
                                        <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                                    </div>
                                    <div className="relative w-16 h-16">
                                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.2)"
                                                strokeWidth="2"
                                            />
                                            <motion.path
                                                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeDasharray={`${progress}, 100`}
                                                initial={{ strokeDasharray: "0, 100" }}
                                                animate={{ strokeDasharray: `${progress}, 100` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold">{Math.round(progress)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Praxis Flow */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="w-5 h-5 text-yellow-300" />
                                        <span className="text-sm">Praxis Flow</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.span 
                                            className="text-xl font-bold text-yellow-300"
                                            animate={allTasksCompleted ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.5, repeat: allTasksCompleted ? Infinity : 0, repeatDelay: 1 }}
                                        >
                                            {praxisFlow.toLocaleString()}
                                        </motion.span>
                                        {allTasksCompleted && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 0 }}
                                                animate={{ scale: 1, rotate: 360 }}
                                                className="text-green-400"
                                            >
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Enhanced Task Card with Micro-interactions
const EnhancedTaskCard = ({ task, onComplete, onEdit, onFocus, categoryColors }: {
    task: Task;
    onComplete: (taskId: number, actualDuration?: number) => void;
    onEdit: (task: Task) => void;
    onFocus: (task: Task) => void;
    categoryColors: Record<Category, string>;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    const bgColor = categoryColors[task.category] || ENHANCED_DESIGN.colors.accent;
    const isCompleted = task.status === 'Completed';

    return (
        <motion.div
            layout
            className="group relative"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={microAnimations.hover}
            whileTap={microAnimations.tap}
        >
            <div 
                className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200/50 transition-all duration-300"
                style={{ backgroundColor: bgColor }}
            >
                {/* Completion overlay */}
                <AnimatePresence>
                    {isCompleted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] z-10"
                        />
                    )}
                </AnimatePresence>

                {/* Main content */}
                <div className="relative z-20 p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-semibold text-white truncate ${isCompleted ? 'line-through opacity-70' : ''}`}>
                                    {task.title}
                                </h3>
                                {task.category && (
                                    <span className="px-2 py-1 text-xs bg-white/20 rounded-md text-white/80">
                                        {task.category}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-white/70">
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BoltIcon className="w-3 h-3" />
                                    <span>{task.duration}min</span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {!isCompleted ? (
                                <>
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFocus(task);
                                        }}
                                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Focus Mode"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onComplete(task.id, task.duration);
                                        }}
                                        className="p-2 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Complete Task"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </motion.button>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0, rotate: 0 }}
                                    animate={{ scale: 1, rotate: 360 }}
                                    className="p-2 bg-green-500 rounded-lg text-white"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Expandable details */}
                    <AnimatePresence>
                        {(isExpanded || isHovered) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-white/20"
                            >
                                {task.location && (
                                    <p className="text-xs text-white/70 mb-2">📍 {task.location}</p>
                                )}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(task);
                                        }}
                                        className="px-3 py-1 bg-white/20 rounded-md text-xs text-white hover:bg-white/30 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button className="px-3 py-1 bg-white/20 rounded-md text-xs text-white hover:bg-white/30 transition-colors">
                                        Reschedule
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hover glow effect */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/10 pointer-events-none"
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// Data-Rich Tasks Section
const DataRichTasksSection = ({ tasks, onCompleteTask, onEditTask, onFocusTask, categoryColors }: {
    tasks: Task[];
    onCompleteTask: (taskId: number, actualDuration?: number) => void;
    onEditTask: (task: Task) => void;
    onFocusTask: (task: Task) => void;
    categoryColors: Record<Category, string>;
}) => {
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    });

    const completedTasks = todayTasks.filter(task => task.status === 'Completed');
    const pendingTasks = todayTasks.filter(task => task.status !== 'Completed');
    
    // Analytics data
    const categoryBreakdown = todayTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(categoryBreakdown).map(([category, count]) => ({
        name: category,
        value: count,
        color: categoryColors[category as Category] || ENHANCED_DESIGN.colors.accent
    }));

    return (
        <motion.div variants={cardVariants} className="col-span-full lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                {/* Header with analytics */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Mission</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                {completedTasks.length} completed
                            </span>
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4 text-blue-500" />
                                {pendingTasks.length} pending
                            </span>
                            <span className="flex items-center gap-1">
                                <FireIcon className="w-4 h-4 text-orange-500" />
                                {Math.round((completedTasks.length / todayTasks.length) * 100) || 0}% complete
                            </span>
                        </div>
                    </div>

                    {/* Category breakdown chart */}
                    <div className="w-32 h-32 mt-4 lg:mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={50}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tasks grid */}
                <div className="space-y-4">
                    {todayTasks.map(task => (
                        <EnhancedTaskCard
                            key={task.id}
                            task={task}
                            onComplete={onCompleteTask}
                            onEdit={onEditTask}
                            onFocus={onFocusTask}
                            categoryColors={categoryColors}
                        />
                    ))}
                </div>

                {todayTasks.length === 0 && (
                    <div className="text-center py-12">
                        <BabyPenguinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks scheduled</h3>
                        <p className="text-gray-500">Add some tasks to get started with your productive day!</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Gamified Health & Wellness Section
const GamifiedHealthSection = ({ healthData, praxisFlow }: { 
    healthData: HealthData; 
    praxisFlow: number;
}) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    const healthMetrics = [
        {
            id: 'sleep',
            name: 'Sleep Quality',
            icon: '😴',
            value: healthData.avgSleepHours,
            target: 8,
            unit: 'hours',
            xpReward: 50,
            color: ENHANCED_DESIGN.colors.success,
            gradient: ENHANCED_DESIGN.gradients.success
        },
        {
            id: 'energy',
            name: 'Energy Level',
            icon: '⚡',
            value: 7,
            target: 10,
            unit: 'points',
            xpReward: 30,
            color: ENHANCED_DESIGN.colors.accent,
            gradient: ENHANCED_DESIGN.gradients.primary
        },
        {
            id: 'focus',
            name: 'Focus Score',
            icon: '🎯',
            value: 8.5,
            target: 10,
            unit: 'points',
            xpReward: 40,
            color: ENHANCED_DESIGN.colors.purple,
            gradient: ENHANCED_DESIGN.gradients.xp
        }
    ];

    return (
        <motion.div variants={cardVariants} className="col-span-full lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
                        <HeartIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Wellness</h2>
                        <p className="text-sm text-gray-600">Level up your health</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {healthMetrics.map(metric => {
                        const progress = (metric.value / metric.target) * 100;
                        const isSelected = selectedMetric === metric.id;

                        return (
                            <motion.div
                                key={metric.id}
                                layout
                                className="relative"
                            >
                                <motion.div
                                    className="p-4 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300"
                                    style={{ 
                                        background: isSelected ? metric.gradient : 'transparent'
                                    }}
                                    onClick={() => setSelectedMetric(isSelected ? null : metric.id)}
                                    whileHover={microAnimations.hover}
                                    whileTap={microAnimations.tap}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <motion.span 
                                                className="text-2xl"
                                                animate={microAnimations.float}
                                            >
                                                {metric.icon}
                                            </motion.span>
                                            <div>
                                                <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                    {metric.name}
                                                </h3>
                                                <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                                                    {metric.value}/{metric.target} {metric.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                                    +{metric.xpReward} XP
                                                </div>
                                                <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                    {Math.round(progress)}%
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isSelected ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ChevronDownIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3">
                                        <div className={`w-full h-2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-200'}`}>
                                            <motion.div
                                                className={`h-full rounded-full ${isSelected ? 'bg-white' : ''}`}
                                                style={{ backgroundColor: isSelected ? 'white' : metric.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Expanded content */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 bg-gray-50 rounded-b-2xl -mt-2">
                                                <p className="text-sm text-gray-700 mb-3">
                                                    Great progress! Keep up the momentum to earn more XP.
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <SparklesIcon className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-xs text-gray-600">
                                                        Earn {metric.xpReward} XP when you reach your target
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* XP Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Daily XP Potential</p>
                            <p className="text-2xl font-bold">+120 XP</p>
                        </div>
                        <GiftIcon className="w-8 h-8" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Notes & Schedule Hub
const NotesScheduleHub = ({ notes, setScreen }: { 
    notes: Note[]; 
    setScreen: (screen: Screen) => void; 
}) => {
    const recentNotes = notes.slice(0, 3);
    const upcomingEvents = 2; // Mock data

    return (
        <motion.div variants={cardVariants} className="col-span-full lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Knowledge Hub</h2>
                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => setScreen('Notes')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            whileHover={microAnimations.hover}
                            whileTap={microAnimations.tap}
                        >
                            All Notes
                        </motion.button>
                        <motion.button
                            onClick={() => setScreen('Schedule')}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                            whileHover={microAnimations.hover}
                            whileTap={microAnimations.tap}
                        >
                            Schedule
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Notes */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Recent Notes ({notes.length})
                        </h3>
                        <div className="space-y-3">
                            {recentNotes.length > 0 ? recentNotes.map(note => (
                                <motion.div
                                    key={note.id}
                                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    whileHover={microAnimations.hover}
                                    onClick={() => setScreen('Notes')}
                                >
                                    <h4 className="font-medium text-gray-900 text-sm truncate">{note.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </motion.div>
                            )) : (
                                <div className="text-center py-6">
                                    <DocumentTextIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No notes yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Schedule */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Upcoming Events ({upcomingEvents})
                        </h3>
                        <div className="space-y-3">
                            <motion.div
                                className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                                whileHover={microAnimations.hover}
                            >
                                <h4 className="font-medium text-gray-900 text-sm">Team Standup</h4>
                                <p className="text-xs text-gray-600 mt-1">Tomorrow, 9:00 AM</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-xs text-blue-600">Work</span>
                                </div>
                            </motion.div>
                            
                            <motion.div
                                className="p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200"
                                whileHover={microAnimations.hover}
                            >
                                <h4 className="font-medium text-gray-900 text-sm">Gym Session</h4>
                                <p className="text-xs text-gray-600 mt-1">Tomorrow, 6:00 PM</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs text-green-600">Health</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// AI Kiko Section (Only available after task completion)
const KikoAISection = ({ allTasksCompleted, setScreen }: {
    allTasksCompleted: boolean;
    setScreen: (screen: Screen) => void;
}) => {
    return (
        <motion.div variants={cardVariants} className="col-span-full lg:col-span-1">
            <div className={`
                relative overflow-hidden rounded-3xl p-6 shadow-xl border transition-all duration-500
                ${allTasksCompleted 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-300' 
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }
            `}>
                {/* Background penguin */}
                <div className="absolute top-4 right-4 opacity-20">
                    <BabyPenguinIcon className="w-16 h-16" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <motion.div
                            className={`p-2 rounded-xl ${allTasksCompleted ? 'bg-white/20' : 'bg-gray-200'}`}
                            animate={allTasksCompleted ? microAnimations.float : {}}
                        >
                            <BabyPenguinIcon className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-bold">Kiko AI</h2>
                            <p className="text-sm opacity-80">Your AI companion</p>
                        </div>
                    </div>

                    {allTasksCompleted ? (
                        <div className="space-y-4">
                            <p className="text-sm opacity-90">
                                🎉 Congratulations! You've completed all your tasks. 
                                Kiko is ready to help you reflect and plan ahead.
                            </p>
                            <motion.button
                                onClick={() => setScreen('Kiko')}
                                className="w-full py-3 bg-white/20 backdrop-blur-sm rounded-xl font-medium hover:bg-white/30 transition-colors"
                                whileHover={microAnimations.hover}
                                whileTap={microAnimations.tap}
                            >
                                Chat with Kiko
                            </motion.button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm">
                                Complete all your tasks to unlock Kiko AI assistance for reflection and planning.
                            </p>
                            <div className="py-3 px-4 bg-gray-200 rounded-xl text-center">
                                <span className="text-sm font-medium">🔒 Locked</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Main Enhanced Dashboard Component
export default function EnhancedDashboard(props: DashboardProps) {
    const {
        tasks,
        notes,
        healthData,
        briefing,
        goals,
        setFocusTask,
        dailyCompletionImage,
        categoryColors,
        isBriefingLoading,
        navigateToScheduleDate,
        inferredLocation,
        setScreen,
        onCompleteTask
    } = props;

    // Calculate completion status
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    });

    const allTasksCompleted = todayTasks.length > 0 && todayTasks.every(task => task.status === 'Completed');
    const praxisFlow = 1250; // Mock Praxis Flow value

    // Handlers
    const handleEditTask = (task: Task) => {
        navigateToScheduleDate(new Date(task.startTime));
    };

    const handleFocusTask = (task: Task) => {
        setFocusTask(task);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-6"
            >
                {/* Philosophical Header */}
                <PhilosophicalHeader tasks={tasks} praxisFlow={praxisFlow} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Data-Rich Tasks Section */}
                    <DataRichTasksSection
                        tasks={tasks}
                        onCompleteTask={onCompleteTask}
                        onEditTask={handleEditTask}
                        onFocusTask={handleFocusTask}
                        categoryColors={categoryColors}
                    />

                    {/* Gamified Health Section */}
                    <GamifiedHealthSection 
                        healthData={healthData}
                        praxisFlow={praxisFlow}
                    />
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Notes & Schedule Hub */}
                    <NotesScheduleHub 
                        notes={notes}
                        setScreen={setScreen}
                    />

                    {/* Kiko AI Section */}
                    <KikoAISection 
                        allTasksCompleted={allTasksCompleted}
                        setScreen={setScreen}
                    />
                </div>
            </motion.div>
        </div>
    );
}
