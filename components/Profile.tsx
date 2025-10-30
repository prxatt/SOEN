import React from 'react';
import { motion } from 'framer-motion';
import { GiftIcon, Cog6ToothIcon, ChevronRightIcon, LinkIcon, FlagIcon, CheckCircleIcon, PlusCircleIcon, SparklesIcon, CheckIcon } from './Icons';
import type { Screen, Goal, GoalTerm } from '../types';
import { REWARDS_CATALOG } from '../constants';

interface ProfileProps {
    soenFlow: number;
    setScreen: (screen: Screen) => void;
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    activeFocusBackground: string;
    setActiveFocusBackground: (bgValue: string) => void;
    purchasedRewards: string[];
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

function Profile({ soenFlow, setScreen, goals, setGoals, activeFocusBackground, setActiveFocusBackground, purchasedRewards }: ProfileProps) {
  const focusBackgrounds = REWARDS_CATALOG.filter(r => r.type === 'focus_background' && purchasedRewards.includes(r.id));
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

            <motion.div 
                className="card p-6 rounded-2xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
                <h3 className="font-bold mb-4 text-xl font-display">Soen Flow & Rewards</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center bg-bg p-4 rounded-xl">
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <p className="text-sm text-text-secondary">Your Balance</p>
                        <p className="text-4xl font-bold font-display flex items-center gap-2">
                            <SparklesIcon className="w-7 h-7 text-accent"/>
                            {soenFlow} Flow
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setScreen('Rewards')} className="flex items-center gap-2 font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg transition-colors text-sm">
                            <GiftIcon className="w-4 h-4" />
                            <span>Rewards</span>
                        </button>
                        <button onClick={() => setScreen('Settings')} className="flex items-center gap-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm">
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
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
                <h3 className="font-bold mb-4 text-xl font-display">Focus Background</h3>
                <p className="text-sm text-text-secondary mb-4">Select your active background for Focus Mode sessions. Unlock more in the Rewards Hub.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {focusBackgrounds.map(bg => (
                        <button 
                            key={bg.id}
                            onClick={() => setActiveFocusBackground(bg.value)}
                            className={`aspect-video rounded-lg relative overflow-hidden transition-all duration-200 ${activeFocusBackground === bg.value ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-card)]' : 'hover:scale-105'}`}
                            style={{
                                background: getFocusBgPreview(bg.value),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="absolute inset-0 bg-black/30"></div>
                            <span className="absolute bottom-2 left-2 text-white font-semibold text-sm z-10">{bg.name}</span>
                            {activeFocusBackground === bg.value && (
                                <div className="absolute top-2 right-2 bg-accent text-white rounded-full p-0.5 z-10">
                                    <CheckIcon className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    ))}
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