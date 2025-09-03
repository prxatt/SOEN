import React from 'react';
import { motion } from 'framer-motion';

const PraxisLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <motion.path 
            d="M25 25H75V40H60C52.268 40, 46 46.268, 46 54V75H25V25Z" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinejoin="round"
        />
        <motion.path 
            d="M54 75L54 60C54 54.4772, 58.4772 50, 64 50L75 50" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <PraxisLogo className="w-16 h-16 text-accent" />
      </motion.div>
      <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary font-semibold">
        Generating daily intelligence...
      </p>
    </div>
  );
};

export default LoadingSpinner;
