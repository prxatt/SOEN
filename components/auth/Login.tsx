import React from 'react';
import { GoogleIcon, AppleIcon } from '../Icons';

interface LoginProps {
    onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-6 font-display">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" id="email" name="email" required 
                           className="block w-full px-4 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input type="password" id="password" name="password" required 
                           className="block w-full px-4 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember-me" className="h-4 w-4 rounded border-border bg-bg text-accent focus:ring-accent"/>
                        <label htmlFor="remember-me" className="text-text-secondary">Remember me</label>
                    </div>
                    <a href="#" className="font-medium text-accent hover:underline">Forgot Password?</a>
                </div>

                <button type="submit" 
                        className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200">
                    Login
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-text-secondary">or</span>
                </div>
            </div>
            
            <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-bg hover:bg-border/50 border border-border text-text font-semibold rounded-xl transition-colors">
                    <GoogleIcon className="w-5 h-5" />
                    Sign in with Google
                </button>
                 <button className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-bg hover:bg-border/50 border border-border text-text font-semibold rounded-xl transition-colors">
                    <AppleIcon className="w-5 h-5" />
                    Sign in with Apple
                </button>
            </div>

        </div>
    );
};

export default Login;