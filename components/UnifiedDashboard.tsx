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
            {/* Unified Daily Greeting Section with Integrated Health Insights */}
            <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: categoryColors['Learning'] || '#3B82F6' }}>
                <div className="p-8">
                    {/* Main Greeting and Date */}
                    <div className="text-center mb-8">
                        <h1 className="text-6xl font-bold text-white mb-4">{getGreeting()}</h1>
                        <div className="text-white/70 text-lg mb-6">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric'
                            })}
                        </div>

                        {/* Daily Quote */}
                        <div className="bg-white/10 rounded-2xl p-6 max-w-4xl mx-auto">
                            <blockquote className="text-white text-xl italic leading-relaxed mb-3">
                                "{todayQuote.text}"
                            </blockquote>
                            <cite className="text-white/70 text-base font-medium">— {todayQuote.author}</cite>
                        </div>
                    </div>

                    {/* Integrated Health Insights */}
                    <div className="bg-white/10 rounded-2xl p-6">
                        <IntegratedHealthInsights 
                            healthData={healthData} 
                            notes={notes} 
                            tasks={tasks} 
                        />
                    </div>
                </div>
            </div>

            {/* Next Up Section - Outside the greeting box */}
            {todayTasks.length > 0 && (
                <div className="bg-surface rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-text text-xl font-semibold">Next Up</h3>
                        <button
                            onClick={() => {
                                // Open EventDetail instead of FocusMode
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
                    <div className="flex items-center gap-4">
                        <div 
                            className="flex-1 p-4 rounded-xl cursor-pointer hover:bg-surface/50 transition-all duration-300 border border-border"
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
                </div>
            )}

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
