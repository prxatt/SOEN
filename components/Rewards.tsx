import React from 'react';
import { motion } from 'framer-motion';
import { REWARDS_CATALOG, getThemeColors, getFocusBackgroundColors } from '../constants';
import { RewardItem } from '../types';
import { CheckCircleIcon, ChevronLeftIcon, SparklesIcon } from './Icons';

interface RewardsProps {
    onBack: () => void;
    soenFlow: number;
    purchasedRewards: string[];
    activeTheme: string;
    setActiveTheme: (themeValue: string) => void;
    onPurchase: (reward: RewardItem) => void;
    activeFocusBackground: string;
    setActiveFocusBackground: (bgValue: string) => void;
}

/**
 * Get theme gradient from REWARDS_CATALOG colors
 * Derives gradient from the first two colors of the theme/focus background's color array
 */
const getThemeGradient = (themeValue: string, type: 'theme' | 'focus_background' = 'theme') => {
    const colors = type === 'theme' 
        ? getThemeColors(themeValue)
        : getFocusBackgroundColors(themeValue);
    
    if (colors.length >= 2) {
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    }
    // Fallback gradient
    return 'linear-gradient(135deg, #6b7280, #374151)';
};

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    // This is a simplified check for gradients, assuming the first color is representative
    const colorMap: { [key: string]: string } = {
        'obsidian': '#4b5563', 'synthwave': '#EC4899', 'solarpunk': '#a3e635',
        'luxe': '#fde047', 'aurelian': '#fbbf24', 'crimson': '#f87171', 'oceanic': '#38bdf8',
        'lofi': '#4f46e5'
    };
    const checkColor = colorMap[hexColor] || '#6b7280';
    const r = parseInt(checkColor.slice(1, 3), 16);
    const g = parseInt(checkColor.slice(3, 5), 16);
    const b = parseInt(checkColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};

interface RewardCardProps {
  item: RewardItem;
  isPurchased: boolean;
  isActive: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onApply: () => void;
}

function RewardCard({ item, isPurchased, isActive, canAfford, onPurchase, onApply }: RewardCardProps) {
    const textColor = getTextColorForBackground(item.value);
    
    return (
        <motion.div 
            className="p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
            style={{ 
                background: getThemeGradient(item.value, item.type === 'focus_background' ? 'focus_background' : 'theme'),
                color: textColor 
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
        >
            {isActive && (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-3 right-3 bg-white/80 text-green-500 rounded-full p-1"
                >
                    <CheckCircleIcon className="w-6 h-6"/>
                </motion.div>
            )}

            <div style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                <h4 className="font-bold font-display text-xl">{item.name}</h4>
                <p className="text-sm mt-1 h-10 opacity-80">{item.description}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
                <p className="font-bold flex items-center gap-1.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <SparklesIcon className="w-5 h-5" /> {item.cost}
                </p>
                {isPurchased ? (
                    (item.type === 'theme' || item.type === 'focus_background') ? (
                        isActive ? (
                             <span className="font-semibold text-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>Applied</span>
                        ) : (
                            <button onClick={onApply} className="font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor,
                            }}>Apply</button>
                        )
                    ) : (
                        <span className="font-semibold text-sm">Purchased</span>
                    )
                ) : (
                    <button onClick={onPurchase} disabled={!canAfford} className="font-semibold text-sm bg-white/90 text-black px-4 py-1.5 rounded-lg hover:bg-white disabled:bg-gray-300/80 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                        Purchase
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function Rewards({ onBack, soenFlow, purchasedRewards, activeTheme, setActiveTheme, onPurchase, activeFocusBackground, setActiveFocusBackground }: RewardsProps) {
    const themes = REWARDS_CATALOG.filter(r => r.type === 'theme');
    const focusBackgrounds = REWARDS_CATALOG.filter(r => r.type === 'focus_background');

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto pb-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-card transition-colors"><ChevronLeftIcon className="w-6 h-6"/></button>
                <div>
                    <h2 className="text-3xl font-bold font-display">Rewards Hub</h2>
                    <p className="text-text-secondary">Customize your Soen workspace.</p>
                </div>
            </div>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4 px-2">App Themes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {themes.map(item => (
                            <RewardCard 
                                key={item.id}
                                item={item}
                                isPurchased={purchasedRewards.includes(item.id)}
                                isActive={activeTheme === item.value}
                                canAfford={soenFlow >= item.cost}
                                onPurchase={() => onPurchase(item)}
                                onApply={() => setActiveTheme(item.value)}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4 px-2">Focus Backgrounds</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {focusBackgrounds.map(item => (
                            <RewardCard 
                                key={item.id}
                                item={item}
                                isPurchased={purchasedRewards.includes(item.id)}
                                isActive={activeFocusBackground === item.value}
                                canAfford={soenFlow >= item.cost}
                                onPurchase={() => onPurchase(item)}
                                onApply={() => setActiveFocusBackground(item.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Rewards;