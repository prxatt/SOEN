import React, { useState } from 'react';
// FIX: Import Variants type from framer-motion.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Goal } from '../types';
import { XMarkIcon, SparklesIcon, FlagIcon, DocumentTextIcon, ChevronRightIcon, HeartIcon, RocketIcon } from './Icons';

interface OnboardingProps {
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    onComplete: () => void;
}

// FIX: Explicitly type cardVariants with Variants to fix type inference issue with the 'ease' property.
const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: 'easeIn' } },
};

function Onboarding({ goals, setGoals, onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [userName, setUserName] = useState('');
    const [longTermGoal, setLongTermGoal] = useState('');
    const [userHobbies, setUserHobbies] = useState('');

    const handleNext = () => {
        setStep(prev => prev + 1);
    };
    
    const handleFinish = () => {
        if (userName.trim()) {
            localStorage.setItem('soen-user-name', userName.trim());
        }
        if (longTermGoal.trim()) {
            const newGoal: Goal = {
                id: Date.now(),
                term: 'long',
                text: longTermGoal.trim(),
                status: 'active'
            };
            setGoals(prev => [newGoal, ...prev]);
        }
        if (userHobbies.trim()) {
            localStorage.setItem('soen-user-hobbies', userHobbies.trim());
        }
        onComplete();
    };

    const steps = [
        {
            icon: <SparklesIcon />,
            title: "Welcome to Soen",
            content: "Your AI-powered partner for turning knowledge into action. Let's set up your command center."
        },
        {
            icon: <HeartIcon />,
            title: "What's your name?",
            content: "We'd love to personalize your experience.",
            input: (
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none text-lg"
                />
            )
        },
        {
            icon: <FlagIcon />,
            title: "Define Your Vision",
            content: "Everything starts with ambition. Soen uses your goals as the foundation for its strategic insights.",
            isInput: false
        },
        {
            icon: <DocumentTextIcon />,
            title: "Build Your Second Brain",
            content: "Your notes are more than text. Soen analyzes them to find connections, suggest ideas, and turn thoughts into assets.",
            isInput: false
        },
        {
            icon: <HeartIcon />,
            title: "Personalize Your Experience",
            content: "Soen works best when it knows you. What are some of your hobbies or interests?",
            isInput: true,
            value: userHobbies,
            setter: setUserHobbies,
            placeholder: "e.g., Boxing, DJing, art galleries..."
        },
        {
            icon: <RocketIcon />,
            title: "What is your ultimate goal?",
            content: "Let's set your primary long-term objective. This will become the heart of your Soen strategy.",
            isInput: true,
            value: longTermGoal,
            setter: setLongTermGoal,
            placeholder: "e.g., Launch a new digital product line..."
        }
    ];

    const currentStepData = steps[step];

    return (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 flex items-center justify-center p-4 transition-colors">
            <style>{`
                body {
                    background: #FAFAFA !important;
                }
                html.dark body {
                    background: #000000 !important;
                }
            `}</style>
             <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 flex flex-col text-center relative overflow-hidden min-h-[500px]"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/10 via-transparent to-accent/5 dark:from-accent/5 dark:to-accent/0" />
                    <div className="absolute -top-16 -left-16 text-black/5 dark:text-white/5 opacity-50 pointer-events-none">
                       {React.cloneElement(currentStepData.icon, { className: "w-64 h-64" })}
                    </div>

                    <div className="relative z-10 flex flex-col flex-grow">
                        <div className="flex-grow">
                            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4 text-black dark:text-white">{currentStepData.title}</h2>
                            <p className="text-base sm:text-lg text-black/70 dark:text-white/70 mb-8 max-w-md mx-auto">{currentStepData.content}</p>

                            {currentStepData.isInput && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="w-full max-w-sm mx-auto"
                                >
                                    <input 
                                        type="text"
                                        value={currentStepData.value}
                                        onChange={(e) => (currentStepData.setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                                        placeholder={currentStepData.placeholder}
                                        className="w-full text-center bg-white/80 dark:bg-black/80 border border-black/20 dark:border-white/20 rounded-xl shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent text-lg text-black dark:text-white"
                                    />
                                </motion.div>
                            )}

                            {currentStepData.input && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="w-full max-w-sm mx-auto"
                                >
                                    {currentStepData.input}
                                </motion.div>
                            )}
                        </div>

                        <div className="mt-auto pt-8">
                             <div className="flex justify-center gap-2 mb-6">
                                {steps.map((_, i) => (
                                    <div key={i} className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-accent"
                                            initial={{ width: "0%" }}
                                            animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            {step < steps.length - 1 ? (
                                <motion.button 
                                    onClick={handleNext} 
                                    className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Next <ChevronRightIcon className="w-5 h-5"/>
                                </motion.button>
                            ) : (
                                <motion.button 
                                    onClick={handleFinish} 
                                    className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all duration-200"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Let's Begin
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            <button onClick={onComplete} className="absolute top-4 right-4 p-2 text-black/70 dark:text-white/70 hover:text-accent rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>
    );
};

export default Onboarding;
