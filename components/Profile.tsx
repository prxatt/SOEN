import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GiftIcon, Cog6ToothIcon, ChevronRightIcon, LinkIcon, FlagIcon, CheckCircleIcon, PlusCircleIcon, SparklesIcon, CheckIcon, HeartIcon, ClockIcon, ActivityIcon, BoltIcon } from './Icons';
import type { Screen, Goal, GoalTerm, Task, HealthData, RewardItem } from '../types';
import { REWARDS_CATALOG } from '../constants';

// GhibliPenguin Component (same as dashboard)
const GhibliPenguin: React.FC = () => {
    return (
        <motion.div
            className="relative w-full h-full"
            animate={{ 
                rotate: [0, 3, -3, 0],
                scale: [1, 1.05, 1],
                y: [0, -3, 0]
            }}
            transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
            }}
        >
            <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 30%, #4a5568 70%, #2d3748 100%)',
                    boxShadow: `
                        inset 0 3px 6px rgba(255,255,255,0.15),
                        inset 0 -3px 6px rgba(0,0,0,0.4),
                        0 6px 16px rgba(0,0,0,0.5),
                        0 0 0 2px rgba(255,255,255,0.2)
                    `,
                    transform: 'perspective(120px) rotateX(10deg) rotateY(-3deg)'
                }}
            >
                <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-7 h-6 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(255,255,255,0.3)'
                    }}
                />
                <div 
                    className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                <div 
                    className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                <svg 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-2"
                    viewBox="0 0 12 8"
                    style={{ fill: 'none', stroke: '#2d3748', strokeWidth: '1.5', strokeLinecap: 'round' }}
                >
                    <path d="M2 4 Q6 6 10 4" />
                </svg>
                <div 
                    className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-1 h-0.8 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                    }}
                />
                <div 
                    className="absolute top-4 left-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
                />
                <div 
                    className="absolute top-4 right-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
                />
            </div>
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                        left: `${20 + i * 30}%`,
                        top: `${10 + i * 20}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -10, 0]
                    }}
                    transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </motion.div>
    );
};

interface ProfileProps {
    soenFlow: number;
    setScreen: (screen: Screen) => void;
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    activeFocusBackground: string;
    setActiveFocusBackground: (bgValue: string) => void;
    purchasedRewards: string[];
    tasks?: Task[];
    healthData?: HealthData;
    activeTheme?: string;
    setActiveTheme?: (theme: string) => void;
    onPurchase?: (reward: RewardItem) => void;
}

interface GoalsHubProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const getFocusBgPreview = (value: string) => {
    switch(value) {
        case 'synthwave': return 'linear-gradient(135deg, #f5317f, #5b21b6)';
        case 'lofi': return 'linear-gradient(135deg, #4f46e5, #1e293b)';
        case 'solarpunk': return 'linear-gradient(135deg, #4ade80, #059669)';
        default: return 'linear-gradient(135deg, #6b7280, #374151)';
    }
};

function GoalsHub({ goals, setGoals }: GoalsHubProps) {
    const updateGoalText = (id: number, text: string) => setGoals(prev => prev.map(g => g.id === id ? {...g, text} : g));
    const toggleGoalStatus = (id: number) => setGoals(prev => prev.map(g => g.id === id ? {...g, status: g.status === 'active' ? 'completed' : 'active'} : g));
    const addGoal = (term: GoalTerm) => setGoals(prev => [...prev, { id: Date.now(), term, text: 'New Goal', status: 'active' }]);

    const GoalItem: React.FC<{goal: Goal}> = ({ goal }) => (
        <div className="flex items-center gap-3 p-3 bg-bg/50 rounded-lg transition-colors duration-200">
            <button onClick={() => toggleGoalStatus(goal.id)} aria-label={`Mark goal as ${goal.status === 'completed' ? 'active' : 'completed'}`} className="flex-shrink-0">
                {goal.status === 'completed' ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-text-secondary/50 hover:border-accent transition-colors" />}
            </button>
            <input type="text" value={goal.text} onChange={(e) => updateGoalText(goal.id, e.target.value)} aria-label="Goal text" className={`flex-grow bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded-sm px-1 text-sm ${goal.status === 'completed' ? 'line-through text-text-secondary' : ''}`} />
        </div>
    );

    const GoalTermCard: React.FC<{term: GoalTerm, title: string}> = ({ term, title }) => (
        <div className="card p-4 rounded-2xl flex flex-col">
            <h4 className="font-bold mb-3 text-text">{title}</h4>
            <div className="space-y-2 flex-grow min-h-[10rem]">
                {goals.filter(g => g.term === term).map(goal => <GoalItem key={goal.id} goal={goal}/>)}
            </div>
            <button onClick={() => addGoal(term)} className="mt-3 flex items-center justify-center gap-2 w-full text-sm font-semibold p-2 rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <PlusCircleIcon className="w-5 h-5" /> Add Goal
            </button>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GoalTermCard term="short" title="Short-Term (This Quarter)" />
            <GoalTermCard term="mid" title="Mid-Term (This Year)" />
            <GoalTermCard term="long" title="Long-Term (2-5 Years)" />
        </div>
    );
};

function Profile({ soenFlow, setScreen, goals, setGoals, activeFocusBackground, setActiveFocusBackground, purchasedRewards, tasks = [], healthData, activeTheme, setActiveTheme, onPurchase }: ProfileProps) {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);

  const themes = REWARDS_CATALOG.filter(r => r.type === 'theme');
  const focusBackgrounds = REWARDS_CATALOG.filter(r => r.type === 'focus_background');

  // Calculate points (same logic as DailyGreeting)
  const roundToNearestFiveOrZero = (points: number): number => {
    const rounded = Math.round(points);
    const remainder = rounded % 5;
    if (remainder === 0) return rounded;
    return rounded + (remainder <= 2 ? -remainder : 5 - remainder);
  };

  const getPriorityMultiplier = (task: Task): number => {
    const categoryWeights: Record<string, number> = {
      'Deep Work': 2.0, 'Learning': 1.8, 'Prototyping': 1.6, 'Meeting': 1.2,
      'Workout': 1.4, 'Editing': 1.3, 'Personal': 1.1, 'Admin': 0.8
    };
    return categoryWeights[task.category] || 1.0;
  };

  const getHealthImpact = (basePoints: number): number => {
    if (!healthData) return basePoints;
    const energyLevel = healthData.energyLevel || 'medium';
    const sleepQuality = healthData.sleepQuality || 'good';
    let multiplier = 1.0;
    if (energyLevel === 'low') multiplier *= 0.7;
    else if (energyLevel === 'high') multiplier *= 1.1;
    if (sleepQuality === 'poor') multiplier *= 0.8;
    else if (sleepQuality === 'good') multiplier *= 1.1;
    return roundToNearestFiveOrZero(basePoints * multiplier);
  };

  const getPomodoroStreakBonus = (): number => {
    const streak = Math.floor(Math.random() * 10) + 1;
    if (streak >= 30) return 30;
    if (streak >= 14) return 20;
    if (streak >= 7) return 10;
    return 0;
  };

  useEffect(() => {
    if (tasks.length === 0) return;
    const calculateFlowPoints = async () => {
      const completedTasks = tasks.filter(t => t.status === 'Completed');
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
      
      let totalPoints = 0;
      let dailyPoints = 0;
      
      for (const task of completedTasks) {
        let taskPoints = 10;
        const priorityMultiplier = getPriorityMultiplier(task);
        taskPoints *= priorityMultiplier;
        const healthImpact = getHealthImpact(taskPoints);
        taskPoints = healthImpact;
        const pomodoroBonus = Math.random() > 0.3 ? 5 : 0;
        taskPoints += pomodoroBonus;
        dailyPoints += taskPoints;
      }
      
      dailyPoints = Math.min(dailyPoints, 100);
      const streakBonus = getPomodoroStreakBonus();
      dailyPoints += streakBonus;
      const completionBonus = roundToNearestFiveOrZero(completionRate * 0.5);
      dailyPoints += completionBonus;
      totalPoints = roundToNearestFiveOrZero(dailyPoints);
      const newLevel = Math.floor(totalPoints / 500) + 1;
      
      setCurrentPoints(totalPoints);
      setLevel(newLevel);
    };

    calculateFlowPoints();
  }, [tasks, healthData]);

  const nextLevelPoints = level * 500;
  const progressToNext = ((currentPoints % 500) / 500) * 100;
  const insights = useMemo(() => ({
    unlockedThemes: themes.filter(t => purchasedRewards.includes(t.id) || t.cost === 0).length,
    unlockedBackgrounds: focusBackgrounds.filter(b => purchasedRewards.includes(b.id)).length
  }), [purchasedRewards, themes, focusBackgrounds]);

  const getThemePreview = (themeValue: string) => {
    const themeMap: Record<string, string[]> = {
      'obsidian': ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
      'synthwave': ['#EC4899', '#7c3aed', '#f97316', '#ef4444'],
      'solarpunk': ['#a3e635', '#16a34a', '#22c55e', '#10b981'],
      'luxe': ['#fde047', '#eab308', '#f59e0b', '#d97706'],
      'aurelian': ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
      'crimson': ['#f87171', '#dc2626', '#b91c1c', '#991b1b'],
      'oceanic': ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1']
    };
    return themeMap[themeValue] || themeMap['obsidian'];
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto pb-4">
        <h2 className="text-3xl font-bold font-display mb-6">Profile</h2>

        <div className="space-y-8">
            <motion.div 
                className="card p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            >
                <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <img 
                            src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop" 
                            alt="Pratt" 
                            className="w-24 h-24 rounded-full object-cover ring-2 ring-border"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold font-display">Pratt</h2>
                        <p className="text-md text-text-secondary">Founder, Surface Tension</p>
                        <div className="mt-2 text-sm text-text-secondary space-y-1">
                            <a href="#" className="flex items-center gap-2 hover:text-accent transition-colors"><LinkIcon className="w-4 h-4" /> surfacetension.io</a>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Full SOEN Rewards Section */}
            <motion.div 
                className="card p-6 rounded-2xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 flex-shrink-0">
                        <GhibliPenguin />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl font-display">SOEN Rewards</h3>
                        <p className="text-sm text-text-secondary">Earn points, unlock themes, and customize your experience</p>
                    </div>
                </div>

                {/* Points and Level Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-bg p-4 rounded-xl">
                        <p className="text-sm text-text-secondary mb-1">Flow Points</p>
                        <p className="text-3xl font-bold font-display flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-accent"/>
                            {soenFlow}
                        </p>
                    </div>
                    <div className="bg-bg p-4 rounded-xl">
                        <p className="text-sm text-text-secondary mb-1">Level</p>
                        <p className="text-3xl font-bold font-display">Lv {level}</p>
                        <p className="text-xs text-text-secondary mt-1">{currentPoints} / {nextLevelPoints} pts</p>
                    </div>
                    <div className="bg-bg p-4 rounded-xl">
                        <p className="text-sm text-text-secondary mb-1">Unlocked</p>
                        <p className="text-3xl font-bold font-display">{insights.unlockedThemes + insights.unlockedBackgrounds}</p>
                        <p className="text-xs text-text-secondary mt-1">{insights.unlockedThemes} themes, {insights.unlockedBackgrounds} backgrounds</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-text-secondary mb-2">
                        <span>Progress to Level {level + 1}</span>
                        <span>{roundToNearestFiveOrZero(nextLevelPoints - currentPoints)} pts needed</span>
                    </div>
                    <div className="w-full bg-bg rounded-full h-3 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-accent to-accent-hover"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Health Data Summary */}
                {healthData && (
                    <div className="mb-6 p-4 bg-bg rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <HeartIcon className="w-5 h-5 text-red-400" />
                            <h4 className="font-semibold">Health Checkpoints</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { name: 'Energy', value: healthData.energyLevel?.charAt(0).toUpperCase() + healthData.energyLevel?.slice(1) || 'Medium', icon: BoltIcon, color: healthData.energyLevel === 'high' ? '#10b981' : healthData.energyLevel === 'low' ? '#ef4444' : '#f59e0b' },
                                { name: 'Sleep', value: `${healthData.avgSleepHours || 0}h`, icon: ClockIcon, color: (healthData.avgSleepHours || 0) >= 8 ? '#10b981' : (healthData.avgSleepHours || 0) >= 6 ? '#f59e0b' : '#ef4444' },
                                { name: 'Activity', value: healthData.stepsToday ? (healthData.stepsToday >= 10000 ? 'Excellent' : healthData.stepsToday >= 5000 ? 'Good' : 'Low') : 'Good', icon: ActivityIcon, color: healthData.stepsToday && healthData.stepsToday >= 10000 ? '#10b981' : healthData.stepsToday && healthData.stepsToday >= 5000 ? '#f59e0b' : '#10b981' },
                                { name: 'Stress', value: healthData.sleepQuality === 'poor' ? 'High' : healthData.sleepQuality === 'good' ? 'Low' : 'Medium', icon: HeartIcon, color: healthData.sleepQuality === 'poor' ? '#ef4444' : healthData.sleepQuality === 'good' ? '#10b981' : '#f59e0b' }
                            ].map((metric) => (
                                <div key={metric.name} className="text-center">
                                    <div className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center bg-bg/50">
                                        <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                                    </div>
                                    <p className="text-xs text-text-secondary">{metric.name}</p>
                                    <p className="text-sm font-bold">{metric.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* App Themes Section */}
                <div className="mb-6">
                    <h4 className="font-bold mb-4 text-lg font-display">App Themes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {themes.map(theme => {
                            const isPurchased = purchasedRewards.includes(theme.id) || theme.cost === 0;
                            const isActive = activeTheme === theme.value;
                            const canAfford = soenFlow >= theme.cost;
                            const colors = getThemePreview(theme.value);
                            
                            return (
                                <motion.div
                                    key={theme.id}
                                    className="relative overflow-hidden rounded-xl border-2 transition-all"
                                    style={{
                                        borderColor: isActive ? '#667eea' : 'transparent',
                                        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 50%, ${colors[3]} 100%)`
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="p-4 bg-black/20 backdrop-blur-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-white">{theme.name}</h5>
                                                <p className="text-xs text-white/80">{theme.description}</p>
                                            </div>
                                            {isActive && (
                                                <div className="bg-white/20 rounded-full p-1">
                                                    <CheckIcon className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center gap-1.5 text-white">
                                                <SparklesIcon className="w-4 h-4" />
                                                <span className="font-bold">{theme.cost}</span>
                                            </div>
                                            {isPurchased ? (
                                                isActive ? (
                                                    <span className="text-xs px-3 py-1 bg-white/20 text-white rounded-lg">Active</span>
                                                ) : (
                                                    setActiveTheme && (
                                                        <button
                                                            onClick={() => setActiveTheme(theme.value)}
                                                            className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                                        >
                                                            Apply
                        </button>
                                                    )
                                                )
                                            ) : (
                                                onPurchase && (
                                                    <button
                                                        onClick={() => onPurchase(theme)}
                                                        disabled={!canAfford}
                                                        className="text-xs px-3 py-1 bg-white/90 hover:bg-white text-black rounded-lg disabled:bg-gray-300/80 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Purchase
                        </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <motion.div 
                className="card p-6 rounded-2xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            >
                <h3 className="font-bold mb-4 text-xl font-display flex items-center gap-2"><FlagIcon className="w-5 h-5"/> Goals Hub</h3>
                <GoalsHub goals={goals} setGoals={setGoals} />
            </motion.div>

            <motion.div
                className="card p-6 rounded-2xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
            >
                <h3 className="font-bold mb-4 text-xl font-display">Focus Backgrounds</h3>
                <p className="text-sm text-text-secondary mb-4">Select your active background for Focus Mode sessions. Purchase new ones with Flow Points.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {focusBackgrounds.map(bg => {
                        const isPurchased = purchasedRewards.includes(bg.id);
                        const isActive = activeFocusBackground === bg.value;
                        const canAfford = soenFlow >= bg.cost;
                        
                        return (
                            <motion.div
                                key={bg.id}
                                className="relative overflow-hidden rounded-xl border-2 transition-all"
                                style={{
                                    borderColor: isActive ? '#667eea' : 'transparent',
                                    background: getFocusBgPreview(bg.value),
                                    aspectRatio: '16/9'
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div className="relative p-4 h-full flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-white mb-1">{bg.name}</h5>
                                        <p className="text-xs text-white/80">{bg.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-1.5 text-white">
                                            <SparklesIcon className="w-4 h-4" />
                                            <span className="font-bold text-sm">{bg.cost}</span>
                                        </div>
                                        {isPurchased ? (
                                            isActive ? (
                                                <span className="text-xs px-3 py-1 bg-white/20 text-white rounded-lg">Active</span>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveFocusBackground(bg.value)}
                                                    className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            )
                                        ) : (
                                            onPurchase && (
                                                <button
                                                    onClick={() => onPurchase(bg)}
                                                    disabled={!canAfford}
                                                    className="text-xs px-3 py-1 bg-white/90 hover:bg-white text-black rounded-lg disabled:bg-gray-300/80 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Purchase
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="absolute top-2 right-2 bg-accent text-white rounded-full p-1 z-10">
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
            >
                 <button onClick={() => setScreen('Settings')} className="w-full flex items-center justify-between text-left p-6 rounded-2xl transition-colors card hover:bg-accent/10">
                    <div className="flex items-center gap-4">
                        <Cog6ToothIcon className="w-8 h-8 text-text-secondary"/>
                        <div>
                            <h4 className="font-bold text-lg">Settings & Integrations</h4>
                            <p className="text-sm text-text-secondary">Preferences, calendar sync, and account</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-6 h-6 text-text-secondary"/>
                </button>
            </motion.div>
        </div>
    </motion.div>
  );
};

export default Profile;