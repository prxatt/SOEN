import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, CalendarIcon, DocumentTextIcon, UserCircleIcon, BabyPenguinIcon, GiftIcon } from './Icons';
import type { Screen } from '../types';

interface NavigationProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
  notificationCount?: number;
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
<<<<<<< HEAD
        {/* Active indicator background */}
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 bg-white rounded-xl"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
=======
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
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
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

<<<<<<< HEAD
function Navigation({ activeScreen, setScreen }: NavigationProps) {
  const [collapsed, setCollapsed] = useState(true); // Always start collapsed
  const [isHovered, setIsHovered] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const leaveTimeoutRef = useRef<NodeJS.Timeout>();
=======
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

function Navigation({ activeScreen, setScreen, notificationCount = 0 }: NavigationProps) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const navRef = React.useRef<HTMLDivElement>(null);
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3

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

<<<<<<< HEAD
  // Cleanup timeouts
=======
  // Auto-collapse after inactivity and on screen changes
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

<<<<<<< HEAD

  return (
    <>
      {/* Desktop Navigation - Fixed to top-left corner */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50">
        <motion.div
=======
      return () => clearTimeout(timer);
    }
  }, [collapsed, activeScreen]);

  // Auto-collapse when screen changes
  useEffect(() => {
    setCollapsed(true);
    setShowProfileDropdown(false);
  }, [activeScreen]);

  // Close profile dropdown when collapsed
  useEffect(() => {
    if (collapsed) {
      setShowProfileDropdown(false);
    }
  }, [collapsed]);

  return (
    <>
      {/* Desktop/Tablet sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40">
        <div 
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
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

<<<<<<< HEAD
          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-2">
            <ul className="space-y-2">
              {MAIN_NAV_ITEMS.map((item, index) => (
=======
          {/* Navigation Items */}
          <ul className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden">
            {NAV_ITEMS.map(({ screen, label, icon, color }) => (
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
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

<<<<<<< HEAD
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
=======
          {/* Notifications Button */}
          <div className="mt-auto mb-4">
            <NavButton
              Icon={BellIcon}
              label={notificationCount > 0 ? "Notifications" : ""}
              isActive={activeScreen === 'Notifications'}
              onClick={() => setScreen('Notifications')}
              color="#9CA3AF"
              collapsed={collapsed}
            />
          </div>

          {/* Profile Dropdown - Desktop only */}
          <div>
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

          {/* Notifications Icon - Bottom Right */}
        </div>
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
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
<<<<<<< HEAD
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
=======
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

            {/* Mobile Notifications Button */}

            {/* Mobile Profile Button */}
            <NavButton
              Icon={UserCircleIcon}
              label="Profile"
              isActive={activeScreen === 'Profile'}
              onClick={() => setScreen('Profile')}
              color="#22C55E"
              collapsed
>>>>>>> 30c5221f8abdb10fd9fb25c7d7147538af8772b3
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