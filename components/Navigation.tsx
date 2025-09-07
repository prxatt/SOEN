import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, CalendarIcon, DocumentTextIcon, UserCircleIcon, KikoIcon } from './Icons';
import type { Screen } from '../types';

interface NavigationProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

interface NavIconProps {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: Screen;
  isActive: boolean;
  onClick: () => void;
  imageUrl?: string;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function NavIcon({ Icon, label, isActive, onClick, imageUrl }: NavIconProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ease-in-out ${
        isActive ? 'text-accent' : 'text-text-secondary hover:text-text'
      }`}
      aria-label={label}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className={`h-6 w-6 rounded-full object-cover ring-2 ${isActive ? 'ring-accent' : 'ring-transparent'}`} />
      ) : (
        <Icon className="h-6 w-6" />
      )}
      <span className={`text-xs mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </motion.button>
  );
}

const NAV_ITEMS: { label: Screen; icon: React.FC<React.SVGProps<SVGSVGElement>>; imageUrl?: string }[] = [
  { label: 'Dashboard', icon: HomeIcon },
  { label: 'Schedule', icon: CalendarIcon },
  { label: 'Notes', icon: DocumentTextIcon },
  { label: 'Profile', icon: UserCircleIcon, imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop' },
];

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Navigation({ activeScreen, setScreen }: NavigationProps) {
  const navItemsLeft = NAV_ITEMS.slice(0, 2);
  const navItemsRight = NAV_ITEMS.slice(2);
  
  return (
    <nav className="card fixed bottom-0 left-0 right-0 h-20 border-t z-50 !rounded-none">
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
                onClick={() => setScreen('Kiko')}
                whileTap={{ scale: 0.9 }}
                className={`relative -top-6 flex items-center justify-center h-16 w-16 rounded-full bg-accent shadow-lg shadow-accent/30 transform transition-transform duration-200 ${activeScreen === 'Kiko' ? 'scale-110' : 'hover:scale-105'}`}
                aria-label="Kiko"
            >
                <KikoIcon className="h-8 w-8 text-white" />
            </motion.button>
        </div>

        <div className="flex justify-around w-2/5">
            {navItemsRight.map(({ label, icon, imageUrl }) => (
            <NavIcon
                key={label}
                Icon={icon}
                label={label}
                isActive={activeScreen === label}
                onClick={() => setScreen(label)}
                imageUrl={imageUrl}
            />
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
