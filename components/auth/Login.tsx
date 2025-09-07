import React from 'react';

interface LoginProps {
    onLogin: () => void;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Login({ onLogin }: LoginProps) {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="card p-8 rounded-2xl shadow-lg w-full animate-fade-in-fast">
            <h2 className="text-2xl font-bold text-center mb-6 font-display">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" id="email" name="email" required 
                           className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="password"className="block text-sm font-medium text-text-secondary">Password</label>
                        <a href="#" className="text-xs font-medium text-accent hover:underline">Forgot Password?</a>
                    </div>
                    <input type="password" id="password" name="password" required 
                           className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <button type="submit" 
                        className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
