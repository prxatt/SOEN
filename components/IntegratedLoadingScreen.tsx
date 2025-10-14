import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SoenLogo } from './Icons';

interface IntegratedLoadingScreenProps {
  onComplete: () => void;
}

const IntegratedLoadingScreen = ({ onComplete }: IntegratedLoadingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { text: "Initializing Soen", duration: 800 },
    { text: "Connecting to Mira AI", duration: 1200 },
    { text: "Loading your workspace", duration: 1000 },
    { text: "Ready to begin", duration: 500 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onComplete();
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (progress >= 100) {
      onComplete();
    }
  }, [progress, onComplete]);

  const currentStepIndex = Math.floor((progress / 100) * steps.length);
  const currentStepData = steps[Math.min(currentStepIndex, steps.length - 1)];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <style>{`
        body {
          background: #000000 !important;
        }
      `}</style>
      
      {/* Animated background elements - inspired by Pinterest reference */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center max-w-md mx-auto px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Soen Logo with enhanced animation */}
        <motion.div
          className="mb-8"
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <SoenLogo 
            className="w-32 h-32 text-white mx-auto" 
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 1.5,
                  ease: "easeOut"
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.path
              d="M25 25H75V40H60C52.268 40, 46 46.268, 46 54V75H25V25Z"
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinejoin="round" 
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d="M54 75L54 60C54 54.4772, 58.4772 50, 64 50L75 50"
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
          </SoenLogo>
        </motion.div>

        {/* Soen Title */}
        <motion.h1
          className="text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Soen
        </motion.h1>
        
        <motion.p
          className="text-xl text-gray-300 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          AI-Powered Operating System
        </motion.p>

        {/* Progress Bar - inspired by Pinterest reference */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Current Step Text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStepIndex}
            className="text-white/80 text-sm font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentStepData?.text || "Loading..."}
          </motion.p>
        </AnimatePresence>

        {/* Progress Percentage */}
        <motion.p
          className="text-white/60 text-xs mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.p>
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default IntegratedLoadingScreen;
