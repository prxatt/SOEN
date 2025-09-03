import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

interface AuthProps {
    onLogin: () => void;
    Logo: React.FC<React.SVGProps<SVGSVGElement>>;
}

const Auth: React.FC<AuthProps> = ({ onLogin, Logo }) => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 animate-fade-in">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Logo className="w-16 h-16 mx-auto mb-4 text-light-text dark:text-dark-text" />
                    <h1 className="text-3xl font-bold font-display text-light-text dark:text-dark-text">PRAXIS</h1>
                    <p className="text-md text-light-text-secondary dark:text-dark-text-secondary">by Surface Tension</p>
                </div>
                
                {isLoginView ? <Login onLogin={onLogin} /> : <Signup onLogin={onLogin} />}

                <div className="text-center mt-6">
                    <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-accent dark:hover:text-accent transition-colors">
                        {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;