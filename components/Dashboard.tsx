import React from 'react';
import { motion, Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, Screen, Goal, Note } from '../types';
import { CATEGORY_HEX_COLORS } from '../constants';
import { ArrowUpRightIcon, BookOpenIcon, CheckCircleIcon, FireIcon, FlagIcon, PlusCircleIcon, SparklesIcon } from './Icons';

// --- PROPS ---
interface DashboardProps {
    tasks: Task[];
    notes: Note[];
    goals: Goal[];
    praxisFlow: number;
    dailyStreak: number;
    completionPercentage: number;
    setScreen: (screen: Screen) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const Widget: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className, onClick }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
        className={`card rounded-2xl p-4 flex flex-col transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
    >
        {children}
    </motion.div>
);

const GreetingWidget: React.FC = () => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
    return (
        <Widget className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-display">{greeting}, Pratt.</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Ready to turn ideas into action?</p>
        </Widget>
    );
};

const NextUpWidget: React.FC<{ tasks: Task[], setScreen: (s: Screen) => void }> = ({ tasks, setScreen }) => {
    const upcomingTasks = tasks
        .filter(t => t.status !== 'Completed' && new Date(t.startTime) > new Date())
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, 2);
    
    return (
        <Widget className="lg:col-span-2" onClick={() => setScreen('Schedule')}>
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Next Up</h3>
                <ArrowUpRightIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
            </div>
            {upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                    {upcomingTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3">
                            <div className="w-1.5 h-10 rounded-full" style={{backgroundColor: CATEGORY_HEX_COLORS[task.category]}}></div>
                            <div>
                                <p className="font-semibold">{task.title}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{task.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary flex-grow flex items-center justify-center">No upcoming tasks. Plan your day!</p>
            )}
        </Widget>
    );
};

const PerformanceMetric: React.FC<{icon: React.ReactNode, value: string | number, label: string}> = ({icon, value, label}) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-lg">{icon}</div>
        <div>
            <p className="text-xl font-bold font-display">{value}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
        </div>
    </div>
);

const PerformanceWidget: React.FC<{praxisFlow: number, dailyStreak: number, completionPercentage: number}> = ({praxisFlow, dailyStreak, completionPercentage}) => (
    <Widget className="lg:col-span-3">
         <h3 className="font-semibold text-lg mb-4">Performance</h3>
         <div className="grid grid-cols-3 gap-4">
            <PerformanceMetric icon={<SparklesIcon className="w-6 h-6 text-accent"/>} value={praxisFlow} label="Praxis Flow"/>
            <PerformanceMetric icon={<FireIcon className="w-6 h-6 text-accent"/>} value={dailyStreak} label="Day Streak"/>
            <PerformanceMetric icon={<CheckCircleIcon className="w-6 h-6 text-accent"/>} value={`${completionPercentage}%`} label="Today's Tasks"/>
         </div>
    </Widget>
);

const PrimaryGoalWidget: React.FC<{goals: Goal[], setScreen: (s: Screen) => void}> = ({goals, setScreen}) => {
    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active');
    return (
        <Widget className="lg:col-span-2" onClick={() => setScreen('KikoAI')}>
            <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><FlagIcon className="w-5 h-5"/> Primary Goal</h3>
                 <ArrowUpRightIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
            </div>
            {primaryGoal ? (
                <p className="text-sm">{primaryGoal.text}</p>
            ) : (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Set a mid-term goal to focus your efforts.</p>
            )}
        </Widget>
    );
}

const RecentNotesWidget: React.FC<{notes: Note[], setScreen: (s: Screen) => void}> = ({notes, setScreen}) => {
    const recentNotes = notes.slice(0, 2);
    return(
        <Widget className="lg:col-span-2" onClick={() => setScreen('Notes')}>
            <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><BookOpenIcon className="w-5 h-5"/> Recent Notes</h3>
                 <ArrowUpRightIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
            </div>
             <div className="space-y-2">
                {recentNotes.map(note => (
                    <div key={note.id} className="p-2 bg-light-bg dark:bg-dark-bg rounded-lg">
                        <p className="font-semibold text-sm truncate">{note.title}</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">{(note?.content || '').replace(/<[^>]*>?/gm, '')}</p>
                    </div>
                ))}
             </div>
        </Widget>
    )
}

const WeeklyActivityWidget: React.FC<{tasks: Task[]}> = ({tasks}) => {
    const data = React.useMemo(() => {
        const week = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return {
                date: d,
                name: d.toLocaleDateString('en-US', {weekday: 'short'}),
                completed: 0,
            };
        }).reverse();

        tasks.forEach(task => {
            if(task.status === 'Completed') {
                const taskDate = new Date(task.startTime).toDateString();
                const day = week.find(d => d.date.toDateString() === taskDate);
                if (day) day.completed++;
            }
        });
        return week;
    }, [tasks]);

    return (
        <Widget className="lg:col-span-3 h-64">
             <h3 className="font-semibold text-lg mb-2">Weekly Activity</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: -10 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: 'var(--color-text-secondary, #6B7280)'}} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fill: 'var(--color-text-secondary, #6B7280)'}} fontSize={12} />
                    <Tooltip cursor={{fill: 'rgba(168, 85, 247, 0.1)'}} contentStyle={{backgroundColor: 'var(--color-card, #1C1C1E)', border: '1px solid var(--color-border, #2D2D2F)', borderRadius: '0.75rem'}}/>
                    <Bar dataKey="completed" name="Tasks Completed" fill="var(--color-accent, #A855F7)" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
        </Widget>
    )
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
            <GreetingWidget />
            <PerformanceWidget praxisFlow={props.praxisFlow} dailyStreak={props.dailyStreak} completionPercentage={props.completionPercentage} />
            <NextUpWidget tasks={props.tasks} setScreen={props.setScreen} />
            <WeeklyActivityWidget tasks={props.tasks}/>
            <PrimaryGoalWidget goals={props.goals} setScreen={props.setScreen} />
            <RecentNotesWidget notes={props.notes} setScreen={props.setScreen} />
        </motion.div>
    );
};

export default Dashboard;