import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData, Goal, Screen } from '../types';
import { 
    ChartBarIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    FireIcon, 
    ArrowTrendingUpIcon,
    HeartIcon,
    BrainIcon,
    SparklesIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    BoltIcon,
    EyeIcon
} from './Icons';

// TaskFlow Design System based on https://devansh.framer.website/work/taskflow
const TASKFLOW_COLORS = {
    darkBlue: '#101C2E',
    lightBlue: '#5D8BFF', 
    teal: '#65F5ED',
    yellow: '#FCFF52',
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: {
        primary: '#101C2E',
        secondary: '#6B7280',
        light: '#9CA3AF'
    },
    gradients: {
        primary: 'linear-gradient(135deg, #5D8BFF 0%, #65F5ED 100%)',
        secondary: 'linear-gradient(135deg, #FCFF52 0%, #65F5ED 100%)',
        accent: 'linear-gradient(135deg, #101C2E 0%, #5D8BFF 100%)'
    }
} as const;

interface TaskFlowDashboardProps {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    briefing: string;
    goals: Goal[];
    setFocusTask: (task: Task | null) => void;
    dailyCompletionImage: string;
    categoryColors: Record<string, string>;
    isBriefingLoading: boolean;
    navigateToScheduleDate: (date: Date) => void;
    inferredLocation: string;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number, actualDuration?: number) => void;
}

// Micro-animations from TaskFlow design
const microAnimations = {
    card: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        hover: { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
        tap: { scale: 0.98 }
    },
    stat: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    progress: {
        initial: { width: 0 },
        animate: { width: '100%' },
        transition: { duration: 1, ease: 'easeOut' }
    }
};

// Data analysis functions
const analyzeTaskData = (tasks: Task[]) => {
    const today = new Date();
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        return taskDate.toDateString() === today.toDateString();
    });

    const completedToday = todayTasks.filter(task => task.status === 'completed').length;
    const totalToday = todayTasks.length;
    const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

    // Weekly productivity trend
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.startTime);
            return taskDate.toDateString() === date.toDateString();
        });
        const dayCompleted = dayTasks.filter(task => task.status === 'completed').length;
        const dayTotal = dayTasks.length;
        weeklyData.push({
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            completion: dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0,
            completed: dayCompleted,
            total: dayTotal
        });
    }

    return {
        todayTasks,
        completedToday,
        totalToday,
        completionRate,
        weeklyData,
        streak: calculateStreak(tasks),
        focusTime: todayTasks.reduce((acc, task) => acc + (task.actualDuration || task.plannedDuration || 0), 0)
    };
};

const calculateStreak = (tasks: Task[]): number => {
    // Simple streak calculation - consecutive days with at least one completed task
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.startTime);
            return taskDate.toDateString() === checkDate.toDateString() && task.status === 'completed';
        });
        
        if (dayTasks.length > 0) {
            streak++;
        } else if (i === 0) {
            // If today has no completed tasks, check if day is not over yet
            const now = new Date();
            if (checkDate.toDateString() === now.toDateString() && now.getHours() < 23) {
                continue; // Don't break streak if day isn't over
            } else {
                break;
            }
        } else {
            break;
        }
    }
    
    return streak;
};

// TaskFlow-inspired components
const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.FC<any>;
    gradient: string;
    delay?: number;
}> = ({ title, value, subtitle, icon: Icon, gradient, delay = 0 }) => (
    <motion.div
        variants={microAnimations.card}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay }}
        className="relative p-6 bg-white rounded-2xl border border-gray-100 overflow-hidden group cursor-pointer"
        style={{ 
            background: `linear-gradient(135deg, ${TASKFLOW_COLORS.surface} 0%, rgba(93, 139, 255, 0.02) 100%)` 
        }}
    >
        {/* Background gradient overlay */}
        <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{ background: gradient }}
        />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <div 
                    className="p-2 rounded-xl"
                    style={{ background: `${gradient}15` }}
                >
                    <Icon className="w-5 h-5" style={{ color: TASKFLOW_COLORS.lightBlue }} />
                </div>
                <motion.div
                    variants={microAnimations.stat}
                    className="text-right"
                >
                    <div className="text-2xl font-bold" style={{ color: TASKFLOW_COLORS.text.primary }}>
                        {value}
                    </div>
                </motion.div>
            </div>
            <h3 className="font-medium text-sm" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                {title}
            </h3>
            {subtitle && (
                <p className="text-xs mt-1" style={{ color: TASKFLOW_COLORS.text.light }}>
                    {subtitle}
                </p>
            )}
        </div>
    </motion.div>
);

