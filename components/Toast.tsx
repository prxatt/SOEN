import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from './Icons';

interface ToastProps {
  message: string;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Toast({ message, onClose, action }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, action ? 7000 : 4000); // Improved timing: more time to read and react

    return () => clearTimeout(timer);
  }, [onClose, action]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl shadow-xl backdrop-blur-xl flex items-center gap-3 bg-card/95 text-text border border-border/50 min-w-[280px] max-w-[420px]"
      role="alert"
    >
      <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0" />
      <p className="font-medium text-base leading-relaxed text-text">{message}</p>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onClose(); // Close toast immediately on action
          }}
          className="ml-2 px-3 py-1.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 shadow-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default Toast;
