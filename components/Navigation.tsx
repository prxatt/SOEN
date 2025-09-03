import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, CalendarIcon, DocumentTextIcon, BriefcaseIcon, KikoIcon } from './Icons';
import type { Screen } from '../types';

interface NavigationProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

const NavIcon: React.FC<{ Icon: React.FC<React.SVGProps<SVGSVGElement>>; label: Screen; isActive: boolean; onClick: () => void; }> = ({ Icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.9 }}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ease-in-out ${
      isActive ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text'
    }`}
    aria-label={label}
  >
    <Icon className="h-6 w-6" />
    <span className={`text-xs mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </motion.button>
);

const NAV_ITEMS: { label: Screen; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { label: 'Dashboard', icon: HomeIcon },
  { label: 'Schedule', icon: CalendarIcon },
  { label: 'Notes', icon: DocumentTextIcon },
];

const Navigation: React.FC<NavigationProps> = ({ activeScreen, setScreen }) => {
  const navItemsLeft = NAV_ITEMS.slice(0, 2);
  const navItemsRight = NAV_ITEMS.slice(2);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl border-t border-light-border dark:border-dark-border z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center h-full px-2">
        <div className="flex justify-around w-2/5">
            {navItemsLeft.map(({ label, icon }) => (
            <NavIcon
                key={label}
                Icon={icon}
                label={label}
                isActive={activeScreen === label}
                onClick={() => setScreen(label)}
            />
            ))}
        </div>

        <div className="w-1/5 flex justify-center">
            <motion.button
                onClick={() => setScreen('KikoAI')}
                whileTap={{ scale: 0.9 }}
                className={`relative -top-6 flex items-center justify-center h-16 w-16 rounded-full bg-accent shadow-lg shadow-accent/30 transform transition-transform duration-200 ${activeScreen === 'KikoAI' ? 'scale-110' : 'hover:scale-105'}`}
                aria-label="Kiko AI"
            >
                <KikoIcon className="h-8 w-8 text-white" />
            </motion.button>
        </div>

        <div className="flex justify-around w-2/5">
            {navItemsRight.map(({ label, icon }) => (
            <NavIcon
                key={label}
                Icon={icon}
                label={label}
                isActive={activeScreen === label}
                onClick={() => setScreen(label)}
            />
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;