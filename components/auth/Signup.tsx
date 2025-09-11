import React from 'react';
import { GoogleIcon, AppleIcon } from '../Icons';

interface SignupProps {
    onLogin: () => void; // For MVP, signup will also just log the user in
}

function Signup({ onLogin }: SignupProps) {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-6 font-display">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input type="text" id="name" name="name" required 
                           className="block w-full px-4 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="email-signup" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" id="email-signup" name="email" required 
                           className="block w-full px-4 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="password-signup"className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input type="password" id="password-signup" name="password" required 
                           className="block w-full px-4 py-2 bg-bg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div className="flex items-start gap-2 pt-2">
                    <input type="checkbox" id="terms" required className="h-4 w-4 mt-1 rounded border-border bg-bg text-accent focus:ring-accent"/>
                    <label htmlFor="terms" className="text-xs text-text-secondary">
                        I agree to the <a href="#" className="font-medium text-accent hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-accent hover:underline">Privacy Policy</a>.
                    </label>
                </div>

                <button type="submit" 
                        className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200">
                    Create Account
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
                    Sign up with Google
                </button>
                 <button className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-bg hover:bg-border/50 border border-border text-text font-semibold rounded-xl transition-colors">
                    <AppleIcon className="w-5 h-5" />
                    Sign up with Apple
                </button>
            </div>
        </div>
    );
};

export default Signup;