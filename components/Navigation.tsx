import React, { useEffect, useLayoutEffect, useState } from 'react';
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
  color: string;
  collapsed?: boolean;
}

function NavButton({ Icon, label, isActive, onClick, color, collapsed }: NavButtonProps) {
  return (
    <li className="relative">
      <motion.button
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        className={`relative flex items-center transition-all duration-300 ease-in-out rounded-2xl group ${
          collapsed 
            ? 'justify-center h-10 w-10 mx-auto' 
            : 'justify-start h-12 px-4 w-full'
        } ${
          isActive 
            ? 'bg-white/25 shadow-lg border border-white/40' 
            : 'bg-white/15 hover:bg-white/20 border border-white/25'
        } backdrop-blur-xl`}
        whileHover={{ scale: collapsed ? 1.05 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`relative flex items-center justify-center ${collapsed ? 'w-5 h-5' : 'w-6 h-6 mr-3'}`}>
          <Icon 
            className={`transition-all duration-300 ${
              collapsed ? 'w-4 h-4' : 'w-5 h-5'
            }`} 
            style={{ 
              color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
              filter: isActive ? `drop-shadow(0 0 6px ${color}60)` : 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))'
            }} 
          />
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{ 
                background: `linear-gradient(135deg, ${color}40, transparent)`,
                boxShadow: `inset 0 0 0 1px ${color}60`
              }}
              layoutId="activeIndicator"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide text-white truncate">
            {label}
          </span>
        )}
      </motion.button>
    </li>
  );
}

const NAV_ITEMS: { screen: Screen; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { screen: 'Dashboard', label: 'Home', icon: HomeIcon, color: '#A855F7' },
  { screen: 'Schedule', label: 'Schedule', icon: CalendarIcon, color: '#06B6D4' },
  { screen: 'Notes', label: 'Notes', icon: DocumentTextIcon, color: '#F59E0B' },
];

const PROFILE_ITEMS: { screen: Screen; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { screen: 'Profile', label: 'Profile', icon: UserCircleIcon, color: '#22C55E' },
  { screen: 'Rewards', label: 'Rewards', icon: UserCircleIcon, color: '#F59E0B' },
  { screen: 'Settings', label: 'Settings', icon: UserCircleIcon, color: '#6B7280' },
];

function Navigation({ activeScreen, setScreen }: NavigationProps) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Always start collapsed, expand only on very wide screens
    const update = () => setCollapsed(window.innerWidth < 1440);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update as any);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update as any);
    };
  }, []);

  // Auto-collapse on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };

    if (!collapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [collapsed]);

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!collapsed) {
      const timer = setTimeout(() => {
        setCollapsed(true);
        setShowProfileDropdown(false);
      }, 5000); // Auto-collapse after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [collapsed, activeScreen]);

  // Close profile dropdown when collapsed
  useEffect(() => {
    if (collapsed) {
      setShowProfileDropdown(false);
    }
  }, [collapsed]);

  return (
    <>
      {/* Desktop/Tablet sidebar */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-40">
        <div 
          ref={navRef}
          className={`h-full ${collapsed ? 'w-14' : 'w-64'} rounded-r-3xl bg-gradient-to-b from-black/30 to-black/20 backdrop-blur-xl border border-white/30 shadow-2xl p-1.5 flex flex-col transition-all duration-500 ease-out overflow-hidden`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            if (collapsed) {
              setCollapsed(false);
            }
          }}
        >
          {/* PRAXIS AI Heading */}
          <div className="mb-3">
            <motion.div
              className={`text-center ${collapsed ? 'hidden' : 'block'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-lg font-bold text-white tracking-wider">PRAXIS AI</h1>
              <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mt-1 rounded-full"></div>
            </motion.div>
          </div>

          {/* Kiko AI Button - Below heading */}
          <div className="mb-3">
            <motion.button
              onClick={() => setScreen('Kiko')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full rounded-2xl text-white font-semibold shadow-lg transition-all duration-300 ${
                collapsed ? 'h-10 flex items-center justify-center' : 'h-12 flex items-center justify-center gap-3'
              }`}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 50%, #4c1d95 100%)',
                boxShadow: '0 6px 24px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              aria-label="Kiko AI"
            >
              <BabyPenguinIcon className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {!collapsed && (
                <span className="text-sm font-semibold tracking-wide">Kiko AI</span>
              )}
            </motion.button>
          </div>

          {/* Navigation Items */}
          <ul className="space-y-1.5 flex-1 overflow-y-auto">
            {NAV_ITEMS.map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed={collapsed}
              />
            ))}
          </ul>

          {/* Profile Dropdown - Desktop only */}
          <div className="mt-auto">
            <div className="relative">
              <motion.button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`w-full rounded-2xl text-white font-semibold shadow-lg transition-all duration-300 ${
                  collapsed ? 'h-10 flex items-center justify-center' : 'h-12 flex items-center justify-center gap-3'
                } ${
                  activeScreen === 'Profile' || activeScreen === 'Rewards' || activeScreen === 'Settings'
                    ? 'bg-white/25 shadow-lg border border-white/40' 
                    : 'bg-white/15 hover:bg-white/20 border border-white/25'
                } backdrop-blur-xl`}
                whileHover={{ scale: collapsed ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserCircleIcon className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
                {!collapsed && (
                  <span className="text-sm font-semibold tracking-wide">Profile</span>
                )}
                {!collapsed && (
                  <motion.div
                    animate={{ rotate: showProfileDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showProfileDropdown && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-2 space-y-1"
                  >
                    {PROFILE_ITEMS.map(({ screen, label, icon: Icon, color }) => (
                      <motion.button
                        key={screen}
                        onClick={() => {
                          setScreen(screen);
                          setShowProfileDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeScreen === screen
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Collapse Toggle */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(c => !c);
            }}
            className="mt-3 w-full text-xs text-white/80 hover:text-white transition-colors py-2 rounded-lg hover:bg-white/15"
            aria-label="Toggle collapse"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {collapsed ? '→' : '←'}
          </motion.button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="relative w-full max-w-lg flex items-center p-3 rounded-[2rem] bg-gradient-to-r from-black/30 to-black/20 backdrop-blur-xl border border-white/30 shadow-2xl">
          <ul className="flex items-center w-full justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed
              />
            ))}

            <li className="relative w-16 h-16 flex justify-center items-center -translate-y-2">
              <motion.button
                onClick={() => setScreen('Kiko')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 50%, #4c1d95 100%)',
                  boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                aria-label="Kiko AI"
              >
                <BabyPenguinIcon className="h-8 w-8" />
              </motion.button>
            </li>

            {NAV_ITEMS.slice(2).map(({ screen, label, icon, color }) => (
              <NavButton
                key={screen}
                Icon={icon}
                label={label}
                isActive={activeScreen === screen}
                onClick={() => setScreen(screen)}
                color={color}
                collapsed
              />
            ))}

            {/* Mobile Profile Button */}
            <NavButton
              Icon={UserCircleIcon}
              label="Profile"
              isActive={activeScreen === 'Profile'}
              onClick={() => setScreen('Profile')}
              color="#22C55E"
              collapsed
            />
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navigation;