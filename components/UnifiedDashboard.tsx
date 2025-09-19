import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { 
    SparklesIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon,
    HeartIcon, BoltIcon, ClockIcon, PlayIcon, HomeIcon,
    UserCircleIcon, BabyPenguinIcon, GiftIcon
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

// Taskflow-inspired minimalist color scheme
const UNIFIED_COLORS = {
    background: '#101C2E', // Deep blue background like Taskflow
    surface: '#1A2332',    // Slightly lighter surface
    text: {
        primary: '#FFFFFF',
        secondary: '#B0B0B0',
        muted: '#666666'
    },
    // Pastel backgrounds for different sections (Taskflow style)
    pastels: {
        blue: '#5D8BFF',      // Light blue
        teal: '#65F5ED',      // Teal
        yellow: '#FCFF52',    // Yellow
        purple: '#8B5CF6',    // Purple
        pink: '#F472B6'       // Pink
    },
    tabs: {
        dashboard: '#5D8BFF',    // Light blue
        schedule: '#65F5ED',     // Teal  
        notes: '#FCFF52',        // Yellow
        health: '#F472B6',       // Pink
        habits: '#8B5CF6',       // Purple
        profile: '#5D8BFF'       // Light blue
    }
} as const;

// Tab configuration
const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, color: UNIFIED_COLORS.tabs.dashboard },
    { id: 'schedule', label: 'Schedule', icon: CalendarDaysIcon, color: UNIFIED_COLORS.tabs.schedule },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon, color: UNIFIED_COLORS.tabs.notes },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon, color: UNIFIED_COLORS.tabs.profile }
] as const;

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

