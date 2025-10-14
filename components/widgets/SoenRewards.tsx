/**
 * SoenRewards Component
 * 
 * Enhanced 3D Soen Rewards Visual with Motivation
 * Features:
 * - 3D animated logo with progress ring
 * - Points calculation system
 * - Level progression
 * - Motivation messages
 * - Interactive elements
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, HealthData } from '../../types';
import { safeGet } from '../../utils/validation';
import { SparklesIcon, FireIcon, CheckCircleIcon, BoltIcon } from '../Icons';

interface SoenRewardsProps {
    tasks: Task[];
    healthData: HealthData;
}

const SoenRewards: React.FC<SoenRewardsProps> = ({ tasks, healthData }) => {
    const [rotation, setRotation] = useState(0);
    const [pulseScale, setPulseScale] = useState(1);
    const [currentPoints, setCurrentPoints] = useState(0);
    const [level, setLevel] = useState(1);

    // Calculate points and level based on tasks and health data
    useEffect(() => {
        const calculatePoints = () => {
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            // Health multiplier based on energy level
            const energyLevel = healthData.energyLevel || 'medium';
            const energyMultiplier = energyLevel === 'high' ? 1.5 : energyLevel === 'medium' ? 1.2 : 1.0;
            
            // Calculate points
            const basePoints = completedTasks * 50;
            const completionBonus = completionRate * 2;
            const energyBonus = basePoints * (energyMultiplier - 1);
            const totalPoints = Math.round(basePoints + completionBonus + energyBonus);
            
            // Calculate level (every 500 points = 1 level)
            const newLevel = Math.floor(totalPoints / 500) + 1;
            
            setCurrentPoints(totalPoints);
            setLevel(newLevel);
        };

        calculatePoints();
    }, [tasks, healthData]);

    // Animation effects
    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setRotation(prev => (prev + 0.5) % 360);
        }, 16);

        const pulseInterval = setInterval(() => {
            setPulseScale(prev => prev === 1 ? 1.05 : 1);
        }, 2000);

        return () => {
            clearInterval(rotationInterval);
            clearInterval(pulseInterval);
        };
    }, []);

    const pointsCalculation = [
        { action: "Complete Task", points: "+50", color: "#10B981", icon: "✓" },
        { action: "Workout", points: "+30", color: "#F59E0B", icon: "⚡" },
        { action: "Create Note", points: "+20", color: "#3B82F6", icon: "📝" },
        { action: "Daily Streak", points: "+100", color: "#EF4444", icon: "🔥" }
    ];

    const nextLevelPoints = level * 500;
    const progressToNext = ((currentPoints % 500) / 500) * 100;

    const getMotivationMessage = () => {
        if (progressToNext > 80) {
            return "Almost there! Keep going!";
        } else if (progressToNext > 50) {
            return "Great progress! You're on fire!";
        } else {
            return "Every point counts! Stay consistent!";
        }
    };

    return (
        <motion.div
            className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-glassmorphism-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            {/* Header with Level and Points */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-white text-2xl font-bold mb-1">Soen Rewards</h3>
                    <p className="text-gray-400 text-sm">Level {level} • {currentPoints} points</p>
                </div>
                <div className="text-right">
                    <div className="text-gray-400 text-xs">Next Level</div>
                    <div className="text-white font-semibold">{nextLevelPoints - currentPoints} pts</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">Today's Progress</span>
                    <span className="text-accent text-sm font-semibold">{Math.round(progressToNext)}%</span>
                </div>
                <div className="w-full bg-surface/30 rounded-full h-3 overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-accent to-accentLight rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* 3D Animated Logo with Progress Ring */}
            <div className="flex justify-center mb-6">
                <motion.div
                    className="relative w-20 h-20"
                    animate={{ 
                        rotateY: rotation,
                        scale: pulseScale
                    }}
                    transition={{ 
                        rotateY: { duration: 0.1, ease: "linear" },
                        scale: { duration: 0.5, ease: "easeInOut" }
                    }}
                >
                    <div className="w-full h-full bg-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">P</span>
                    </div>
                    <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-sm"></div>
                    
                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-white/20"
                        />
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            className="text-accent"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progressToNext / 100 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />
                    </svg>
                </motion.div>
            </div>

            {/* Points Calculation - Horizontal Layout */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {pointsCalculation.map((item, index) => (
                    <motion.div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: `${item.color}10` }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{item.action}</div>
                            <div 
                                className="text-sm font-bold"
                                style={{ color: item.color }}
                            >
                                {item.points}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Motivation Message */}
            <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <div className="text-gray-300 text-sm mb-2">
                    {getMotivationMessage()}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <motion.div 
                        className="h-full bg-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                    />
                </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
                <div className="text-center">
                    <div className="text-white font-bold text-lg">{level}</div>
                    <div className="text-gray-400 text-xs">Level</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-bold text-lg">{currentPoints}</div>
                    <div className="text-gray-400 text-xs">Points</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-bold text-lg">{Math.round(progressToNext)}%</div>
                    <div className="text-gray-400 text-xs">Progress</div>
                </div>
            </div>
        </motion.div>
    );
};

export default SoenRewards;
