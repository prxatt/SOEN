import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthData, Note, Task } from '../types';
import { safeGet, safeFormatNumber, createSafeHealthData } from '../utils/validation';
import { 
    HeartIcon, BoltIcon, ClockIcon, SparklesIcon, 
    FireIcon, CheckCircleIcon, PlayIcon, PauseIcon,
    SunIcon, CloudIcon, ChevronDownIcon, ChevronRightIcon
} from './Icons';

interface IntegratedHealthInsightsProps {
    healthData: HealthData;
    notes: Note[];
    tasks: Task[];
}

// Enhanced 3D-style icons with depth and shadows
const Icon3D = ({ children, className = "", color = "#ffffff", floating = false, size = "w-6 h-6" }: { 
    children: React.ReactNode; 
    className?: string; 
    color?: string;
    floating?: boolean;
    size?: string;
}) => (
    <div 
        className={`relative icon-3d ${floating ? 'icon-float' : ''} ${className}`}
        style={{
            filter: `drop-shadow(0 6px 12px ${color}30) drop-shadow(0 3px 6px ${color}20) drop-shadow(0 1px 2px ${color}10)`,
            transform: 'perspective(1000px) rotateX(8deg) rotateY(-8deg)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        <div className={`${size} flex items-center justify-center`} style={{ color }}>
            {children}
        </div>
    </div>
);

// Compact Sleep & Energy Insights
const SleepInsights = ({ healthData, notes, tasks }: { 
    healthData: HealthData; 
    notes: Note[]; 
    tasks: Task[];
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // AI-powered sleep analysis based on notes and tasks
    const sleepAnalysis = useMemo(() => {
        const recentNotes = notes.filter(note => 
            new Date(note.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
        
        const stressKeywords = ['stress', 'tired', 'exhausted', 'overwhelmed', 'anxiety', 'worry'];
        const energyKeywords = ['energy', 'motivated', 'focused', 'productive', 'excited'];
        
        const stressLevel = recentNotes.reduce((acc, note) => {
            const content = note.content.toLowerCase();
            return acc + stressKeywords.reduce((count, keyword) => 
                count + (content.includes(keyword) ? 1 : 0), 0
            );
        }, 0);
        
        const energyLevel = recentNotes.reduce((acc, note) => {
            const content = note.content.toLowerCase();
            return acc + energyKeywords.reduce((count, keyword) => 
                count + (content.includes(keyword) ? 1 : 0), 0
            );
        }, 0);
        
        const taskLoad = tasks.filter(t => 
            new Date(t.startTime).toDateString() === new Date().toDateString()
        ).length;
        
        let recommendation = "";
        let priority = "medium";
        
        if (safeGet(healthData, 'avgSleepHours', 0) < 6) {
            recommendation = "Consider lighter tasks today - your sleep data suggests you need more rest.";
            priority = "high";
        } else if (stressLevel > energyLevel && taskLoad > 5) {
            recommendation = "Balance your day with physical activity. Your notes suggest stress - try a 10-minute walk.";
            priority = "high";
        } else if (safeGet(healthData, 'avgSleepHours', 0) >= 7 && energyLevel > stressLevel) {
            recommendation = "Great energy! Perfect day for challenging tasks and new projects.";
            priority = "low";
        } else {
            recommendation = "Your sleep and energy are balanced. Focus on maintaining your routine.";
            priority = "medium";
        }
        
        return {
            recommendation,
            priority,
            stressLevel,
            energyLevel,
            taskLoad
        };
    }, [healthData, notes, tasks]);
    
    const getSleepIcon = () => {
        if (safeGet(healthData, 'avgSleepHours', 0) >= 8) return <SunIcon className="w-5 h-5" />;
        if (safeGet(healthData, 'avgSleepHours', 0) >= 6) return <CloudIcon className="w-5 h-5" />;
        return <div className="w-5 h-5 flex items-center justify-center">🌙</div>;
    };
    
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };
    
    return (
        <motion.div 
            className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon3D color="#3b82f6" floating={true} size="w-8 h-8">
                        {getSleepIcon()}
                    </Icon3D>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Sleep & Energy</h3>
                        <p className="text-gray-400 text-xs">{safeGet(healthData, 'avgSleepHours', 0)}h • {safeGet(healthData, 'sleepQuality', 'good')} quality</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRightIcon className="w-4 h-4 text-white" />
                </motion.div>
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    sleepAnalysis.priority === 'high' ? 'bg-red-400' : 
                                    sleepAnalysis.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                }`} />
                                <span className={`text-xs font-medium ${getPriorityColor(sleepAnalysis.priority)}`}>
                                    {sleepAnalysis.priority === 'high' ? 'High Priority' : 
                                     sleepAnalysis.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                                </span>
                            </div>
                            
                            <p className="text-white/90 text-xs leading-relaxed">
                                {sleepAnalysis.recommendation}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-lg font-bold text-white">{sleepAnalysis.stressLevel}</p>
                                    <p className="text-xs text-gray-400">Stress</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{sleepAnalysis.energyLevel}</p>
                                    <p className="text-xs text-gray-400">Energy</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{sleepAnalysis.taskLoad}</p>
                                    <p className="text-xs text-gray-400">Tasks</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Compact Interactive Habit Tracker
const InteractiveHabits = ({ healthData }: { healthData: HealthData }) => {
    const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
    const [habitProgress, setHabitProgress] = useState<Record<string, number>>({
        exercise: 0,
        meditation: 0,
        reading: 0,
        journaling: 0
    });
    
    const habits = [
        {
            id: 'exercise',
            name: 'Exercise',
            icon: <BoltIcon className="w-4 h-4" />,
            color: '#00D9FF',
            description: 'Physical activity for energy',
            benefits: ['Energy', 'Sleep', 'Focus'],
            currentStreak: 5,
            target: 7
        },
        {
            id: 'meditation',
            name: 'Meditation',
            icon: <SparklesIcon className="w-4 h-4" />,
            color: '#A855F7',
            description: 'Mindfulness practice',
            benefits: ['Stress relief', 'Focus', 'Balance'],
            currentStreak: 3,
            target: 7
        },
        {
            id: 'reading',
            name: 'Reading',
            icon: <div className="w-4 h-4 flex items-center justify-center">📚</div>,
            color: '#06D6A0',
            description: 'Knowledge growth',
            benefits: ['Learning', 'Focus', 'Stimulation'],
            currentStreak: 7,
            target: 7
        },
        {
            id: 'journaling',
            name: 'Journaling',
            icon: <HeartIcon className="w-4 h-4" />,
            color: '#FFD60A',
            description: 'Self-reflection',
            benefits: ['Awareness', 'Clarity', 'Release'],
            currentStreak: 2,
            target: 5
        }
    ];
    
    const handleHabitClick = (habitId: string) => {
        setSelectedHabit(selectedHabit === habitId ? null : habitId);
    };
    
    const handleProgressUpdate = (habitId: string, increment: boolean) => {
        setHabitProgress(prev => ({
            ...prev,
            [habitId]: Math.max(0, Math.min(100, prev[habitId] + (increment ? 10 : -10)))
        }));
    };
    
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
                <Icon3D color="#8b5cf6" floating={true} size="w-6 h-6">
                    <FireIcon className="w-4 h-4" />
                </Icon3D>
                <h3 className="text-white font-semibold text-sm">Daily Habits</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {habits.map((habit) => (
                    <motion.div
                        key={habit.id}
                        className={`relative bg-white/5 rounded-lg p-3 border border-white/10 cursor-pointer transition-all duration-300 ${
                            selectedHabit === habit.id ? 'ring-2 ring-purple-400/50' : ''
                        }`}
                        onClick={() => handleHabitClick(habit.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Icon3D color={habit.color} size="w-6 h-6">
                                <div style={{ color: habit.color }}>
                                    {habit.icon}
                                </div>
                            </Icon3D>
                            <div className="text-right">
                                <p className="text-white font-bold text-sm">{habit.currentStreak}</p>
                                <p className="text-gray-400 text-xs">days</p>
                            </div>
                        </div>
                        
                        <h4 className="text-white font-semibold text-xs mb-1">{habit.name}</h4>
                        <p className="text-gray-400 text-xs mb-2">{habit.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                            <motion.div
                                className="h-1.5 rounded-full"
                                style={{ 
                                    backgroundColor: habit.color,
                                    width: `${(habit.currentStreak / habit.target) * 100}%`
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(habit.currentStreak / habit.target) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            />
                        </div>
                        
                        {/* Interactive Controls */}
                        {selectedHabit === habit.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400">Progress</span>
                                    <span className="text-xs text-white font-semibold">{habitProgress[habit.id]}%</span>
                                </div>
                                
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProgressUpdate(habit.id, false);
                                        }}
                                        className="flex-1 py-1 px-2 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProgressUpdate(habit.id, true);
                                        }}
                                        className="flex-1 py-1 px-2 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                
                                <div className="mt-2">
                                    <div className="flex flex-wrap gap-1">
                                        {habit.benefits.map((benefit, index) => (
                                            <span key={index} className="text-xs bg-white/10 text-white px-1.5 py-0.5 rounded">
                                                {benefit}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// Compact Physical Activity Insights - AI/LLM NOTE: Uses safe validation to prevent crashes
const PhysicalActivityInsights = ({ healthData }: { healthData: HealthData }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // AI/LLM NOTE: Always use safeGet to prevent "Cannot read properties of undefined" errors
    const activityLevel = useMemo(() => {
        const steps = safeGet(healthData, 'stepsToday', 0);
        if (steps >= 10000) return { level: 'high', color: '#10B981', message: 'Excellent!' };
        if (steps >= 5000) return { level: 'medium', color: '#F59E0B', message: 'Good progress!' };
        return { level: 'low', color: '#EF4444', message: 'Time to move!' };
    }, [healthData.stepsToday]);
    
    return (
        <motion.div 
            className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon3D color={activityLevel.color} floating={true} size="w-8 h-8">
                        <HeartIcon className="w-5 h-5" style={{ color: activityLevel.color }} />
                    </Icon3D>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Physical Activity</h3>
                        <p className="text-gray-400 text-xs">{activityLevel.message}</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRightIcon className="w-4 h-4 text-white" />
                </motion.div>
            </div>
            
            <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-xl">{safeFormatNumber(healthData.stepsToday, '0')}</span>
                    <span className="text-gray-400 text-xs">steps today</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: activityLevel.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(safeGet(healthData, 'stepsToday', 0) / 10000 * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                    />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400">
                    <span>0</span>
                    <span>Goal: 10,000</span>
                </div>
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{healthData.totalWorkouts}</p>
                                <p className="text-xs text-gray-400">Workouts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{healthData.avgSleepHours}h</p>
                                <p className="text-xs text-gray-400">Avg Sleep</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Main Integrated Health Insights Component
export default function IntegratedHealthInsights({ healthData, notes, tasks }: IntegratedHealthInsightsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 space-y-4"
        >
            {/* Sleep & Energy Insights */}
            <SleepInsights healthData={healthData} notes={notes} tasks={tasks} />
            
            {/* Physical Activity Insights */}
            <PhysicalActivityInsights healthData={healthData} />
            
            {/* Interactive Habits */}
            <InteractiveHabits healthData={healthData} />
        </motion.div>
    );
}