const ProductivityChart: React.FC<{ weeklyData: any[] }> = ({ weeklyData }) => {
    const maxCompletion = Math.max(...weeklyData.map(d => d.completion));
    
    return (
        <motion.div
            variants={microAnimations.card}
            initial="initial"
            animate="animate"
            className="p-6 bg-white rounded-2xl border border-gray-100"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-semibold text-lg" style={{ color: TASKFLOW_COLORS.text.primary }}>
                        Weekly Productivity
                    </h3>
                    <p className="text-sm" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                        Task completion trends
                    </p>
                </div>
                <ArrowTrendingUpIcon className="w-6 h-6" style={{ color: TASKFLOW_COLORS.lightBlue }} />
            </div>
            
            <div className="flex items-end justify-between space-x-2 h-32">
                {weeklyData.map((day, index) => (
                    <motion.div
                        key={day.day}
                        className="flex flex-col items-center flex-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <motion.div
                            className="w-full rounded-t-lg relative"
                            style={{
                                height: `${(day.completion / 100) * 100}%`,
                                minHeight: '4px',
                                background: day.completion > 80 
                                    ? TASKFLOW_COLORS.gradients.primary
                                    : day.completion > 50 
                                    ? TASKFLOW_COLORS.gradients.secondary
                                    : `linear-gradient(135deg, ${TASKFLOW_COLORS.text.light} 0%, ${TASKFLOW_COLORS.text.secondary} 100%)`
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.completion / 100) * 100}%` }}
                            transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
                        />
                        <div className="text-xs mt-2 font-medium" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                            {day.day}
                        </div>
                        <div className="text-xs" style={{ color: TASKFLOW_COLORS.text.light }}>
                            {day.completed}/{day.total}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const QuickActions: React.FC<{ setScreen: (screen: Screen) => void; setFocusTask: (task: Task | null) => void; todayTasks: Task[] }> = ({ setScreen, setFocusTask, todayTasks }) => {
    const nextTask = todayTasks.find(task => task.status === 'pending');
    
    const actions = [
        {
            title: 'Schedule',
            subtitle: 'View timeline',
            icon: CalendarDaysIcon,
            action: () => setScreen('Schedule'),
            gradient: TASKFLOW_COLORS.gradients.primary
        },
        {
            title: 'Notes',
            subtitle: 'Quick capture',
            icon: DocumentTextIcon,
            action: () => setScreen('Notes'),
            gradient: TASKFLOW_COLORS.gradients.secondary
        },
        {
            title: 'Focus Mode',
            subtitle: nextTask ? nextTask.title : 'No pending tasks',
            icon: BoltIcon,
            action: () => nextTask && setFocusTask(nextTask),
            gradient: TASKFLOW_COLORS.gradients.accent,
            disabled: !nextTask
        },
        {
            title: 'Kiko AI',
            subtitle: 'AI assistance',
            icon: SparklesIcon,
            action: () => setScreen('Kiko'),
            gradient: TASKFLOW_COLORS.gradients.primary
        }
    ];

    return (
        <motion.div
            variants={microAnimations.card}
            initial="initial"
            animate="animate"
            className="p-6 bg-white rounded-2xl border border-gray-100"
        >
            <h3 className="font-semibold text-lg mb-4" style={{ color: TASKFLOW_COLORS.text.primary }}>
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.title}
                        onClick={action.action}
                        disabled={action.disabled}
                        className={`p-4 rounded-xl text-left transition-all duration-200 ${
                            action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{ 
                            background: `${action.gradient}08`,
                            border: `1px solid ${action.gradient}20`
                        }}
                        whileHover={!action.disabled ? { scale: 1.05 } : {}}
                        whileTap={!action.disabled ? { scale: 0.95 } : {}}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <action.icon className="w-5 h-5 mb-2" style={{ color: TASKFLOW_COLORS.lightBlue }} />
                        <div className="font-medium text-sm" style={{ color: TASKFLOW_COLORS.text.primary }}>
                            {action.title}
                        </div>
                        <div className="text-xs truncate" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                            {action.subtitle}
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};

const TaskFlowDashboard: React.FC<TaskFlowDashboardProps> = ({
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
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const taskData = analyzeTaskData(tasks);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Philosophical quote system
    const philosophicalQuotes = [
        "Progress, not perfection, is the goal.",
        "Small steps daily lead to big changes yearly.",
        "Focus on the process, not just the outcome.",
        "Every expert was once a beginner.",
        "Consistency beats intensity.",
        "Your future self will thank you for today's efforts."
    ];

    const todayQuote = philosophicalQuotes[new Date().getDate() % philosophicalQuotes.length];

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: TASKFLOW_COLORS.background }}>
            {/* Header with philosophical quote */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold" style={{ color: TASKFLOW_COLORS.text.primary }}>
                        Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}
                    </h1>
                    <div className="text-sm" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                        {currentTime.toLocaleDateString('en', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
                <p className="text-lg italic" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                    "{todayQuote}"
                </p>
            </motion.div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Today's Progress"
                    value={`${taskData.completionRate.toFixed(0)}%`}
                    subtitle={`${taskData.completedToday} of ${taskData.totalToday} tasks`}
                    icon={CheckCircleIcon}
                    gradient={TASKFLOW_COLORS.gradients.primary}
                    delay={0}
                />
                <StatCard
                    title="Focus Time"
                    value={`${Math.round(taskData.focusTime / 60)}h`}
                    subtitle="Deep work today"
                    icon={ClockIcon}
                    gradient={TASKFLOW_COLORS.gradients.secondary}
                    delay={0.1}
                />
                <StatCard
                    title="Current Streak"
                    value={taskData.streak}
                    subtitle="Consecutive days"
                    icon={FireIcon}
                    gradient={TASKFLOW_COLORS.gradients.accent}
                    delay={0.2}
                />
                <StatCard
                    title="Active Goals"
                    value={goals.filter(g => !g.completed).length}
                    subtitle="In progress"
                    icon={EyeIcon}
                    gradient={TASKFLOW_COLORS.gradients.primary}
                    delay={0.3}
                />
            </div>

            {/* Charts and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ProductivityChart weeklyData={taskData.weeklyData} />
                <QuickActions 
                    setScreen={setScreen} 
                    setFocusTask={setFocusTask} 
                    todayTasks={taskData.todayTasks} 
                />
            </div>

            {/* Health Integration Preview */}
            <motion.div
                variants={microAnimations.card}
                initial="initial"
                animate="animate"
                className="p-6 bg-white rounded-2xl border border-gray-100 mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-lg" style={{ color: TASKFLOW_COLORS.text.primary }}>
                            Health & Wellness
                        </h3>
                        <p className="text-sm" style={{ color: TASKFLOW_COLORS.text.secondary }}>
                            Integrated insights from Apple Health
                        </p>
                    </div>
                    <HeartIcon className="w-6 h-6" style={{ color: TASKFLOW_COLORS.lightBlue }} />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${TASKFLOW_COLORS.lightBlue}08` }}>
                        <div className="text-2xl font-bold" style={{ color: TASKFLOW_COLORS.text.primary }}>
                            {healthData.steps || '8,432'}
                        </div>
                        <div className="text-xs" style={{ color: TASKFLOW_COLORS.text.secondary }}>Steps</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${TASKFLOW_COLORS.teal}08` }}>
                        <div className="text-2xl font-bold" style={{ color: TASKFLOW_COLORS.text.primary }}>
                            {healthData.sleepHours || '7.5'}h
                        </div>
                        <div className="text-xs" style={{ color: TASKFLOW_COLORS.text.secondary }}>Sleep</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${TASKFLOW_COLORS.yellow}08` }}>
                        <div className="text-2xl font-bold" style={{ color: TASKFLOW_COLORS.text.primary }}>
                            {healthData.heartRate || '72'}
                        </div>
                        <div className="text-xs" style={{ color: TASKFLOW_COLORS.text.secondary }}>BPM</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TaskFlowDashboard;