// Tab Button Component
function TabButton({ tab, isActive, onClick }: { 
    tab: typeof TABS[0], 
    isActive: boolean, 
    onClick: () => void 
}) {
    return (
        <motion.button
            onClick={onClick}
            className={`tab-button ${
                isActive 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={{
                backgroundColor: isActive ? tab.color : 'transparent',
                boxShadow: isActive ? `0 8px 32px ${tab.color}40` : 'none'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
        </motion.button>
    );
}

// Dashboard Content Component
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
        <motion.div variants={itemVariants} className="space-y-6">
            {/* Clean Daily Greeting - Taskflow Style */}
            <div className="text-center py-12 rounded-3xl" style={{ backgroundColor: UNIFIED_COLORS.pastels.blue }}>
                <h1 className="text-4xl font-bold text-white mb-2">{getGreeting()}</h1>
                <p className="text-white/90 text-lg max-w-xl mx-auto">
                    "{todayQuote}"
                </p>
                <div className="mt-3 text-white/70 text-sm">
                    {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric'
                    })}
                </div>
                
                {/* Integrated Health & Habits Insights */}
                <IntegratedHealthInsights 
                    healthData={healthData} 
                    notes={notes} 
                    tasks={tasks} 
                />
            </div>

            {/* Clean Stats - Taskflow Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl p-6" style={{ backgroundColor: UNIFIED_COLORS.pastels.yellow }}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{todayTasks.length}</p>
                        <p className="text-white/80 text-sm">Tasks Today</p>
                        <p className="text-white/60 text-xs">{completedToday} completed</p>
                    </div>
                </div>

                <div className="rounded-2xl p-6" style={{ backgroundColor: UNIFIED_COLORS.pastels.purple }}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{completionRate}%</p>
                        <p className="text-white/80 text-sm">Completion Rate</p>
                        <p className="text-white/60 text-xs">Today's progress</p>
                    </div>
                </div>

                <div className="rounded-2xl p-6" style={{ backgroundColor: UNIFIED_COLORS.pastels.pink }}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{notes.length}</p>
                        <p className="text-white/80 text-sm">Notes</p>
                        <p className="text-white/60 text-xs">Total notes</p>
                    </div>
                </div>
            </div>

            {/* Today's Tasks - Taskflow Style */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: UNIFIED_COLORS.pastels.teal }}>
                <h3 className="text-white font-semibold text-lg mb-4">Today's Tasks</h3>
                {todayTasks.length > 0 ? (
                    <div className="space-y-3">
                        {todayTasks.slice(0, 5).map((task, index) => (
                            <motion.div
                                key={task.id}
                                className="flex items-center gap-4 p-4 bg-white/20 rounded-xl"
                                whileHover={{ scale: 1.02 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: categoryColors[task.category] }}
                                />
                                <div className="flex-1">
                                    <p className="text-white font-medium">{task.title}</p>
                                    <p className="text-white/70 text-sm">
                                        {new Date(task.startTime).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })} • {task.plannedDuration} min
                                    </p>
                                </div>
                                <button
                                    onClick={() => onCompleteTask(task.id)}
                                    className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white/70 text-center py-8">No tasks for today</p>
                )}
            </div>
        </motion.div>
    );
}

// Schedule Content Component
function ScheduleContent({ tasks, categoryColors, onCompleteTask }: {
    tasks: Task[];
    categoryColors: Record<Category, string>;
    onCompleteTask: (taskId: number) => void;
}) {
    const todayTasks = useMemo(() => 
        tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        [tasks]
    );

    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Schedule</h1>
                <p className="text-gray-400 text-lg">Your daily timeline</p>
            </div>

            <div className="space-y-4">
                {todayTasks.map((task) => (
                    <motion.div
                        key={task.id}
                        className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: categoryColors[task.category] }}
                        />
                        <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">{task.title}</h3>
                            <p className="text-gray-400">
                                {new Date(task.startTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })} - {new Date(new Date(task.startTime).getTime() + task.plannedDuration * 60000).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </p>
                        </div>
                        <button
                            onClick={() => onCompleteTask(task.id)}
                            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                            Complete
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// Notes Content Component
function NotesContent({ notes }: { notes: Note[] }) {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Notes</h1>
                <p className="text-gray-400 text-lg">Your thoughts and ideas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                    <motion.div
                        key={note.id}
                        className="p-6 bg-white/5 rounded-2xl border border-white/10"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h3 className="text-white font-semibold text-lg mb-2">{note.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-3">{note.content}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}


// Profile Content Component
function ProfileContent() {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
                <p className="text-gray-400 text-lg">Manage your account</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">User Profile</h3>
                        <p className="text-gray-400">Praxis AI User</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400">Email</span>
                        <span className="text-white">user@praxis.ai</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400">Member since</span>
                        <span className="text-white">2024</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Main Unified Dashboard Component
export default function UnifiedDashboard(props: UnifiedDashboardProps) {
    const { tasks, notes, healthData, briefing, categoryColors, onCompleteTask, setFocusTask } = props;
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardContent tasks={tasks} notes={notes} healthData={healthData} briefing={briefing} categoryColors={categoryColors} onCompleteTask={onCompleteTask} setFocusTask={setFocusTask} />;
            case 'schedule':
                return <ScheduleContent tasks={tasks} categoryColors={categoryColors} onCompleteTask={onCompleteTask} />;
            case 'notes':
                return <NotesContent notes={notes} />;
            case 'profile':
                return <ProfileContent />;
            default:
                return <DashboardContent tasks={tasks} notes={notes} healthData={healthData} briefing={briefing} categoryColors={categoryColors} onCompleteTask={onCompleteTask} setFocusTask={setFocusTask} />;
        }
    };

    return (
        <div 
            className="unified-dashboard min-h-screen w-full fixed inset-0 overflow-y-auto"
            style={{ backgroundColor: UNIFIED_COLORS.background }}
        >
            {/* Fixed Header with Tabs */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                <span className="text-black font-bold text-lg">P</span>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-xl">Praxis AI</h1>
                                <p className="text-gray-400 text-sm">Command Center</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => props.setScreen('Kiko')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                        >
                            <BabyPenguinIcon className="w-5 h-5" />
                            <span>Kiko AI</span>
                        </button>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        {TABS.map((tab) => (
                            <TabButton
                                key={tab.id}
                                tab={tab}
                                isActive={activeTab === tab.id}
                                onClick={() => {
                                    if (tab.id === 'dashboard') {
                                        setActiveTab(tab.id);
                                    } else {
                                        // Navigate to main app screens
                                        props.setScreen(tab.label as Screen);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
