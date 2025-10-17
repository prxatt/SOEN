import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Signup from './Signup';
import { SoenLogo } from '../Icons';
import { auth, supabase } from '../../src/lib/supabase-client';

// Error Boundary Component
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Something went wrong with the authentication system. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AuthProps {
    onLogin: () => void;
}

function Auth({ onLogin }: AuthProps) {
    // Ultra-safe state initialization with error handling
    const [isLoginView, setIsLoginView] = useState(true);
    const [keysPressed, setKeysPressed] = useState<Set<string>>(() => new Set());
    const [isDevMode, setIsDevMode] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize component safely
    useEffect(() => {
        try {
            setIsInitialized(true);
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }, []);

    // Ultra-safe keyboard bypass for testing: C + 1 + 0
    useEffect(() => {
        // Safe key normalization function
        const normalizeKey = (key: any): string | null => {
            try {
                if (key === null || key === undefined) return null;
                if (typeof key !== 'string') return null;
                return key.toLowerCase();
            } catch {
                return null;
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            try {
                const normalizedKey = normalizeKey(event?.key);
                if (normalizedKey) {
                    setKeysPressed(prev => {
                        try {
                            return new Set(prev).add(normalizedKey);
                        } catch {
                            return prev;
                        }
                    });
                }
            } catch (error) {
                console.warn('Key down event error:', error);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            try {
                const normalizedKey = normalizeKey(event?.key);
                if (normalizedKey) {
                    setKeysPressed(prev => {
                        try {
                            const newSet = new Set(prev);
                            newSet.delete(normalizedKey);
                            return newSet;
                        } catch {
                            return prev;
                        }
                    });
                }
            } catch (error) {
                console.warn('Key up event error:', error);
            }
        };

        // Add event listeners with error handling
        try {
            window.addEventListener('keydown', handleKeyDown, { passive: true });
            window.addEventListener('keyup', handleKeyUp, { passive: true });
        } catch (error) {
            console.warn('Failed to add keyboard event listeners:', error);
        }

        return () => {
            try {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            } catch (error) {
                console.warn('Failed to remove keyboard event listeners:', error);
            }
        };
    }, []);

    useEffect(() => {
        try {
            // Check if C, 1, and 0 are all pressed
            if (keysPressed && keysPressed.has && keysPressed.has('c') && keysPressed.has('1') && keysPressed.has('0')) {
                console.log('🚀 Testing bypass activated!');
                setIsDevMode(true);
                handleDevBypass();
            }
        } catch (error) {
            console.warn('Keyboard bypass effect error:', error);
        }
    }, [keysPressed]);

    const handleDevBypass = () => {
        try {
            localStorage.setItem('soen-authenticated', 'true');
            localStorage.setItem('soen-dev-mode', 'true');
            onLogin();
        } catch (error) {
            console.error('Dev bypass error:', error);
        }
    };

    const handleSupabaseLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            console.log('Attempting login for:', email);
            const { data, error } = await auth.signIn(email, password);
            
            if (error) {
                console.error('Login error:', error);
                setAuthError(error.message);
                return;
            }
            
            if (data?.user) {
                console.log('Login successful for user:', data.user.id);
                localStorage.setItem('soen-authenticated', 'true');
                localStorage.setItem('soen-user-id', data.user.id);
                localStorage.setItem('soen-user-email', data.user.email || '');
                onLogin();
            } else {
                setAuthError('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setAuthError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSupabaseSignup = async (email: string, password: string, fullName: string) => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            console.log('Attempting signup for:', email);
            const { data, error } = await auth.signUp(email, password, fullName);
            
            if (error) {
                console.error('Signup error:', error);
                setAuthError(error.message);
                return;
            }
            
            if (data?.user) {
                console.log('Signup successful for user:', data.user.id);
                localStorage.setItem('soen-authenticated', 'true');
                localStorage.setItem('soen-user-id', data.user.id);
                localStorage.setItem('soen-user-email', data.user.email || '');
                onLogin();
            } else {
                setAuthError('Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setAuthError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Ultra-safe render checks
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing...</p>
                </div>
            </div>
        );
    }

    // Error boundary fallback
    if (!supabase) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Supabase Connection Error</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Unable to connect to Supabase. Please check your configuration.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
            {/* Dev Mode Indicator */}
            {isDevMode && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold z-50"
                >
                    DEV MODE
                </motion.div>
            )}

            {/* Auth Error Display */}
            {authError && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded text-sm z-50"
                >
                    {authError}
                </motion.div>
            )}

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
                         {isLoginView ? (
                             <Login 
                                 onLogin={handleSupabaseLogin}
                                 isLoading={isLoading}
                             />
                         ) : (
                             <Signup 
                                 onSignup={handleSupabaseSignup}
                                 isLoading={isLoading}
                             />
                         )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
            >
                <button 
                    onClick={() => {
                        setIsLoginView(!isLoginView);
                        setAuthError(null);
                    }} 
                    className="text-sm font-medium text-black/70 dark:text-white/70 hover:text-accent transition-colors"
                >
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

// Wrap Auth component with error boundary
const AuthWithErrorBoundary = (props: AuthProps) => (
    <AuthErrorBoundary>
        <Auth {...props} />
    </AuthErrorBoundary>
);

export default AuthWithErrorBoundary;