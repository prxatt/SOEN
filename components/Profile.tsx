import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GiftIcon, Cog6ToothIcon, ChevronRightIcon, LinkIcon, FlagIcon, CheckCircleIcon, PlusCircleIcon, SparklesIcon, CheckIcon, HeartIcon, ClockIcon, ActivityIcon, BoltIcon } from './Icons';
import type { Screen, Goal, GoalTerm, Task, HealthData, RewardItem } from '../types';
import { REWARDS_CATALOG, getThemeColors, getFocusBackgroundColors } from '../constants';
import { calculateFlowPoints, roundToNearestFiveOrZero } from '../utils/points';
import GhibliPenguin from './GhibliPenguin';
import { getEnergyMetric, getSleepMetric, getActivityMetric, getStressMetric } from '../utils/health';

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

/**
 * Get focus background preview gradient from REWARDS_CATALOG colors
 * Derives gradient from the first two colors of the focus background's color array
 */
const getFocusBgPreview = (value: string) => {
    const colors = getFocusBackgroundColors(value);
    if (colors.length >= 2) {
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    }
    // Fallback gradient
    return 'linear-gradient(135deg, #6b7280, #374151)';
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
            <input type="text" value={goal.text} onChange={(e) => updateGoalText(goal.id, e.target.value)} aria-label="Goal text" className={`flex-grow bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] rounded-sm px-1 text-sm ${goal.status === 'completed' ? 'line-through text-text-secondary' : ''}`} />
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

  // Use shared points calculation utility
  useEffect(() => {
    if (tasks.length === 0) {
      setCurrentPoints(0);
      setLevel(1);
      return;
    }
    
    const { totalPoints, level: calculatedLevel } = calculateFlowPoints(tasks, healthData);
    setCurrentPoints(totalPoints);
    setLevel(calculatedLevel);
  }, [tasks, healthData]);

  const nextLevelPoints = level * 500;
  const progressToNext = ((currentPoints % 500) / 500) * 100;
  const insights = useMemo(() => ({
    unlockedThemes: themes.filter(t => purchasedRewards.includes(t.id) || t.cost === 0).length,
    unlockedBackgrounds: focusBackgrounds.filter(b => purchasedRewards.includes(b.id)).length
  }), [purchasedRewards, themes, focusBackgrounds]);

  const getThemePreview = (themeValue: string) => {
    return getThemeColors(themeValue);
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
                                { name: 'Energy', ...getEnergyMetric(healthData.energyLevel), icon: BoltIcon },
                                { name: 'Sleep', ...getSleepMetric(healthData.avgSleepHours), icon: ClockIcon },
                                { name: 'Activity', ...getActivityMetric(healthData.stepsToday), icon: ActivityIcon },
                                { name: 'Stress', ...getStressMetric(healthData.sleepQuality), icon: HeartIcon }
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
                                    {isActive && (
                                        <div className="absolute top-2 right-2 bg-accent text-white rounded-full p-1 z-10">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
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