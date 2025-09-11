import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, Goal, Note, HealthData, MissionBriefing, TaskStatus, Category, Screen } from '../types';
import { SparklesIcon, BrainCircuitIcon, ArrowDownTrayIcon, KikoIcon, FlagIcon, CheckCircleIcon, SunIcon, DocumentTextIcon, BoltIcon, ChevronRightIcon, MapPinIcon, MinusIcon, ChevronDownIcon, PlayIcon, FireIcon, BookOpenIcon, LightBulbIcon } from './Icons';
import * as Icons from './Icons';
import { ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  tasks: Task[];
  notes: Note[];
  healthData: HealthData;
  briefing: MissionBriefing;
  goals: Goal[];
  setFocusTask: (task: Task) => void;
  dailyCompletionImage: string | null;
  categoryColors: Record<Category, string>;
  isBriefingLoading: boolean;
  navigateToScheduleDate: (date: Date) => void;
  inferredLocation: string | null;
  setScreen: (screen: Screen) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.4 } },
};

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};

// --- Sub-components for the new Dashboard layout ---

function WeatherWidget({ inferredLocation }: { inferredLocation: string | null }) {
    const [currentTime, setCurrentTime] = useState(new Date());

     useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formattedLocation = inferredLocation ? inferredLocation.split(',')[0] : "San Francisco";

    return (
        <div className="flex items-center justify-end gap-2 text-right">
            <div>
                <p className="text-6xl font-bold font-display tracking-tighter">72°</p>
                <p className="text-md text-text-secondary -mt-2">Sunny</p>
            </div>
            <SunIcon className="w-16 h-16 text-yellow-400" />
        </div>
    );
}


function Header({ inferredLocation }: { inferredLocation: string | null }) {
    const [timeOfDay, setTimeOfDay] = useState('evening');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const hour = currentTime.getHours();
        if (hour < 12) setTimeOfDay('morning');
        else if (hour < 18) setTimeOfDay('afternoon');
        else setTimeOfDay('evening');
        
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [currentTime]);
    
    const formattedLocation = inferredLocation ? inferredLocation.split(',')[0] : "San Francisco";

    return (
        <motion.div variants={itemVariants} className="lg:col-span-4 flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold font-display">Good {timeOfDay}, Pratt.</h2>
            </div>
            <div className="text-right">
                <WeatherWidget inferredLocation={inferredLocation} />
                <p className="text-text-secondary flex items-center justify-end gap-2 mt-1">
                    <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <span className="text-xs">•</span>
                    <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {formattedLocation}</span>
                </p>
            </div>
        </motion.div>
    );
}

const metricColors: Record<string, string> = {
    "Flow Earned": "text-chart-yellow",
    "Tasks Done": "text-chart-green",
    "Focus": "text-chart-purple",
    "Streak": "text-chart-orange",
    "Skills Unlocked": "text-chart-cyan",
    "Creative Sparks": "text-chart-pink",
    "Completed Quests": "text-chart-blue",
};

