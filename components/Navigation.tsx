import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, CalendarIcon, DocumentTextIcon, UserCircleIcon, BabyPenguinIcon } from './Icons';
import type { Screen } from '../types';

interface NavigationProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

interface NavButtonProps {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  screen: Screen;
  label: string;
  isActive: boolean;
  onClick: () => void;
  imageUrl?: string;
}

function NavButton({ Icon, screen, label, isActive, onClick, imageUrl }: NavButtonProps) {
  const activeClasses = 'text-text';
  const inactiveClasses = 'text-text-secondary hover:text-text';

  return (
    <motion.li
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-colors duration-300 ease-in-out z-10 cursor-pointer
        ${isActive ? activeClasses : inactiveClasses}
      `}
      aria-label={screen}
    >
      {isActive && (
         <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 bg-white/25 dark:bg-white/15 rounded-2xl"
            style={{ zIndex: -1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {imageUrl ? (
         <img src={imageUrl} alt="Profile" className={`h-8 w-8 rounded-full object-cover transition-all mb-1 ${isActive ? 'ring-2 ring-offset-2 ring-offset-zinc-900/50 ring-white/50' : 'ring-0'}`} />
      ) : (
        <Icon className="h-6 w-6 mb-1" />
      )}
      <span className="text-[10px] font-bold">{label}</span>
      
    </motion.li>
  );
}


const NAV_ITEMS: { screen: Screen; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; imageUrl?: string }[] = [
  { screen: 'Dashboard', label: 'Home', icon: HomeIcon },
  { screen: 'Schedule', label: 'Schedule', icon: CalendarIcon },
  { screen: 'Notes', label: 'Notes', icon: DocumentTextIcon },
  { screen: 'Profile', label: 'Profile', icon: UserCircleIcon, imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop' },
];

function Navigation({ activeScreen, setScreen }: NavigationProps) {
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="relative w-full max-w-lg flex items-center p-2 rounded-[2.5rem] bg-zinc-900/40 dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl border border-white/10">
        <ul className="flex items-center w-full justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ screen, icon, imageUrl, label }) => (
            <NavButton
                key={screen}
                Icon={icon}
                screen={screen}
                label={label}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                imageUrl={imageUrl}
            />
            ))}

            <li className="relative w-16 h-16 flex justify-center items-center">
                 <motion.button
                    onClick={() => setScreen('Kiko')}
                    whileTap={{ scale: 0.9 }}
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ease-in-out text-white bg-gradient-to-br from-accent to-purple-600 shadow-lg shadow-accent/40 -translate-y-4 border-4 border-bg`}
                    aria-label="Kiko AI"
                >
                    <BabyPenguinIcon className="h-9 w-9" />
                </motion.button>
            </li>
            
            {NAV_ITEMS.slice(2).map(({ screen, icon, imageUrl, label }) => (
            <NavButton
                key={screen}
                Icon={icon}
                screen={screen}
                label={label}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                imageUrl={imageUrl}
            />
            ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;