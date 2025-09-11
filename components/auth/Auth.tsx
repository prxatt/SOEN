import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Signup from './Signup';
import { PraxisLogo } from '../Icons';

interface AuthProps {
    onLogin: () => void;
}

function Auth({ onLogin }: AuthProps) {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
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
                className="text-center mb-8"
            >
                <PraxisLogo className="w-16 h-16 mx-auto mb-3 text-text" />
                <h1 className="text-4xl font-bold font-display text-text">Welcome to Praxis</h1>
                <p className="text-md text-text-secondary">Your AI-powered command center.</p>
            </motion.div>
                
            <motion.div 
                layout
                className="w-full max-w-md bg-card/60 dark:bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isLoginView ? 'login' : 'signup'}
                        initial={{ opacity: 0, x: isLoginView ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isLoginView ? -50 : 50 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="p-8"
                    >
                         {isLoginView ? <Login onLogin={onLogin} /> : <Signup onLogin={onLogin} />}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
            >
                <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm font-medium text-text-secondary hover:text-accent transition-colors">
                    {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
            </motion.div>
        </div>
    );
};

export default Auth;