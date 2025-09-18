import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, CalendarIcon, DocumentTextIcon, UserCircleIcon, BabyPenguinIcon, GiftIcon } from './Icons';
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
  collapsed: boolean;
  index: number;
  key?: React.Key;
}

// Brand-cohesive color palette
const BRAND_COLORS = {
  primary: '#000000',      // Pure black
  secondary: '#FAFAFA',    // Off-white
  accent: '#A855F7',       // Purple accent
  surface: '#1A1A1A',      // Dark surface
  border: '#333333',       // Border color
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    muted: '#666666'
  }
} as const;

// Main navigation items (core functionality)
const MAIN_NAV_ITEMS = [
  { screen: 'Dashboard' as Screen, label: 'Dashboard', icon: HomeIcon },
  { screen: 'Schedule' as Screen, label: 'Schedule', icon: CalendarIcon },
  { screen: 'Notes' as Screen, label: 'Notes', icon: DocumentTextIcon },
] as const;

// Bottom navigation items (user/settings)
const BOTTOM_NAV_ITEMS = [
  { screen: 'Profile' as Screen, label: 'Profile', icon: UserCircleIcon },
  { screen: 'Settings' as Screen, label: 'Settings', icon: GiftIcon },
] as const;

function NavButton({ Icon, screen, label, isActive, onClick, collapsed, index }: NavButtonProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      <motion.button
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        className={`
          relative flex items-center w-full transition-all duration-300 ease-out
          ${collapsed ? 'justify-center h-12 w-12 rounded-xl' : 'justify-start h-12 px-4 rounded-xl'}
          ${isActive 
            ? 'bg-white text-black shadow-lg' 
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
          group overflow-hidden
        `}
        whileHover={{ scale: collapsed ? 1.05 : 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Active indicator background */}
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 bg-white rounded-xl"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        
        {/* Icon container */}
        <div className={`relative z-10 flex items-center justify-center ${collapsed ? '' : 'mr-3'}`}>
          <Icon 
            className={`transition-all duration-300 ${collapsed ? 'w-5 h-5' : 'w-5 h-5'} ${isActive ? 'text-black' : 'text-white/80'}`}
          />
        </div>
        
        {/* Label with smooth animation */}
        <AnimatePresence mode="wait">
        {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className={`text-sm font-medium tracking-wide whitespace-nowrap relative z-10 ${
                isActive ? 'text-black' : 'text-current'
              }`}
            >
            {label}
            </motion.span>
        )}
        </AnimatePresence>
      </motion.button>
    </motion.li>
  );
}

function Navigation({ activeScreen, setScreen }: NavigationProps) {
  const [collapsed, setCollapsed] = useState(true); // Always start collapsed
  const [isHovered, setIsHovered] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const leaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Sophisticated hover logic
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setCollapsed(false);
    }, 150); // Small delay before expanding
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setIsHovered(false);
    leaveTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 300); // Delay before collapsing
  }, []);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);


  return (
    <>
      {/* Desktop Navigation - Fixed to top-left corner */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50">
        <motion.div
          ref={navRef}
          className={`
            h-full flex flex-col transition-all duration-500 ease-out
            ${collapsed ? 'w-16' : 'w-64'}
            bg-black/95 backdrop-blur-xl
            border-r border-white/10
          `}
          style={{ 
            paddingLeft: collapsed ? '0.25rem' : '0rem',
            paddingRight: collapsed ? '0.25rem' : '0rem'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            if (collapsed) {
              setCollapsed(false);
            }
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header Section */}
          <div className="p-4 border-b border-white/10">
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="collapsed-logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-sm">P</span>
                  </div>
                </motion.div>
              ) : (
            <motion.div
                  key="expanded-logo"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-sm">P</span>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg tracking-tight">Praxis</h1>
                    <p className="text-white/60 text-xs">AI Command Center</p>
                  </div>
            </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kiko AI Button - Special prominence */}
          <div className="p-4">
            <motion.button
              onClick={() => setScreen('Kiko')}
              className={`
                w-full flex items-center justify-center transition-all duration-300
                ${collapsed ? 'h-12 rounded-xl' : 'h-12 px-4 rounded-xl'}
                ${activeScreen === 'Kiko'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-white/20'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BabyPenguinIcon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
              <AnimatePresence>
              {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-semibold whitespace-nowrap"
                  >
                    Kiko AI
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-2">
            <ul className="space-y-2">
              {MAIN_NAV_ITEMS.map((item, index) => (
              <NavButton
                  key={item.screen}
                  Icon={item.icon}
                  screen={item.screen}
                  label={item.label}
                  isActive={activeScreen === item.screen}
                  onClick={() => setScreen(item.screen)}
                collapsed={collapsed}
                  index={index}
              />
            ))}
          </ul>
          </nav>

          {/* Bottom Navigation Items */}
          <div className="p-4 border-t border-white/10">
            <ul className="space-y-2">
              {BOTTOM_NAV_ITEMS.map((item, index) => (
                <NavButton
                  key={item.screen}
                  Icon={item.icon}
                  screen={item.screen}
                  label={item.label}
                  isActive={activeScreen === item.screen}
                  onClick={() => setScreen(item.screen)}
                  collapsed={collapsed}
                  index={index + MAIN_NAV_ITEMS.length}
                />
              ))}
            </ul>
          </div>

        </motion.div>
      </aside>

      {/* Mobile Navigation - Bottom bar inspired by Pinterest reference */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-between px-6 py-3 safe-area-pb">
          {/* Dashboard */}
          <motion.button
            onClick={() => setScreen('Dashboard')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200
              ${activeScreen === 'Dashboard' ? 'text-white' : 'text-white/60'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </motion.button>

          {/* Schedule */}
          <motion.button
            onClick={() => setScreen('Schedule')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200
              ${activeScreen === 'Schedule' ? 'text-white' : 'text-white/60'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Schedule</span>
          </motion.button>

          {/* Central Kiko button */}
              <motion.button
                onClick={() => setScreen('Kiko')}
            className="relative p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            animate={{ 
              y: [-1, 1, -1],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <BabyPenguinIcon className="w-6 h-6 text-white" />
            {/* Floating sparkles effect */}
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.button>

          {/* Notes */}
          <motion.button
            onClick={() => setScreen('Notes')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200
              ${activeScreen === 'Notes' ? 'text-white' : 'text-white/60'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Notes</span>
          </motion.button>

          {/* Profile & Settings combined */}
          <motion.button
            onClick={() => setScreen(activeScreen === 'Profile' ? 'Settings' : 'Profile')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200
              ${activeScreen === 'Profile' || activeScreen === 'Settings' ? 'text-white' : 'text-white/60'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            {activeScreen === 'Settings' ? (
              <GiftIcon className="w-5 h-5" />
            ) : (
              <UserCircleIcon className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">
              {activeScreen === 'Settings' ? 'Settings' : 'Profile'}
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;