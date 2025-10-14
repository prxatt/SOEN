/**
 * MiraWisdom Component
 * 
 * AI-powered wisdom and insights from Mira
 * Features:
 * - Contextual wisdom based on user data
 * - Animated wisdom display
 * - Interactive insights
 * - Personalized messages
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Note, HealthData } from '../../types';
import { safeGet } from '../../utils/validation';
import { BrainCircuitIcon, SparklesIcon, FireIcon, HeartIcon } from '../Icons';

interface MiraWisdomProps {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
}

interface WisdomData {
    quote: string;
    context: string;
    type: 'philosopher' | 'silly' | 'partner' | 'companion';
    category: 'motivation' | 'productivity' | 'health' | 'wisdom';
}

const MiraWisdom: React.FC<MiraWisdomProps> = ({ tasks, notes, healthData }) => {
    const [wisdom, setWisdom] = useState<WisdomData>({
        quote: '',
        context: '',
        type: 'companion',
        category: 'motivation'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const lastGeneratedDate = useRef<string>('');
    const quoteCount = useRef<number>(0);

    // Generate contextual wisdom based on user data
    const generateWisdom = () => {
        const today = new Date().toDateString();
        
        // Don't regenerate if already generated today
        if (lastGeneratedDate.current === today && wisdom.quote) {
            return;
        }

        setIsLoading(true);
        
        // Analyze user data for context
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const energyLevel = healthData.energyLevel || 'medium';
        const recentNotes = notes.filter(n => {
            const noteDate = new Date(n.updatedAt);
            const daysDiff = (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }).length;

        // Wisdom categories and quotes
        const wisdomCategories = {
            motivation: [
                {
                    quote: "Every task completed is a step closer to your dreams. Let's make today count!",
                    context: "High completion rate detected",
                    type: "companion" as const
                },
                {
                    quote: "Consistency is the bridge between goals and accomplishments. You've got this!",
                    context: "Building daily habits",
                    type: "philosopher" as const
                },
                {
                    quote: "Small progress is still progress. Celebrate every win, no matter how small.",
                    context: "Encouraging consistency",
                    type: "partner" as const
                }
            ],
            productivity: [
                {
                    quote: "Your future self will thank you for the work you do today. Keep pushing forward!",
                    context: "Productivity boost needed",
                    type: "companion" as const
                },
                {
                    quote: "Discipline is choosing between what you want now and what you want most.",
                    context: "Focus on priorities",
                    type: "philosopher" as const
                },
                {
                    quote: "The only impossible journey is the one you never begin. Start where you are!",
                    context: "Overcoming procrastination",
                    type: "partner" as const
                }
            ],
            health: [
                {
                    quote: "Your body is your most important tool. Take care of it, and it will take care of you.",
                    context: "Health awareness",
                    type: "companion" as const
                },
                {
                    quote: "Energy flows where attention goes. Focus on what energizes you today.",
                    context: "Energy optimization",
                    type: "philosopher" as const
                },
                {
                    quote: "Rest is not a luxury, it's a necessity for peak performance.",
                    context: "Work-life balance",
                    type: "partner" as const
                }
            ],
            wisdom: [
                {
                    quote: "The best way to find yourself is to lose yourself in the service of others.",
                    context: "Personal growth",
                    type: "philosopher" as const
                },
                {
                    quote: "No act of kindness, no matter how small, is ever wasted.",
                    context: "Compassionate living",
                    type: "companion" as const
                },
                {
                    quote: "In a world where you can be anything, be kind. It costs nothing but means everything.",
                    context: "Values and character",
                    type: "partner" as const
                }
            ]
        };

        // Determine category based on user data
        let selectedCategory: keyof typeof wisdomCategories = 'motivation';
        
        if (completionRate < 30) {
            selectedCategory = 'motivation';
        } else if (completionRate >= 30 && completionRate < 70) {
            selectedCategory = 'productivity';
        } else if (energyLevel === 'low' || healthData.avgSleepHours < 7) {
            selectedCategory = 'health';
        } else if (recentNotes > 3) {
            selectedCategory = 'wisdom';
        }

        // Select random quote from category
        const categoryQuotes = wisdomCategories[selectedCategory];
        const randomQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];

        setWisdom({ ...randomQuote, category: selectedCategory });

        lastGeneratedDate.current = today;
        quoteCount.current += 1;
        setIsLoading(false);
    };

    useEffect(() => {
        generateWisdom();
    }, [tasks, notes, healthData]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'motivation': return <FireIcon className="w-5 h-5 text-orange-400" />;
            case 'productivity': return <SparklesIcon className="w-5 h-5 text-blue-400" />;
            case 'health': return <HeartIcon className="w-5 h-5 text-red-400" />;
            case 'wisdom': return <BrainCircuitIcon className="w-5 h-5 text-purple-400" />;
            default: return <SparklesIcon className="w-5 h-5 text-blue-400" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'motivation': return 'bg-orange-500/10 border-orange-500/20';
            case 'productivity': return 'bg-blue-500/10 border-blue-500/20';
            case 'health': return 'bg-red-500/10 border-red-500/20';
            case 'wisdom': return 'bg-blue-500/10 border-blue-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    if (isLoading) {
        return (
            <motion.div
                className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <BrainCircuitIcon className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <h3 className="text-white text-lg font-semibold">Mira is thinking...</h3>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`${getCategoryColor(wisdom.category)} rounded-xl p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
                    >
                        <span className="text-lg">×</span>
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        {getCategoryIcon(wisdom.category)}
                        <div>
                            <h3 className="text-white text-lg font-semibold">Mira's Wisdom</h3>
                            <p className="text-white/70 text-sm">{wisdom.context}</p>
                        </div>
                    </div>

                    {/* Quote */}
                    <motion.div
                        className="mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <p className="text-white text-lg italic leading-relaxed">
                            "{wisdom.quote}"
                        </p>
                    </motion.div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">
                            — Mira's Wisdom
                        </div>
                        <button
                            onClick={generateWisdom}
                            className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                        >
                            New Wisdom →
                        </button>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MiraWisdom;
