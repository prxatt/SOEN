import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar } from 'recharts';
import { Screen, Task, Note, HealthData, Goal, Category, MissionBriefing } from '../types';
import { 
    SparklesIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon,
    HeartIcon, BoltIcon, ClockIcon, PlayIcon
} from './Icons';
import MobileOptimizedStyles from './MobileOptimizedStyles';

// TaskFlow-inspired color palette and design system
const DESIGN_SYSTEM = {
  colors: {
    primary: '#101C2E',      // Dark blue from TaskFlow
    accent: '#5D8BFF',       // Blue
    teal: '#65F5ED',         // Teal
    yellow: '#FCFF52',       // Yellow
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    surface: '#FAFAFA',      // Light background
    surfaceDark: '#F8F9FA',  // Slightly darker surface
    text: {
      primary: '#101C2E',
      secondary: '#6B7280',
      muted: '#9CA3AF'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem', 
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  },
  borderRadius: {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
} as const;

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
    onCompleteTask: (taskId: number) => void;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

const expandVariants: Variants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
        height: "auto", 
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

// Utility function for better text contrast
const getTextColorForBackground = (bgColor: string): string => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? DESIGN_SYSTEM.colors.primary : '#FFFFFF';
};

// Compact Header Component
const CompactHeader = ({ tasks, nextTask, categoryColors }: {
    tasks: Task[];
    nextTask?: Task;
    categoryColors: Record<Category, string>;
}) => {
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    });

    const completedTasks = todayTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = todayTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const bgColor = nextTask ? (categoryColors[nextTask.category] || DESIGN_SYSTEM.colors.accent) : DESIGN_SYSTEM.colors.accent;
    const textColor = getTextColorForBackground(bgColor);

    return (
        <motion.div 
            variants={itemVariants}
            className="col-span-full"
        >
            <div 
                className="rounded-2xl p-6 relative overflow-hidden shadow-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Today's Focus</h1>
                        <p className="text-sm opacity-80">
                            {completedTasks} of {totalTasks} tasks completed
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{Math.round(progress)}%</div>
                        <div className="w-16 h-2 bg-white/20 rounded-full mt-2">
                            <motion.div 
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    </div>
                </div>
                
                {nextTask && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                        <p className="text-sm opacity-80">Next Up:</p>
                        <p className="font-semibold truncate">{nextTask.title}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Expandable Task Card Component
const TaskCard = ({ task, onComplete, categoryColors }: {
    task: Task;
    onComplete: (taskId: number, actualDuration?: number) => void;
    categoryColors: Record<Category, string>;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const bgColor = categoryColors[task.category] || DESIGN_SYSTEM.colors.accent;
    const textColor = getTextColorForBackground(bgColor);

    return (
        <motion.div
            layout
            className="rounded-xl overflow-hidden shadow-sm border border-gray-200"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <motion.div
                className="p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm truncate">{task.title}</h3>
                        <p className="text-xs opacity-70 mt-1">
                            {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {task.status === 'Completed' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete(task.id);
                                }}
                                className="w-5 h-5 rounded-full border-2 border-current hover:bg-white/20 transition-colors"
                            />
                        )}
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDownIcon className="w-4 h-4" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        variants={expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="px-4 pb-4"
                    >
                        <div className="bg-white/10 rounded-lg p-3 space-y-2">
                            <div className="text-xs opacity-70">Category: {task.category}</div>
                            <div className="text-xs opacity-70">Duration: {task.duration} min</div>
                            {task.location && (
                                <div className="text-xs opacity-70">Location: {task.location}</div>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button className="px-3 py-1 bg-white/20 rounded-md text-xs font-medium hover:bg-white/30 transition-colors">
                                    Edit
                                </button>
                                <button className="px-3 py-1 bg-white/20 rounded-md text-xs font-medium hover:bg-white/30 transition-colors">
                                    Reschedule
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Compact Tasks Section
const CompactTasksSection = ({ tasks, onCompleteTask, categoryColors }: {
    tasks: Task[];
    onCompleteTask: (taskId: number, actualDuration?: number) => void;
    categoryColors: Record<Category, string>;
}) => {
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    }).slice(0, 4); // Show only first 4 tasks

    return (
        <motion.div variants={itemVariants} className="col-span-full lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Today's Tasks</h2>
                    <span className="text-sm text-gray-500">{todayTasks.length} tasks</span>
                </div>
                
                <div className="space-y-3">
                    {todayTasks.map(task => (
                        <TaskCard 
                            key={task.id}
                            task={task}
                            onComplete={onCompleteTask}
                            categoryColors={categoryColors}
                        />
                    ))}
                </div>

                {tasks.length > 4 && (
                    <button className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        View all tasks →
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// Expandable Health Metric Component
const HealthMetric = ({ metric, isExpanded, onToggle }: {
    metric: any;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    return (
        <motion.div
            layout
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
            <motion.div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onToggle}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{metric.icon}</div>
                        <div>
                            <h3 className="font-semibold text-sm text-gray-900">{metric.name}</h3>
                            <p className="text-xs text-gray-500">{metric.displayValue}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full">
                            <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                    backgroundColor: metric.color,
                                    width: `${(metric.value / metric.target) * 100}%`
                                }}
                            />
                        </div>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        variants={expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="px-4 pb-4"
                    >
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700 mb-3">{metric.insights}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Target: {metric.target} {metric.unit}</span>
                                <span>Current: {metric.value} {metric.unit}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Compact Health Section
const CompactHealthSection = ({ healthData }: { healthData: HealthData }) => {
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    const healthMetrics = [
        {
            id: 'sleep',
            name: 'Sleep Quality',
            icon: '😴',
            value: healthData.avgSleepHours,
            target: 8,
            unit: 'hours',
            displayValue: `${healthData.avgSleepHours}h`,
            color: healthData.sleepQuality === 'good' ? DESIGN_SYSTEM.colors.success : 
                   healthData.sleepQuality === 'fair' ? DESIGN_SYSTEM.colors.warning : DESIGN_SYSTEM.colors.error,
            insights: healthData.sleepQuality === 'good' ? 
                "Excellent sleep quality! Your rest patterns are optimizing cognitive performance." :
                "Room for improvement. Try a consistent bedtime routine for better rest."
        },
        {
            id: 'energy',
            name: 'Energy Level',
            icon: '⚡',
            value: 7,
            target: 10,
            unit: 'points',
            displayValue: '7/10',
            color: DESIGN_SYSTEM.colors.accent,
            insights: "Good energy levels today. Consider a short walk to boost it further."
        },
        {
            id: 'workouts',
            name: 'Workouts',
            icon: '💪',
            value: healthData.totalWorkouts,
            target: 5,
            unit: 'sessions',
            displayValue: `${healthData.totalWorkouts}/5`,
            color: DESIGN_SYSTEM.colors.teal,
            insights: "Great progress on your fitness goals. Keep up the momentum!"
        }
    ];

    return (
        <motion.div variants={itemVariants} className="col-span-full lg:col-span-2">
            <div className="compact-card bg-white rounded-2xl p-4 md:p-6 card-shadow border border-gray-100">
                <h2 className="text-headline text-high-contrast mb-4">Health & Wellness</h2>
                
                <div className="space-y-3">
                    {healthMetrics.map(metric => (
                        <HealthMetric
                            key={metric.id}
                            metric={metric}
                            isExpanded={expandedMetric === metric.id}
                            onToggle={() => setExpandedMetric(
                                expandedMetric === metric.id ? null : metric.id
                            )}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Expandable Habit Component
const HabitItem = ({ habit, isExpanded, onToggle }: {
    habit: any;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    const progress = (habit.value / habit.target) * 100;

    return (
        <motion.div
            layout
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
            <motion.div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onToggle}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{habit.icon}</div>
                        <div>
                            <h3 className="font-semibold text-sm text-gray-900">{habit.name}</h3>
                            <p className="text-xs text-gray-500">{habit.value}/{habit.target} {habit.unit}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <FireIcon className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-500">{habit.streak}</span>
                        </div>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </motion.div>
                    </div>
                </div>
                
                <div className="mt-3 w-full h-2 bg-gray-200 rounded-full">
                    <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: habit.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        variants={expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="px-4 pb-4"
                    >
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700 mb-3">{habit.description}</p>
                            <div className="grid grid-cols-7 gap-1">
                                {habit.data.slice(-7).map((day: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`w-6 h-6 rounded-md ${
                                            day.completed ? 'bg-green-500' : 'bg-gray-200'
                                        }`}
                                        title={`${day.date}: ${day.completed ? 'Completed' : 'Missed'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Compact Habits Section
const CompactHabitsSection = ({ healthData }: { healthData: HealthData }) => {
    const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

    // Generate mock habit data
    const generateHabitData = (habitName: string) => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const isCompleted = Math.random() > 0.3;
            data.push({
                date: date.toISOString().split('T')[0],
                completed: isCompleted,
            });
        }
        return data;
    };

    const habits = [
        { 
            id: 'exercise',
            name: 'Exercise', 
            icon: '💪',
            value: healthData.totalWorkouts, 
            target: 5, 
            unit: 'sessions',
            streak: 5,
            color: DESIGN_SYSTEM.colors.teal,
            data: generateHabitData('exercise'),
            description: 'Stay active and energized with regular workouts'
        },
        { 
            id: 'meditation',
            name: 'Meditation', 
            icon: '🧘‍♂️',
            value: 3, 
            target: 7, 
            unit: 'sessions',
            streak: 3,
            color: DESIGN_SYSTEM.colors.accent,
            data: generateHabitData('meditation'),
            description: 'Find inner peace and focus through mindfulness'
        },
        { 
            id: 'reading',
            name: 'Reading', 
            icon: '📚',
            value: 4, 
            target: 7, 
            unit: 'sessions',
            streak: 7,
            color: DESIGN_SYSTEM.colors.success,
            data: generateHabitData('reading'),
            description: 'Expand knowledge and perspective daily'
        }
    ];

    return (
        <motion.div variants={itemVariants} className="col-span-full">
            <div className="compact-card bg-white rounded-2xl p-4 md:p-6 card-shadow border border-gray-100">
                <h2 className="text-headline text-high-contrast mb-4">Daily Habits</h2>
                
                <div className="habit-grid grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {habits.map(habit => (
                        <HabitItem
                            key={habit.id}
                            habit={habit}
                            isExpanded={expandedHabit === habit.id}
                            onToggle={() => setExpandedHabit(
                                expandedHabit === habit.id ? null : habit.id
                            )}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Main Optimized Dashboard Component
export default function DashboardOptimized(props: DashboardProps) {
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

    // Filter today's tasks
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
    });

    const nextTask = todayTasks.find(task => task.status !== 'Completed');

    return (
        <div className="dashboard-container safe-area-padding">
            <MobileOptimizedStyles />
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-4 md:space-y-6"
            >
                {/* Compact Header */}
                <CompactHeader 
                    tasks={tasks}
                    nextTask={nextTask}
                    categoryColors={categoryColors}
                />

                {/* Main Content Grid */}
                <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Tasks Section */}
                    <CompactTasksSection 
                        tasks={tasks}
                        onCompleteTask={onCompleteTask}
                        categoryColors={categoryColors}
                    />

                    {/* Health Section */}
                    <CompactHealthSection healthData={healthData} />
                </div>

                {/* Habits Section - Full Width */}
                <CompactHabitsSection healthData={healthData} />

                {/* Notes Section - Compact */}
                <motion.div variants={itemVariants} className="col-span-full">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Recent Notes</h2>
                            <button 
                                onClick={() => setScreen('Notes')}
                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                View all →
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {notes.slice(0, 3).map(note => (
                                <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-sm text-gray-900 truncate">{note.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
