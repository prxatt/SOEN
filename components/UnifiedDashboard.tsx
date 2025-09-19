import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { 
    CheckCircleIcon
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
        "The best way to find yourself is to lose yourself in the service of others.",
        "No act of kindness, no matter how small, is ever wasted.",
        "Love and kindness are never wasted. They always make a difference.",
        "Be yourself; everyone else is already taken. But make sure that self is kind.",
        "The meaning of life is to find your gift. The purpose of life is to give it away.",
        "In a world where you can be anything, be kind. It costs nothing but means everything."
    ];

    const todayQuote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

    return (
        <motion.div variants={itemVariants} className="space-y-8">
            {/* Daily Greeting - Schedule UI Style */}
            <div className="text-center py-12 rounded-3xl" style={{ backgroundColor: categoryColors['Learning'] || '#3B82F6' }}>
                <h1 className="text-6xl font-bold text-white mb-4">{getGreeting()}</h1>
                <p className="text-white/90 text-xl max-w-2xl mx-auto leading-relaxed">
                    "{todayQuote}"
                </p>
                <div className="mt-6 text-white/70 text-lg">
                    {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Stats Cards - Schedule UI Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    className="p-8 rounded-3xl text-white text-center"
                    style={{ backgroundColor: categoryColors['Prototyping'] || '#A855F7' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-4xl font-bold mb-2">{todayTasks.length}</div>
                    <div className="text-white/80 text-lg">Tasks Today</div>
                    <div className="text-white/60 text-sm mt-1">{completedToday} completed</div>
                </motion.div>

                <motion.div 
                    className="p-8 rounded-3xl text-white text-center"
                    style={{ backgroundColor: categoryColors['Workout'] || '#EC4899' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-4xl font-bold mb-2">{completionRate}%</div>
                    <div className="text-white/80 text-lg">Completion Rate</div>
                    <div className="text-white/60 text-sm mt-1">Today's progress</div>
                </motion.div>

                <motion.div 
                    className="p-8 rounded-3xl text-white text-center"
                    style={{ backgroundColor: categoryColors['Personal'] || '#6366F1' }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-4xl font-bold mb-2">{notes.length}</div>
                    <div className="text-white/80 text-lg">Notes</div>
                    <div className="text-white/60 text-sm mt-1">Total notes</div>
                </motion.div>
            </div>

            {/* Today's Tasks - Schedule UI Style */}
            <div>
                <h2 className="text-3xl font-bold text-white mb-6">Today's Tasks</h2>
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
                        <p className="text-gray-400 text-xl">No tasks for today</p>
                        <p className="text-gray-500 text-sm mt-2">Add some tasks to get started!</p>
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
        <div className="min-h-screen bg-black text-white p-6">
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