function MissionControl({ briefing, categoryColors, isBriefingLoading }: { briefing: MissionBriefing, categoryColors: Record<Category, string>, isBriefingLoading: boolean }) {
    const topCategory = briefing.focusBreakdown.length > 0 ? briefing.focusBreakdown[0].name as Category : 'Prototyping';
    const bgColor = categoryColors[topCategory] || '#374151';
    const textColor = getTextColorForBackground(bgColor);
    const tasksDoneParts = briefing.metrics.find(m => m.label.includes("Tasks Done"))?.value?.split('/');
    const todaysCompletion = tasksDoneParts && tasksDoneParts.length === 2 && Number(tasksDoneParts[1]) > 0
        ? (Number(tasksDoneParts[0]) / Number(tasksDoneParts[1])) * 100
        : 0;

    return (
        <motion.div 
            variants={itemVariants} 
            className="rounded-3xl p-6 flex flex-col justify-between h-full min-h-[300px] lg:col-span-2" 
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-bold font-display flex items-center gap-2">
                        <KikoIcon className={`w-7 h-7 ${isBriefingLoading ? 'animate-pulse' : ''}`} />
                        {isBriefingLoading ? "Connecting..." : briefing.title}
                    </h3>
                    <p className="mt-1 opacity-80 text-sm max-w-xs">{isBriefingLoading ? "Stand by, generating your daily intelligence report..." : briefing.summary}</p>
                </div>
                <div className="w-32 h-32 relative flex-shrink-0 -mr-4 -mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="60%" 
                            outerRadius="100%" 
                            data={briefing.healthRings} 
                            startAngle={90} 
                            endAngle={-270}
                            barSize={10}
                        >
                            <RadialBar background dataKey="value" cornerRadius={10} />
                            <Legend 
                                iconSize={8}
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                formatter={(value, entry) => <span style={{ color: textColor, opacity: 0.8 }}>{value}</span>}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                        <div>
                            <p className="text-4xl font-bold font-display" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)'}}>{Math.round(todaysCompletion)}%</p>
                            <p className="text-xs opacity-80 -mt-1 font-semibold">Done</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                {briefing.metrics.map(metric => {
                    const Icon = (Icons as any)[metric.icon] || SparklesIcon;
                    const colorClass = metricColors[metric.label] || 'text-current';
                    return (
                        <div key={metric.label} className="p-2.5 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.1)'}}>
                            <Icon className={`w-5 h-5 ${colorClass}`} />
                            <div>
                                <p className="text-xs font-semibold">{metric.label}</p>
                                <p className={`text-[10px] opacity-80 ${colorClass} font-bold`}>{metric.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

function UpcomingTaskCard({ task, notes, setFocusTask, categoryColors, navigateToScheduleDate }: { task: Task, notes: Note[], setFocusTask: (task: Task) => void, categoryColors: Record<Category, string>, navigateToScheduleDate: (date: Date) => void }) {
    const categoryColor = categoryColors[task.category] || '#6B7280';
    const textColor = getTextColorForBackground(categoryColor);
    const startTime = new Date(task.startTime);
    const endTime = new Date(startTime.getTime() + task.plannedDuration * 60000);
    
    const linkedNote = task.linkedNoteId ? notes.find(n => n.id === task.linkedNoteId) : null;
    const progress = task.progress || 0;
    const circumference = 2 * Math.PI * 26; // 2 * PI * radius
    const offset = circumference - (progress / 100) * circumference;

    const priorityIcons = {
        high: <BoltIcon className="w-4 h-4 text-red-400" />,
        medium: <MinusIcon className="w-4 h-4 text-amber-400"/>,
        low: <ChevronDownIcon className="w-4 h-4 text-blue-400" />,
    }

    return (
        <motion.div 
            variants={itemVariants} 
            className="p-6 rounded-3xl cursor-pointer text-white flex flex-col justify-between min-h-[300px] lg:col-span-2"
            style={{ backgroundColor: categoryColor, color: textColor }}
            onClick={() => navigateToScheduleDate(startTime)}
            whileHover={{ scale: 1.02, y: -5 }}
        >
            <div>
                <div className="flex justify-between items-center text-sm font-semibold mb-2" style={{ color: textColor, opacity: 0.8 }}>
                    <span>{task.category}</span>
                    <span className="flex items-center gap-1">{task.priority && priorityIcons[task.priority]} {task.priority}</span>
                </div>
                <h3 className="text-3xl font-bold font-display relative break-word">{task.title}</h3>
            </div>
            
            {linkedNote && (
                <div className="my-2 flex items-start gap-3 text-sm p-3 rounded-xl" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                    <DocumentTextIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Linked Note: {linkedNote.title}</span>
                        <p className="opacity-80 line-clamp-2 text-xs mt-1">{(linkedNote.content || '').replace(/<[^>]+>/g, ' ')}</p>
                    </div>
                </div>
            )}

            <div className="mt-auto flex justify-between items-center">
                <div className="text-center">
                    <p className="font-semibold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs opacity-80">{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setFocusTask(task); }} 
                    className="font-bold text-lg hover:scale-110 transition-transform relative w-16 h-16 flex items-center justify-center rounded-full group"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    aria-label="Start focus session"
                >
                    <svg className="absolute w-[60px] h-[60px] transform -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" className="opacity-20" fill="transparent"/>
                        <motion.circle
                            cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeLinecap="round" strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        />
                    </svg>
                    <PlayIcon className="w-8 h-8 transition-transform group-hover:scale-110" />
                </button>
            </div>
        </motion.div>
    );
}


function FocusAnalysis({ briefing, categoryColors }: { briefing: MissionBriefing, categoryColors: Record<Category, string> }) {
    return(
        <motion.div variants={itemVariants} className="card p-6 rounded-3xl h-full lg:col-span-2">
             <h3 className="text-xl font-bold font-display flex items-center gap-2">
                <BrainCircuitIcon className="w-6 h-6 text-accent"/> Strategic Insights
            </h3>
            <p className="text-sm mt-1 mb-3 italic text-text-secondary">{briefing.commentary}</p>
            <div className="flex flex-col md:flex-row gap-4 items-center h-full">
                <div className="md:w-1/2 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                         <RadialBarChart 
                            data={briefing.focusBreakdown.map(item => ({...item, name: item.name.substring(0, 10)}))}
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={10}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <RadialBar background dataKey='value' cornerRadius={5}>
                                {briefing.focusBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </RadialBar>
                            <Tooltip contentStyle={{
                                background: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.5rem'
                            }}/>
                             <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} layout="vertical" verticalAlign="middle" align="right" />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="md:w-1/2 space-y-1.5">
                    {briefing.categoryAnalysis.slice(0, 3).map(({ category, analysis }) => (
                        <div key={category} className="flex items-start gap-2 text-xs p-1.5 bg-bg/50 rounded-md">
                            <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: categoryColors[category as Category] || '#6B7280' }} />
                            <div>
                                <span className="font-semibold">{category}:</span>
                                <span className="text-text-secondary ml-1">{analysis}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function UnlockInsightsCard() {
    return (
        <motion.div variants={itemVariants} className="card p-6 rounded-3xl h-full lg:col-span-2 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <BrainCircuitIcon className="w-7 h-7 text-accent" />
            </div>
            <h4 className="font-bold text-lg">Unlock Strategic Insights</h4>
            <p className="text-text-secondary text-sm mt-1">Complete all of your tasks for today to generate Kiko's analysis.</p>
        </motion.div>
    );
}

function DailyReward({ imageUrl, tasks }: { imageUrl: string, tasks: Task[] }) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Praxis-Daily-Reward-${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl relative overflow-hidden group lg:col-span-2">
             <img src={imageUrl} alt="Daily reward" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            <div className="relative flex flex-col justify-between h-full min-h-[250px] text-white p-6">
                <div>
                    <h3 className="text-2xl font-bold font-display flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6"/> Daily Reward
                    </h3>
                    <p className="text-sm mt-1 mb-3 opacity-80 line-clamp-2">For completing: {tasks.map(t=>t.title).join(', ')}</p>
                </div>
                <div className="mt-auto flex justify-between items-center">
                    <p className="text-xs font-mono opacity-60">Praxis AI</p>
                    <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4"/> Download
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

function PrimaryGoal({ goal }: { goal: Goal }) {
    return (
        <motion.div variants={itemVariants} className="card p-6 rounded-3xl h-full lg:col-span-2">
            <h4 className="font-bold font-display text-xl flex items-center gap-2"><FlagIcon className="w-5 h-5 text-accent"/> Primary Goal</h4>
            <p className="text-text-secondary mt-2 text-md">{goal.text}</p>
        </motion.div>
    );
}

function RecentNotes({ notes, onNavigate }: { notes: Note[], onNavigate: (screen: Screen) => void }) {
    const recentNotes = [...notes]
        .filter(n => !n.deletedAt)
        .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
    
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (recentNotes.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % recentNotes.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [recentNotes.length]);

    if (recentNotes.length === 0) {
        return (
             <motion.div variants={itemVariants} className="card p-6 rounded-3xl h-full lg:col-span-2 flex flex-col items-center justify-center text-center">
                 <DocumentTextIcon className="w-10 h-10 text-text-secondary mb-3"/>
                <h4 className="font-bold text-lg">No Recent Notes</h4>
                <p className="text-text-secondary text-sm mt-1">Create a note to see it here.</p>
            </motion.div>
        );
    }
    
    const activeNote = recentNotes[activeIndex];
    
    return (
        <motion.button 
            variants={itemVariants} 
            onClick={() => onNavigate('Notes')}
            className="card p-6 rounded-3xl h-full lg:col-span-2 text-left"
            whileHover={{ scale: 1.02, y: -5 }}
        >
            <h4 className="font-bold font-display text-xl flex items-center gap-2 mb-2"><BookOpenIcon className="w-5 h-5 text-accent"/> Recent Notes</h4>
             <div className="relative h-24 overflow-hidden">
                <AnimatePresence>
                    <motion.div
                        key={activeNote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        <h5 className="font-bold text-lg">{activeNote.title}</h5>
                        <p className="text-text-secondary text-sm mt-1 line-clamp-3">
                            {(activeNote.content || '').replace(/<[^>]+>/g, ' ')}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex gap-1.5 mt-2">
                {recentNotes.map((_, index) => (
                    <div key={index} className="flex-1 h-1 rounded-full bg-border/50">
                        <div 
                            className={`h-full rounded-full bg-accent transition-all duration-[4000ms] ease-linear ${index === activeIndex ? 'w-full' : 'w-0'}`}
                        />
                    </div>
                ))}
            </div>
        </motion.button>
    )
}

// --- Main Dashboard Component ---

function Dashboard({ tasks, notes, briefing, goals, setFocusTask, dailyCompletionImage, categoryColors, isBriefingLoading, navigateToScheduleDate, inferredLocation, setScreen }: DashboardProps) {
    
    const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString());
    const allTodaysTasksCompleted = todaysTasks.length > 0 && todaysTasks.every(t => t.status === TaskStatus.Completed);
    
    const sortedFutureTasks = tasks
        .filter(t => t.status !== TaskStatus.Completed && new Date(t.startTime) >= new Date(new Date().setHours(0,0,0,0)))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
    const upcomingTask = sortedFutureTasks[0] || null;

    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active');

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
            <Header inferredLocation={inferredLocation} />
            
            <MissionControl briefing={briefing} categoryColors={categoryColors} isBriefingLoading={isBriefingLoading} />

            {upcomingTask ? (
                <UpcomingTaskCard task={upcomingTask} notes={notes} setFocusTask={setFocusTask} categoryColors={categoryColors} navigateToScheduleDate={navigateToScheduleDate} />
            ) : (
                <motion.div variants={itemVariants} className="card p-6 rounded-3xl flex flex-col items-center justify-center text-center h-full min-h-[300px] lg:col-span-2">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4"/>
                    <h4 className="font-bold text-2xl">All Tasks Done!</h4>
                    <p className="text-lg text-text-secondary mt-1">Great work. Time to plan tomorrow.</p>
                </motion.div>
            )}

            <RecentNotes notes={notes} onNavigate={setScreen} />
            
            {allTodaysTasksCompleted ? (
                 <FocusAnalysis briefing={briefing} categoryColors={categoryColors} />
            ) : (
                <UnlockInsightsCard />
            )}

            {primaryGoal && <PrimaryGoal goal={primaryGoal} />}
            
            {dailyCompletionImage && <DailyReward imageUrl={dailyCompletionImage} tasks={todaysTasks.filter(t => t.status === TaskStatus.Completed)} />}
            
        </motion.div>
    );
};

export default Dashboard;