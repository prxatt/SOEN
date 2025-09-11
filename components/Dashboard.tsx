import React, { useState, useMemo } from 'react';
// FIX: Import Variants type from framer-motion to correctly type animation variants.
import { motion, Variants } from 'framer-motion';
// FIX: Import XAxis and YAxis from recharts for use in the BarChart component.
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Tooltip, XAxis, YAxis } from 'recharts';
import { Screen, Task, Note, HealthData, Goal, Category, MissionBriefing } from '../types';
import { 
    SparklesIcon, BrainCircuitIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon, ArrowRightIcon
} from './Icons';
import * as Icons from './Icons'; // For dynamic icon loading

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
    setScreen: (screen: Screen) => void;
    inferredLocation: string | null;
}

// FIX: Explicitly type animation variants with the Variants type to prevent type inference issues.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  },
};

// FIX: Explicitly type animation variants with the Variants type to prevent type inference issues.
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Header = ({ tasksTodayCount }: { tasksTodayCount: number }) => {
    const today = new Date();
    return (
        <motion.div variants={itemVariants} className="col-span-full mb-2">
            <p className="text-lg text-text-secondary">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-4xl font-bold font-display text-text">
                {getGreeting()}, Pratt.
            </h1>
            <p className="text-xl font-display text-text-secondary mt-1">
                You have {tasksTodayCount} mission{tasksTodayCount !== 1 ? 's' : ''} today.
            </p>
        </motion.div>
    );
};

