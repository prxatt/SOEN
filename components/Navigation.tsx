import React, { useEffect, useState } from 'react';
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
  color: string;
  collapsed?: boolean;
}

function NavButton({ Icon, label, isActive, onClick, color, collapsed }: NavButtonProps) {
  return (
    <li className="relative">
      <button
        onClick={onClick}
        className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} transition-all duration-300 ease-in-out rounded-2xl px-3 py-2 md:px-4 md:py-3 border ${isActive ? 'border-transparent' : 'border-border'} bg-card/90 hover:bg-card shadow-sm backdrop-blur-xl`}
        style={{
          color: isActive ? '#ffffff' : 'var(--color-text)'
        }}
      >
        <span
          className="grid place-items-center h-10 w-10 rounded-xl relative"
          style={{
            background: isActive ? `radial-gradient(80% 80% at 50% 30%, ${color}66, transparent 70%)` : 'transparent',
            filter: isActive ? `drop-shadow(0 0 10px ${color}66)` : 'none'
          }}
        >
          <Icon className="h-6 w-6" style={{ color: isActive ? color : 'var(--color-text-secondary)' }} />
          {isActive && (
            <span className="absolute -inset-px rounded-xl" style={{ boxShadow: `0 0 0 1px ${color}55 inset` }} />
          )}
        </span>
        {!collapsed && <span className="hidden md:block text-sm font-semibold tracking-wide">{label}</span>}
      </button>
    </li>
  );
}

const NAV_ITEMS: { screen: Screen; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { screen: 'Dashboard', label: 'Home', icon: HomeIcon, color: '#A855F7' },
  { screen: 'Schedule', label: 'Schedule', icon: CalendarIcon, color: '#06B6D4' },
  { screen: 'Notes', label: 'Notes', icon: DocumentTextIcon, color: '#F59E0B' },
  { screen: 'Profile', label: 'Profile', icon: UserCircleIcon, color: '#22C55E' },
];

function Navigation({ activeScreen, setScreen }: NavigationProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const update = () => setCollapsed(window.innerWidth < 1280); // auto-collapse below 1280px
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      {/* Desktop/Tablet sidebar */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-40">
        <div className={`h-full ${collapsed ? 'w-20' : 'w-56'} rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-lg p-3 flex flex-col justify-between transition-all duration-300`}>
          <ul className="space-y-2">
            {NAV_ITEMS.map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                screen={screen}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed={collapsed}
              />
            ))}
          </ul>
          <div className="pt-2">
            <motion.button
              onClick={() => setScreen('Kiko')}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-2xl px-4 py-3 text-white font-semibold shadow-lg"
              style={{
                background: 'radial-gradient(140% 140% at 30% 10%, #a855f7 0%, #6d28d9 45%, #4c1d95 100%)',
                boxShadow: '0 0 25px #a855f733, inset 0 2px 6px #d8b4fe33'
              }}
              aria-label="Kiko AI"
            >
              {collapsed ? (
                <span className="flex items-center gap-2 justify-center">
                  <BabyPenguinIcon className="h-6 w-6" />
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <BabyPenguinIcon className="h-6 w-6" />
                  <span className="text-sm">Kiko AI</span>
                </span>
              )}
            </motion.button>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="mt-2 w-full text-xs text-text-secondary hover:text-text transition-colors"
              aria-label="Toggle collapse"
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="relative w-full max-w-lg flex items-center p-2 rounded-[2rem] border border-border bg-card/95 backdrop-blur-xl shadow-lg">
          <ul className="flex items-center w-full justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                screen={screen}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed
              />
            ))}

            <li className="relative w-16 h-16 flex justify-center items-center -translate-y-2">
              <motion.button
                onClick={() => setScreen('Kiko')}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
                style={{
                  background: 'radial-gradient(120% 120% at 30% 10%, #a855f7 0%, #6d28d9 55%, #4c1d95 100%)',
                  boxShadow: '0 0 18px #a855f766, inset 0 2px 4px #d8b4fe55',
                  color: 'white'
                }}
                aria-label="Kiko AI"
              >
                <BabyPenguinIcon className="h-9 w-9" />
              </motion.button>
            </li>

            {NAV_ITEMS.slice(2).map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                screen={screen}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed
              />
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navigation;