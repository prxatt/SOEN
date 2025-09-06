import React from 'react';
import { GiftIcon, Cog6ToothIcon, ChevronRightIcon, LinkIcon, FlagIcon, CheckCircleIcon, PlusCircleIcon } from './Icons';
import type { Screen, Goal, GoalTerm } from '../types';

interface ProfileProps {
    praxisFlow: number;
    setScreen: (screen: Screen) => void;
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const GoalsHub: React.FC<{goals: Goal[], setGoals: React.Dispatch<React.SetStateAction<Goal[]>>}> = ({ goals, setGoals }) => {
    const updateGoalText = (id: number, text: string) => setGoals(prev => prev.map(g => g.id === id ? {...g, text} : g));
    const toggleGoalStatus = (id: number) => setGoals(prev => prev.map(g => g.id === id ? {...g, status: g.status === 'active' ? 'completed' : 'active'} : g));
    const addGoal = (term: GoalTerm) => setGoals(prev => [...prev, { id: Date.now(), term, text: 'New Goal', status: 'active' }]);
    const GoalItem: React.FC<{goal: Goal}> = ({ goal }) => (
        <div className="flex items-center gap-3 p-3 bg-bg/50 rounded-lg transition-colors duration-200">
            <button onClick={() => toggleGoalStatus(goal.id)} aria-label={`Mark goal as ${goal.status === 'completed' ? 'active' : 'completed'}`} className="flex-shrink-0">
                {goal.status === 'completed' ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-400 dark:border-white/30 hover:border-accent transition-colors" />}
            </button>
            <input type="text" value={goal.text} onChange={(e) => updateGoalText(goal.id, e.target.value)} aria-label="Goal text" className={`flex-grow bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded-sm px-1 text-sm ${goal.status === 'completed' ? 'line-through text-text-secondary' : ''}`} />
        </div>
    );
    const GoalTermCard: React.FC<{term: GoalTerm, title: string}> = ({ term, title }) => (
        <div className="card p-4 rounded-xl flex flex-col bg-bg">
            <h4 className="font-semibold mb-3 text-text">{title}</h4>
            <div className="space-y-2 flex-grow">
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


const Profile: React.FC<ProfileProps> = ({ praxisFlow, setScreen, goals, setGoals }) => {
  return (
    <div className="h-full overflow-y-auto pb-4">
        <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
                <img 
                    src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop" 
                    alt="Pratt" 
                    className="w-24 h-24 rounded-full object-cover"
                />
                <button className="absolute bottom-0 right-0 p-1.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors ring-4 ring-bg" aria-label="Edit Profile Picture">
                    <Cog6ToothIcon className="w-4 h-4"/>
                </button>
            </div>
            <div>
                <h2 className="text-3xl font-bold font-display">Pratt</h2>
                <p className="text-md text-text-secondary">Founder, Surface Tension (Edit)</p>
            </div>
        </div>

        <div className="mt-4 text-sm text-text-secondary space-y-2">
            <a href="#" className="flex items-center gap-2 hover:text-accent"><LinkIcon className="w-4 h-4" /> surfacetension.io (Edit)</a>
            <a href="#" className="flex items-center gap-2 hover:text-accent"><LinkIcon className="w-4 h-4" /> Add personal link...</a>
        </div>


      <div className="space-y-6 mt-8">
        <div className="card p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Praxis Flow & Rewards</h3>
            <div className="flex justify-between items-center bg-bg p-4 rounded-lg">
                <div>
                    <p className="text-sm text-text-secondary">Your Balance</p>
                    <p className="text-2xl font-bold font-display">{praxisFlow} Flow</p>
                </div>
                <button onClick={() => setScreen('Rewards')} className="flex items-center gap-2 font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg transition-colors">
                    <GiftIcon className="w-5 h-5" />
                    <span>Rewards Hub</span>
                </button>
            </div>
        </div>

        <div className="card p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2"><FlagIcon className="w-5 h-5"/> Goals Hub</h3>
            <GoalsHub goals={goals} setGoals={setGoals} />
        </div>
        
        <div className="card p-2 rounded-2xl shadow-sm">
             <button onClick={() => setScreen('Settings')} className="w-full flex items-center justify-between text-left p-4 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                    <Cog6ToothIcon className="w-6 h-6 text-text-secondary"/>
                    <div>
                        <h4 className="font-semibold text-lg">Settings & Integrations</h4>
                        <p className="text-sm text-text-secondary">Preferences, calendar sync, and account</p>
                    </div>
                </div>
                <ChevronRightIcon className="w-6 h-6 text-text-secondary"/>
            </button>
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
