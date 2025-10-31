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
  accent: '#000000',       // Black accent for brand cohesion
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
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        className={`
          relative flex items-center w-full transition-all duration-300 ease-out
          ${collapsed ? 'justify-center h-12 w-12 rounded-xl' : 'justify-start h-12 px-4 rounded-xl'}
          ${isActive 
            ? 'bg-white text-black shadow-lg' 
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
          group overflow-hidden whitespace-nowrap
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
            className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-black' : 'text-white/80'}`}
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
              className={`text-sm font-medium tracking-wide whitespace-nowrap truncate max-w-[9rem] relative z-10 ${
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
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false); // hidden on load
  const [scrolled, setScrolled] = useState(false); // Track scroll state for SOEN text visibility
  const hasShownOnceRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Click to toggle navigation
  const handleNavClick = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

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

  // Auto-collapse when clicking on a tab
  const handleTabClick = useCallback((screen: Screen) => {
    setScreen(screen);
    setCollapsed(true);
  }, [setScreen]);

  // Track scroll state for SOEN text visibility in sidebar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile: scroll-aware bottom navigation behavior
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Respect user preference: keep nav visible and skip scroll-driven animations
      setIsMobileNavVisible(true);
      return;
    }
    const threshold = 6; // minimal delta to consider scroll direction

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      // If near top, keep hidden to minimize chrome
      if (currentY < 10) {
        setIsMobileNavVisible(false);
      }

      // First downward scroll: briefly reveal, then auto-hide
      if (!hasShownOnceRef.current && delta > threshold) {
        hasShownOnceRef.current = true;
        setIsMobileNavVisible(true);
        if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => setIsMobileNavVisible(false), 1200);
      } else if (hasShownOnceRef.current) {
        if (delta > threshold) {
          // scrolling down → hide
          setIsMobileNavVisible(false);
        } else if (delta < -threshold) {
          // scrolling up → show
          setIsMobileNavVisible(true);
        }
      }

      lastScrollYRef.current = currentY;
    };

    // Initialize lastScrollY
    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
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
          onClick={handleNavClick}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header Section - SOEN text always visible when expanded, or when scrolled and collapsed */}
          <div className="p-4 border-b border-white/10">
            <AnimatePresence mode="wait">
              {(scrolled || !collapsed) && (
                <>
                  {collapsed ? (
                    <motion.div
                      key="collapsed-logo"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-center"
                    >
                      <span className="text-white font-extrabold text-[10px] tracking-widest">SOEN</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expanded-logo"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="flex flex-col items-start"
                    >
                      <span className="text-white font-extrabold text-base tracking-wider mb-2">SOEN</span>
                      <h1 
                        className="text-white font-normal text-[9px] tracking-[0.2em] uppercase leading-[1.3] font-brand"
                        style={{ fontFamily: '"Ivy Presto Display", "Playfair Display", serif' }}
                      >
                        By SURFACE TENSION
                      </h1>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mira AI Button - Special prominence */}
          <div className="p-4">
            <motion.button
              onClick={() => handleTabClick('Mira')}
              className={`
                w-full flex items-center justify-center transition-all duration-300
                ${collapsed ? 'h-12 rounded-xl' : 'h-12 px-4 rounded-xl'}
                ${activeScreen === 'Mira'
                  ? 'bg-white text-black shadow-lg border border-white/20'
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
                    Mira AI
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
                  onClick={() => handleTabClick(item.screen)}
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
                  onClick={() => handleTabClick(item.screen)}
                  collapsed={collapsed}
                  index={index + MAIN_NAV_ITEMS.length}
                />
              ))}
            </ul>
          </div>

        </motion.div>
      </aside>

      {/* Mobile Navigation - Scroll-aware bottom bar (hidden on load, shows on first downward scroll) */}
      <motion.nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 safe-area-insets"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: isMobileNavVisible ? 0 : 80, opacity: isMobileNavVisible ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between px-6 py-3 safe-area-pb">
          {/* Dashboard */}
          <motion.button
            onClick={() => setScreen('Dashboard')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all duration-200 min-w-[48px] min-h-[48px]
              ${activeScreen === 'Dashboard' ? 'text-white' : 'text-white/70'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${activeScreen==='Dashboard' ? 'bg-white text-black' : 'bg-white/10 text-white'} rounded-2xl` }>
              <HomeIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Home</span>
          </motion.button>

          {/* Schedule */}
          <motion.button
            onClick={() => setScreen('Schedule')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all duration-200 min-w-[48px] min-h-[48px]
              ${activeScreen === 'Schedule' ? 'text-white' : 'text-white/70'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${activeScreen==='Schedule' ? 'bg-white text-black' : 'bg-white/10 text-white'} rounded-2xl` }>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Schedule</span>
          </motion.button>

          {/* Central Mira button (no gradients or purple) */}
          <motion.button
            onClick={() => setScreen('Mira')}
            className="relative p-0 rounded-3xl bg-transparent text-black min-w-[64px] min-h-[64px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-16 h-16 rounded-3xl bg-white border border-white/20 shadow-lg flex items-center justify-center">
              <BabyPenguinIcon className="w-7 h-7 text-black" />
            </div>
          </motion.button>

          {/* Notes */}
          <motion.button
            onClick={() => setScreen('Notes')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all duration-200 min-w-[48px] min-h-[48px]
              ${activeScreen === 'Notes' ? 'text-white' : 'text-white/70'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${activeScreen==='Notes' ? 'bg-white text-black' : 'bg-white/10 text-white'} rounded-2xl` }>
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium">Notes</span>
          </motion.button>

          {/* Profile & Settings combined */}
          <motion.button
            onClick={() => setScreen(activeScreen === 'Profile' ? 'Settings' : 'Profile')}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all duration-200 min-w-[48px] min-h-[48px]
              ${activeScreen === 'Profile' || activeScreen === 'Settings' ? 'text-white' : 'text-white/70'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${(activeScreen==='Profile'||activeScreen==='Settings') ? 'bg-white text-black' : 'bg-white/10 text-white'} rounded-2xl` }>
              {activeScreen === 'Settings' ? (
                <GiftIcon className="w-5 h-5" />
              ) : (
                <UserCircleIcon className="w-5 h-5" />
              )}
            </div>
            <span className="text-[11px] font-medium">
              {activeScreen === 'Settings' ? 'Settings' : 'Profile'}
            </span>
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
}

export default Navigation;