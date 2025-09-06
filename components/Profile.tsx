import React from 'react';
import { GiftIcon } from './Icons';
import type { Screen } from '../types';
import { REWARDS_CATALOG } from '../constants';

interface ProfileProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
    praxisFlow: number;
    setScreen: (screen: Screen) => void;
    activeTheme: string;
    setActiveTheme: (theme: string) => void;
    purchasedRewards: string[];
}

const Profile: React.FC<ProfileProps> = ({ isDarkMode, toggleTheme, onLogout, praxisFlow, setScreen, activeTheme, setActiveTheme, purchasedRewards }) => {
  const themeColorMap: Record<string, string> = {
    default: '#A855F7',
    solaris: '#F97316',
    crimson: '#DC2626',
    oceanic: '#0EA5E9',
  };

  const availableThemes = [
    { id: 'theme-default', name: 'Default', value: 'default' },
    ...REWARDS_CATALOG.filter(r => r.type === 'theme')
  ];
  
  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="flex items-center gap-4 mb-8">
        <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop" alt="Pratt" className="w-20 h-20 rounded-full object-cover"/>
        <div>
            <h2 className="text-3xl font-bold font-display">Pratt</h2>
            <p className="text-md text-light-text-secondary dark:text-dark-text-secondary">Surface Tension</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Praxis Flow & Rewards</h3>
            <div className="flex justify-between items-center bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
                <div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Your Balance</p>
                    <p className="text-2xl font-bold font-display">{praxisFlow} Flow</p>
                </div>
                <button onClick={() => setScreen('Rewards')} className="flex items-center gap-2 font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg transition-colors">
                    <GiftIcon className="w-5 h-5" />
                    <span>Rewards Hub</span>
                </button>
            </div>
        </div>

        <div className="card p-4 rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-3 text-lg">Appearance</h3>
          <div className="flex justify-between items-center">
            <label htmlFor="dark-mode-toggle" className="font-medium cursor-pointer">Dark Mode</label>
            <button
                id="dark-mode-toggle"
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDarkMode}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isDarkMode ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
           <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
              <h4 className="font-medium mb-3">Theme</h4>
              <div className="grid grid-cols-2 gap-3">
                {availableThemes.map(theme => {
                  const isPurchased = theme.value === 'default' || purchasedRewards.includes(theme.id);
                  const isActive = activeTheme === theme.value;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => isPurchased && setActiveTheme(theme.value)}
                      disabled={!isPurchased}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        isActive ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card' : 'border-transparent'
                      } ${isPurchased ? 'cursor-pointer bg-light-bg dark:bg-dark-bg hover:border-accent/50' : 'opacity-50 cursor-not-allowed bg-light-bg dark:bg-dark-bg'}`}
                      aria-label={`Apply ${theme.name} theme`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: themeColorMap[theme.value] || '#A855F7' }}></div>
                        <span className="font-semibold">{theme.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
        </div>
        
        <div className="card p-4 rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-3 text-lg">Account</h3>
            <button onClick={onLogout} className="w-full text-left p-3 rounded-lg bg-light-bg dark:bg-dark-bg text-red-500 font-semibold hover:bg-red-500/10 transition-colors">
              Logout
            </button>
        </div>
        
        <div className="card p-4 rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-3 text-lg">Export (Coming Soon)</h3>
          <div className="space-y-3">
             <button disabled className="w-full text-left p-3 rounded-lg bg-light-bg dark:bg-dark-bg transition-colors disabled:opacity-50">
              Export Weekly Report as PDF
            </button>
             <button disabled className="w-full text-left p-3 rounded-lg bg-light-bg dark:bg-dark-bg transition-colors disabled:opacity-50">
              Export All Notes as Markdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;