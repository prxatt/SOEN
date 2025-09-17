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
    }, action ? 6000 : 3000); // Give more time if there's an action

    return () => clearTimeout(timer);
  }, [onClose, action]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, y: -10, scale: 0.95 }}
      className="fixed top-6 right-6 z-[100] p-3 rounded-xl shadow-lg flex items-center gap-3 bg-card text-text border border-border"
      role="alert"
    >
      <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0" />
      <p className="font-semibold text-sm">{message}</p>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onClose(); // Close toast immediately on action
          }}
          className="ml-2 px-3 py-1 text-sm font-bold bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default Toast;
