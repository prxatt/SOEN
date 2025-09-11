import React from 'react';
// FIX: Import Variants to correctly type animation variants.
import { motion, Variants } from 'framer-motion';
import { PraxisLogo } from './Icons';

// FIX: Explicitly type pathVariants as Variants to ensure correct type inference for properties like 'ease'.
const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 1.5,
            ease: "easeInOut",
        }
    }
};

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center">
        <style>{`
            body {
                background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                background-size: 400% 400%;
                animation: gradient-shift 15s ease infinite;
            }
            html.dark body {
                background: #101010;
            }
        `}</style>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <PraxisLogo 
                className="w-24 h-24 text-white" 
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.5
                        }
                    }
                }}
                initial="hidden"
                animate="visible"
            >
                <motion.path
                    d="M25 25H75V40H60C52.268 40, 46 46.268, 46 54V75H25V25Z"
                    stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"
                    variants={pathVariants}
                />
                <motion.path
                    d="M54 75L54 60C54 54.4772, 58.4772 50, 64 50L75 50"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                    variants={pathVariants}
                />
            </PraxisLogo>
        </motion.div>
         <motion.p 
            className="mt-4 text-white/80 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
        >
            Synchronizing with Kiko...
        </motion.p>
    </div>
  );
};

export default LoadingScreen;