import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { 
    SparklesIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon,
    HeartIcon, BoltIcon, ClockIcon, PlayIcon, HomeIcon,
    UserCircleIcon, BabyPenguinIcon, GiftIcon
} from './Icons';
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

// Unified color scheme - single background with color-coded tabs
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

// Tab configuration
const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, color: UNIFIED_COLORS.tabs.dashboard },
    { id: 'schedule', label: 'Schedule', icon: CalendarDaysIcon, color: UNIFIED_COLORS.tabs.schedule },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon, color: UNIFIED_COLORS.tabs.notes },
    { id: 'health', label: 'Health', icon: HeartIcon, color: UNIFIED_COLORS.tabs.health },
    { id: 'habits', label: 'Habits', icon: BoltIcon, color: UNIFIED_COLORS.tabs.habits },
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

    return (
        <motion.div variants={itemVariants} className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-lg">Ready to tackle your day?</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-white font-semibold">Tasks Today</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{todayTasks.length}</p>
                    <p className="text-gray-400 text-sm">{completedToday} completed</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <FireIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-white font-semibold">Completion Rate</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{completionRate}%</p>
                    <p className="text-gray-400 text-sm">Today's progress</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-white font-semibold">Notes</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{notes.length}</p>
                    <p className="text-gray-400 text-sm">Total notes</p>
                </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold text-lg mb-4">Today's Tasks</h3>
                {todayTasks.length > 0 ? (
                    <div className="space-y-3">
                        {todayTasks.slice(0, 5).map((task) => (
                            <motion.div
                                key={task.id}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categoryColors[task.category] }}
                                />
                                <div className="flex-1">
                                    <p className="text-white font-medium">{task.title}</p>
                                    <p className="text-gray-400 text-sm">
                                        {new Date(task.startTime).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })} • {task.plannedDuration} min
                                    </p>
                                </div>
                                <button
                                    onClick={() => onCompleteTask(task.id)}
                                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">No tasks for today</p>
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

// Health Content Component
function HealthContent({ healthData }: { healthData: HealthData }) {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Health</h1>
                <p className="text-gray-400 text-lg">Track your wellness</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold text-lg mb-4">Steps Today</h3>
                    <p className="text-3xl font-bold text-white">{healthData.stepsToday}</p>
                    <p className="text-gray-400 text-sm">Goal: 10,000 steps</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold text-lg mb-4">Sleep Hours</h3>
                    <p className="text-3xl font-bold text-white">{healthData.sleepHours}</p>
                    <p className="text-gray-400 text-sm">Last night</p>
                </div>
            </div>
        </motion.div>
    );
}

// Habits Content Component
function HabitsContent({ healthData }: { healthData: HealthData }) {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-white mb-2">Habits</h1>
                <p className="text-gray-400 text-lg">Build better routines</p>
            </div>

            <div className="space-y-4">
                {healthData.habits.map((habit, index) => (
                    <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">{habit.name}</h3>
                            <span className="text-gray-400 text-sm">{habit.streak} day streak</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${habit.completionRate}%` }}
                            />
                        </div>
                    </div>
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
            case 'health':
                return <HealthContent healthData={healthData} />;
            case 'habits':
                return <HabitsContent healthData={healthData} />;
            case 'profile':
                return <ProfileContent />;
            default:
                return <DashboardContent tasks={tasks} notes={notes} healthData={healthData} briefing={briefing} categoryColors={categoryColors} onCompleteTask={onCompleteTask} setFocusTask={setFocusTask} />;
        }
    };

    return (
        <div 
            className="unified-dashboard min-h-screen w-full"
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
                                onClick={() => setActiveTab(tab.id)}
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
