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
  isActive: boolean;
  onClick: () => void;
  color: string;
}

function NavButton({ Icon, isActive, onClick, color }: NavButtonProps) {
  return (
    <li className="relative">
      <button
        onClick={onClick}
        className="relative flex items-center justify-center transition-all duration-300 ease-in-out h-14 w-14 rounded-full group"
        style={{
          color: isActive ? color : '#9ca3af', // gray-400
          filter: isActive ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}66)` : 'none',
          transition: 'color 0.3s, filter 0.3s',
        }}
      >
        <Icon className="h-8 w-8 transition-transform group-hover:scale-110" />
      </button>
    </li>
  );
}

const NAV_ITEMS: { screen: Screen; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { screen: 'Dashboard', icon: HomeIcon, color: '#22d3ee' }, // cyan-400
  { screen: 'Schedule', icon: CalendarIcon, color: '#f472b6' }, // pink-400
  { screen: 'Notes', icon: DocumentTextIcon, color: '#facc15' }, // yellow-400
  { screen: 'Profile', icon: UserCircleIcon, color: '#4ade80' }, // green-400
];

function Navigation({ activeScreen, setScreen }: NavigationProps) {
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="relative w-full max-w-lg flex items-center p-2 rounded-[2rem] pointer-events-auto">
        <ul className="flex items-center w-full justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ screen, icon, color }) => (
            <NavButton
                key={screen}
                Icon={icon}
                screen={screen}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
            />
            ))}

            <li className="relative w-16 h-16 flex justify-center items-center">
                 <motion.button
                    onClick={() => setScreen('Kiko')}
                    whileTap={{ scale: 0.9 }}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ease-in-out -translate-y-4 shadow-lg`}
                    style={{
                        background: 'radial-gradient(circle, #a855f7 0%, #6d28d9 100%)',
                        boxShadow: '0 0 15px #a855f7, 0 0 25px #a855f766, inset 0 2px 4px #d8b4fe',
                        color: 'white',
                    }}
                    aria-label="Kiko AI"
                >
                    <BabyPenguinIcon className="h-9 w-9" />
                </motion.button>
            </li>
            
            {NAV_ITEMS.slice(2).map(({ screen, icon, color }) => (
            <NavButton
                key={screen}
                Icon={icon}
                screen={screen}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
            />
            ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;