const AgendaCard = ({ todayTasks, tomorrowTasks, navigateToScheduleDate, categoryColors, setFocusTask }: {
    todayTasks: Task[],
    tomorrowTasks: Task[],
    navigateToScheduleDate: (date: Date) => void,
    categoryColors: Record<Category, string>,
    setFocusTask: (task: Task | null) => void,
}) => {
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
    const tasksToShow = activeTab === 'today' ? todayTasks : tomorrowTasks;
    const nextTask = todayTasks.find(t => t.status !== 'Completed');

    const handleTaskClick = (task: Task) => {
        navigateToScheduleDate(new Date(task.startTime));
    };

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2 row-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 p-1 bg-bg rounded-full">
                    <button onClick={() => setActiveTab('today')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'today' ? 'bg-zinc-800 text-white' : 'text-text-secondary'}`}>
                        Today ({todayTasks.length})
                    </button>
                    <button onClick={() => setActiveTab('tomorrow')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'tomorrow' ? 'bg-zinc-800 text-white' : 'text-text-secondary'}`}>
                        Tomorrow ({tomorrowTasks.length})
                    </button>
                </div>
                {nextTask && (
                    <button 
                        onClick={() => setFocusTask(nextTask)}
                        className="text-sm font-semibold px-4 py-2 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors flex items-center gap-2"
                    >
                        Focus <ArrowRightIcon className="w-4 h-4"/>
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3">
                {tasksToShow.length > 0 ? tasksToShow.map(task => (
                    <motion.button 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)}
                        className="w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-colors hover:bg-bg/50"
                        style={{ backgroundColor: `${categoryColors[task.category]}20` }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex flex-col items-center">
                            <p className="font-bold text-lg">{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                            <p className="text-xs text-text-secondary">{task.plannedDuration}min</p>
                        </div>
                        <div className="w-1 h-10 rounded-full" style={{ backgroundColor: categoryColors[task.category] }}/>
                        <div>
                            <p className={`font-bold ${task.status === 'Completed' ? 'line-through text-text-secondary' : 'text-text'}`}>{task.title}</p>
                            <p className="text-xs text-text-secondary">{task.category}</p>
                        </div>
                    </motion.button>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-8">
                        <CalendarDaysIcon className="w-12 h-12 mb-2 opacity-50"/>
                        <p className="font-semibold">No tasks scheduled for {activeTab}.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const MissionBriefingCard = ({ briefing, isLoading }: { briefing: MissionBriefing, isLoading: boolean }) => {
    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-1 row-span-2 flex flex-col bg-gradient-to-br from-card to-zinc-900/50 dark:from-zinc-900 dark:to-black/50">
            <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-2">
                <BrainCircuitIcon className="w-6 h-6 text-accent"/> Mission Briefing
            </h3>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-text-secondary">
                    <p className="animate-pulse">Connecting to Praxis AI...</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-text-secondary mb-4">{briefing.summary}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {briefing.healthRings.map(ring => (
                            <div key={ring.name} className="text-center bg-bg/30 p-2 rounded-xl">
                                <p className="text-xs font-semibold text-text-secondary">{ring.name}</p>
                                <p className="font-bold text-lg" style={{color: ring.fill}}>{ring.value}%</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-bg/30 p-3 rounded-xl mb-4">
                        <p className="text-xs font-bold text-accent mb-1">Kiko's Commentary</p>
                        <p className="text-sm">{briefing.commentary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-sm mt-auto">
                        {briefing.metrics.slice(0, 4).map(metric => {
                            const Icon = (Icons as any)[metric.icon] || SparklesIcon;
                            return (
                                <div key={metric.label} className="bg-bg/30 p-2 rounded-xl">
                                    <p className="font-bold text-lg">{metric.value}</p>
                                    <p className="text-xs text-text-secondary flex items-center justify-center gap-1"><Icon className="w-3 h-3"/> {metric.label}</p>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </motion.div>
    );
};

const FocusBreakdownCard = ({ todayTasks, categoryColors }: { todayTasks: Task[], categoryColors: Record<Category, string> }) => {
    const focusData = useMemo(() => {
        const breakdown = todayTasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + task.plannedDuration;
            return acc;
        }, {} as Record<Category, number>);

        return Object.entries(breakdown).map(([name, value]) => ({
            name, value, fill: categoryColors[name as Category] || '#8884d8'
        }));
    }, [todayTasks, categoryColors]);

    if (focusData.length === 0) return null;

    return (
        <motion.div variants={itemVariants} className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-2">
            <h3 className="text-lg font-bold font-display mb-2">Today's Focus</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} width={80} />
                        <Tooltip cursor={{ fill: 'rgba(128,128,128,0.1)' }} contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }} />
                        <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                            {focusData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const RecentNoteCard = ({ notes, setScreen }: { notes: Note[], setScreen: (s: Screen) => void }) => {
    const recentNote = useMemo(() => {
        return [...notes].filter(n => !n.deletedAt).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    }, [notes]);

    if (!recentNote) return null;

    return (
        <motion.button 
            variants={itemVariants} 
            onClick={() => setScreen('Notes')}
            className="card rounded-3xl p-4 sm:p-6 col-span-full md:col-span-1 text-left"
            whileHover={{ y: -5 }}
        >
            <h3 className="text-lg font-bold font-display mb-2 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5 text-accent"/> Recent Note</h3>
            <p className="font-bold">{recentNote.title}</p>
            <p className="text-sm text-text-secondary mt-1 line-clamp-3" dangerouslySetInnerHTML={{ __html: recentNote.content }}/>
            <div className="mt-3 text-xs text-text-secondary">
                Updated {new Date(recentNote.updatedAt).toLocaleDateString()}
            </div>
        </motion.button>
    );
}

export default function Dashboard(props: DashboardProps) {
    const { tasks, notes, briefing, isBriefingLoading, navigateToScheduleDate, categoryColors, setFocusTask, setScreen } = props;
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayTasks = useMemo(() => tasks
        .filter(t => new Date(t.startTime).toDateString() === today.toDateString())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), 
    [tasks, today]);
    
    const tomorrowTasks = useMemo(() => tasks
        .filter(t => new Date(t.startTime).toDateString() === tomorrow.toDateString())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), 
    [tasks, tomorrow]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            <Header tasksTodayCount={todayTasks.length} />
            
            <AgendaCard 
                todayTasks={todayTasks} 
                tomorrowTasks={tomorrowTasks} 
                navigateToScheduleDate={navigateToScheduleDate} 
                categoryColors={categoryColors}
                setFocusTask={setFocusTask}
            />
            
            <MissionBriefingCard briefing={briefing} isLoading={isBriefingLoading} />
            
            <FocusBreakdownCard todayTasks={todayTasks} categoryColors={categoryColors} />

            <RecentNoteCard notes={notes} setScreen={setScreen} />

            {props.dailyCompletionImage && (
                <motion.div variants={itemVariants} className="card rounded-3xl p-4 col-span-full overflow-hidden relative aspect-[2/1]">
                     <img src={props.dailyCompletionImage} alt="Daily completion reward" className="absolute inset-0 w-full h-full object-cover"/>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                     <div className="relative z-10 text-white p-2">
                        <h3 className="font-bold text-xl">Daily Reward Unlocked</h3>
                        <p className="text-sm opacity-80">All missions complete. Well done.</p>
                     </div>
                </motion.div>
            )}
        </motion.div>
    );
}