import React from 'react';

interface SignupProps {
    onLogin: () => void; // For MVP, signup will also just log the user in
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Signup({ onLogin }: SignupProps) {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="card p-8 rounded-2xl shadow-lg w-full animate-fade-in-fast">
            <h2 className="text-2xl font-bold text-center mb-6 font-display">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input type="text" id="name" name="name" required 
                           className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="email-signup" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" id="email-signup" name="email" required 
                           className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="password-signup"className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input type="password" id="password-signup" name="password" required 
                           className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <button type="submit" 
                        className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200">
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Signup;
