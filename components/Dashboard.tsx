

import React from 'react';
import { motion } from 'framer-motion';
import { Task, Goal, HealthData, MissionBriefing, TaskStatus, Category } from '../types';
import { SparklesIcon, CheckCircleIcon, BrainCircuitIcon, FireIcon, ArrowDownTrayIcon } from './Icons';
import * as Icons from './Icons';
import { ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { getTodaysTaskCompletion } from '../utils/taskUtils';

interface DashboardProps {
  tasks: Task[];
  healthData: HealthData;
  briefing: MissionBriefing;
  goals: Goal[];
  setFocusTask: (task: Task) => void;
  dailyCompletionImage: string | null;
  categoryColors: Record<Category, string>;
  isBriefingLoading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

interface MetricCardProps {
  metric: { label: string; value: string; icon: string };
}

function MetricCard({ metric }: MetricCardProps) {
    const Icon = (Icons as any)[metric.icon] || SparklesIcon;
    return (
        <div className="card p-3 rounded-lg flex items-center gap-3">
            <Icon className="w-6 h-6 text-accent" />
            <div>
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="text-xs text-text-secondary">{metric.value}</p>
            </div>
        </div>
    );
};

interface StrategicInsightsProps {
  briefing: MissionBriefing;
  categoryColors: Record<Category, string>;
}

function StrategicInsights({ briefing, categoryColors }: StrategicInsightsProps) {
    return (
        <div className="card p-4 rounded-2xl">
            <h3 className="text-lg font-bold font-display text-accent flex items-center gap-2">
                <BrainCircuitIcon className="w-5 h-5"/> Strategic Insights
            </h3>
            <p className="text-sm mt-1 mb-4 italic">{briefing.commentary}</p>
            <div className="space-y-2">
                {briefing.categoryAnalysis.slice(0, 3).map(({ category, analysis }) => (
                    <div key={category} className="flex items-start gap-3 text-sm p-2 bg-bg/50 rounded-lg">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColors[category as Category] || '#6B7280' }} />
                        <div>
                            <span className="font-semibold">{category}:</span>
                            <span className="text-text-secondary ml-1">{analysis}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface DailyRewardProps {
  imageUrl: string;
}

function DailyReward({ imageUrl }: DailyRewardProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Praxis-Daily-Reward-${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div variants={itemVariants} className="card p-4 rounded-2xl flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 relative group">
                <img src={imageUrl} alt="Daily reward" className="w-32 h-56 rounded-lg object-cover shadow-lg" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button onClick={handleDownload} title="Download Image" className="p-3 bg-white/20 text-white rounded-full backdrop-blur-sm hover:bg-white/30"><ArrowDownTrayIcon className="w-6 h-6"/></button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold font-display text-accent flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5"/> Daily Completion Reward
                </h3>
                <p className="text-sm mt-1 mb-2">You've completed all tasks for today! Here is your unique AI-generated reward image.</p>
                <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-semibold py-2 px-3 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                    <ArrowDownTrayIcon className="w-4 h-4"/> Download Wallpaper
                </button>
            </div>
        </motion.div>
    );
};


function Dashboard({ tasks, healthData, briefing, goals, setFocusTask, dailyCompletionImage, categoryColors, isBriefingLoading }: DashboardProps) {

    const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString());
    const upcomingTask = todaysTasks.find(t => t.status !== TaskStatus.Completed && new Date(t.startTime) > new Date());
    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active');
    const todaysCompletion = getTodaysTaskCompletion(tasks);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold font-display">Dashboard</h2>
        <p className="text-text-secondary">Your daily intelligence report, Agent.</p>
      </motion.div>

      {/* Daily Reward */}
      {dailyCompletionImage && <DailyReward imageUrl={dailyCompletionImage} />}

      {/* Mission Briefing */}
      <motion.div variants={itemVariants} className="card p-4 rounded-2xl">
        <h3 className="text-lg font-bold font-display text-accent flex items-center gap-2">
          <SparklesIcon className={`w-5 h-5 ${isBriefingLoading ? 'animate-pulse' : ''}`}/> 
          {isBriefingLoading ? "Connecting to Praxis AI..." : briefing.title}
        </h3>
        <p className="text-sm mt-1 mb-4">{isBriefingLoading ? "Stand by, syncing with Kiko to generate your daily intelligence report..." : briefing.summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {briefing.metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
        </div>
      </motion.div>
      
      {/* Strategic Insights */}
      <motion.div variants={itemVariants}>
        <StrategicInsights briefing={briefing} categoryColors={categoryColors} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Task & Goal */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            {upcomingTask && (
                <div className="card p-4 rounded-2xl">
                    <h4 className="font-semibold mb-2">Next Up</h4>
                    <div className="border-l-4 p-3 -ml-4" style={{borderColor: categoryColors[upcomingTask.category] || '#6B7280'}}>
                        <p className="font-bold">{upcomingTask.title}</p>
                        <p className="text-sm text-text-secondary">{new Date(upcomingTask.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &bull; {upcomingTask.plannedDuration} min</p>
                    </div>
                    <button onClick={() => setFocusTask(upcomingTask)} className="mt-3 w-full text-center p-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition-colors">
                        Enter Focus Mode
                    </button>
                </div>
            )}
            {primaryGoal && (
                 <div className="card p-4 rounded-2xl">
                    <h4 className="font-semibold mb-2">Primary Goal</h4>
                    <p className="text-sm">{primaryGoal.text}</p>
                </div>
            )}
        </motion.div>

        {/* Right Column: Health & Focus */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card p-4 rounded-2xl">
            <h4 className="font-semibold mb-2">Health & Focus</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
                <div className="relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="50%" outerRadius="100%" data={briefing.healthRings} startAngle={90} endAngle={-270}>
                            <RadialBar background dataKey="value" cornerRadius={10}>
                                {briefing.healthRings.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                            </RadialBar>
                            <Tooltip />
                        </RadialBarChart>
                    </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center">
                            <p className="text-4xl font-bold font-display">{todaysCompletion}%</p>
                            <p className="text-xs text-text-secondary">Today's Tasks</p>
                         </div>
                    </div>
                </div>
                <div>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={briefing.focusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} cornerRadius={5}>
                                {briefing.focusBreakdown.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                            </Pie>
                             <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;