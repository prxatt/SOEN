import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  return (
    <li className="relative">
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center transition-all duration-300 ease-in-out z-10 h-12 rounded-full group
          ${isActive ? 'px-4 text-text' : 'w-12 text-text-secondary hover:text-text'}
        `}
        aria-label={screen}
      >
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 bg-gradient-to-b from-white/25 to-white/10 dark:from-white/15 dark:to-white/5 rounded-full shadow-inner"
            style={{ zIndex: -1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <div className="flex items-center gap-2">
          {imageUrl ? (
            <img src={imageUrl} alt="Profile" className={`h-7 w-7 rounded-full object-cover transition-all ${isActive ? 'ring-1 ring-offset-1 ring-offset-white/20 ring-white/50' : ''}`} />
          ) : (
            <Icon className="h-6 w-6 flex-shrink-0" />
          )}
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{ opacity: 1, width: 'auto', x: 0, transition: { delay: 0.1, duration: 0.2 } }}
                exit={{ opacity: 0, width: 0, x: -10, transition: { duration: 0.1 } }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>
    </li>
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
      <div className="relative w-full max-w-lg flex items-center p-2 rounded-[2rem] bg-zinc-900/60 dark:bg-black/50 backdrop-blur-2xl shadow-2xl shadow-black/30 border border-white/20 ring-1 ring-inset ring-white/10">
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
                        boxShadow: [
                            '0 0 0px rgba(200, 200, 220, 0)', 
                            '0 0 15px rgba(200, 200, 220, 0.4)', 
                            '0 0 0px rgba(200, 200, 220, 0)'
                        ]
                    }}
                    transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ease-in-out -translate-y-4 border-4 border-bg bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-900 shadow-lg shadow-black/30`}
                    aria-label="Kiko AI"
                >
                    <BabyPenguinIcon className="h-9 w-9 text-zinc-900 dark:text-white" />
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