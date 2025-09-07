import React from 'react';
import { motion } from 'framer-motion';
import { REWARDS_CATALOG } from '../constants';
import { RewardItem } from '../types';
import { CheckCircleIcon, ChevronLeftIcon, SparklesIcon } from './Icons';

interface RewardsProps {
    onBack: () => void;
    praxisFlow: number;
    purchasedRewards: string[];
    activeTheme: string;
    setActiveTheme: (themeValue: string) => void;
    onPurchase: (reward: RewardItem) => void;
}

interface RewardCardProps {
  item: RewardItem;
  isPurchased: boolean;
  isActive: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onApply: () => void;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function RewardCard({ item, isPurchased, isActive, canAfford, onPurchase, onApply }: RewardCardProps) {
  return (
    <div className="card p-4 rounded-xl flex flex-col justify-between">
        <div>
            <h4 className="font-bold font-display text-lg">{item.name}</h4>
            <p className="text-sm text-text-secondary mt-1 h-10">{item.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4">
            <p className="font-bold text-accent flex items-center gap-1"><SparklesIcon className="w-4 h-4" /> {item.cost}</p>
            {isPurchased ? (
                item.type === 'theme' ? (
                    isActive ? (
                        <span className="flex items-center gap-1.5 font-semibold text-sm text-green-500"><CheckCircleIcon className="w-5 h-5" /> Applied</span>
                    ) : (
                        <button onClick={onApply} className="font-semibold text-sm bg-bg px-3 py-1.5 rounded-lg hover:ring-2 ring-accent">Apply</button>
                    )
                ) : (
                    <span className="font-semibold text-sm text-green-500">Purchased</span>
                )
            ) : (
                <button onClick={onPurchase} disabled={!canAfford} className="font-semibold text-sm bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">Purchase</button>
            )}
        </div>
    </div>
  );
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Rewards({ onBack, praxisFlow, purchasedRewards, activeTheme, setActiveTheme, onPurchase }: RewardsProps) {
    const themes = REWARDS_CATALOG.filter(r => r.type === 'theme');

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto pb-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6"/></button>
                <div>
                    <h2 className="text-2xl font-bold font-display">Rewards Hub</h2>
                    <p className="text-text-secondary">Spend your Praxis Flow to customize your workspace.</p>
                </div>
            </div>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">App Themes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {themes.map(item => (
                            <RewardCard 
                                key={item.id}
                                item={item}
                                isPurchased={purchasedRewards.includes(item.id)}
                                isActive={activeTheme === item.value}
                                canAfford={praxisFlow >= item.cost}
                                onPurchase={() => onPurchase(item)}
                                onApply={() => setActiveTheme(item.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Rewards;
