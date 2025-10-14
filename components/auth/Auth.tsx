import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Signup from './Signup';
import { SoenLogo } from '../Icons';

interface AuthProps {
    onLogin: () => void;
}

function Auth({ onLogin }: AuthProps) {
    const [isLoginView, setIsLoginView] = useState(true);
    const [keysPressed, setKeysPressed] = useState(new Set<string>());

    // Keyboard bypass for testing: C + 1 + 0
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            setKeysPressed(prev => new Set(prev).add(event.key.toLowerCase()));
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            setKeysPressed(prev => {
                const newSet = new Set(prev);
                newSet.delete(event.key.toLowerCase());
                return newSet;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        // Check if C, 1, and 0 are all pressed
        if (keysPressed.has('c') && keysPressed.has('1') && keysPressed.has('0')) {
            console.log('🚀 Testing bypass activated!');
            onLogin();
        }
    }, [keysPressed, onLogin]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
             <style>{`
                body {
                    background: #FAFAFA !important;
                }
                html.dark body {
                    background: #000000 !important;
                }
            `}</style>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <SoenLogo className="w-16 h-16 mx-auto mb-3 text-black dark:text-white" />
                <h1 className="text-4xl font-bold font-display text-black dark:text-white">Welcome to Soen</h1>
                <p className="text-md text-black/70 dark:text-white/70">Your AI-powered command center.</p>
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
                <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm font-medium text-black/70 dark:text-white/70 hover:text-accent transition-colors">
                    {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
                {/* Testing bypass indicator */}
                {(keysPressed.has('c') || keysPressed.has('1') || keysPressed.has('0')) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-xs text-accent"
                    >
                        Testing bypass: {Array.from(keysPressed).join(' + ')} 
                        {keysPressed.has('c') && keysPressed.has('1') && keysPressed.has('0') ? ' ✓' : ''}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default Auth;