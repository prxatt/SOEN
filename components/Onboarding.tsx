import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '../types';
import { XMarkIcon, SparklesIcon, FlagIcon, DocumentTextIcon, ChevronRightIcon, CalendarIcon, HeartIcon, RocketIcon } from './Icons';

interface OnboardingProps {
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    onComplete: () => void;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
};

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Onboarding({ goals, setGoals, onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [longTermGoal, setLongTermGoal] = useState('');
    const [userHobbies, setUserHobbies] = useState('');

    const handleNext = () => {
        setStep(prev => prev + 1);
    };
    
    const handleFinish = () => {
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
            // In a real app, this would be saved to a user profile
            localStorage.setItem('praxis-user-hobbies', userHobbies.trim());
        }
        onComplete();
    };

    const steps = [
        {
            icon: <SparklesIcon className="w-16 h-16 text-accent" />,
            title: "Welcome to Praxis",
            content: "Your AI-powered partner for turning knowledge into action. Connect your learning to your goals, and your goals to your daily schedule."
        },
        {
            icon: <FlagIcon className="w-16 h-16 text-accent" />,
            title: "Define Your Vision",
            content: "Everything starts with your goals. Use the Goals Hub to set your short, mid, and long-term ambitions. Praxis will use these as the foundation for its insights.",
            isInput: false
        },
        {
            icon: <DocumentTextIcon className="w-16 h-16 text-accent" />,
            title: "Build Your Second Brain",
            content: "Your Notes are more than just a place to write. Praxis reads them to find connections, suggest ideas, and generate projects, turning thoughts into assets.",
            isInput: false
        },
        {
            icon: <HeartIcon className="w-16 h-16 text-accent" />,
            title: "Personalize Your Experience",
            content: "Praxis works best when it knows you. What do you do for fun? This helps us tailor future rewards and interactions.",
            isInput: true,
            value: userHobbies,
            setter: setUserHobbies,
            placeholder: "e.g., Boxing, DJing, exploring art galleries..."
        },
        {
            icon: <RocketIcon className="w-16 h-16 text-accent" />,
            title: "What is your ultimate goal?",
            content: "Let's set your primary long-term objective. This will become the heart of your Praxis mind map.",
            isInput: true,
            value: longTermGoal,
            setter: setLongTermGoal,
            placeholder: "e.g., Launch a new digital product line..."
        }
    ];

    return (
        <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center p-4">
             <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="card rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
                >
                    {steps[step].icon && <div className="mx-auto mb-6">{steps[step].icon}</div>}
                    <h2 className="text-2xl font-bold font-display mb-4">{steps[step].title}</h2>
                    <p className="text-text-secondary mb-8">{steps[step].content}</p>

                    {steps[step].isInput ? (
                         <div className="w-full">
                             <input 
                                type="text"
                                value={steps[step].value}
                                onChange={(e) => (steps[step].setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                                placeholder={steps[step].placeholder}
                                className="w-full text-center bg-bg border border-border rounded-lg shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                    ) : null}

                    {step < steps.length - 1 ? (
                         <button onClick={handleNext} className="mt-4 w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2">
                            Next <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                    ) : (
                        <button onClick={handleFinish} className="mt-4 w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md transition-all duration-200">
                            Let's Begin
                        </button>
                    )}

                     <div className="flex justify-center mt-6 gap-2">
                        {steps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-accent' : 'bg-gray-300 dark:bg-border'}`} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
            <button onClick={onComplete} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-accent rounded-full">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>
    );
};

export default Onboarding;
