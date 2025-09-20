/**
 * TaskAnalytics Component
 * 
 * Displays comprehensive task analytics and habit tracking
 * Features:
 * - Task completion trends
 * - Category breakdown
 * - Habit tracking calendar
 * - Performance metrics
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, PieChart, Pie } from 'recharts';
import { Task, Category } from '../../types';
import { FireIcon, CheckCircleIcon, ClockIcon, SparklesIcon } from '../Icons';

interface TaskAnalyticsProps {
    tasks: Task[];
    categoryColors: Record<Category, string>;
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ tasks, categoryColors }) => {
    // Process task data for analytics
    const analyticsData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date;
        });

        // Task completion by day
        const dailyCompletion = last7Days.map(date => {
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.startTime);
                return taskDate.toDateString() === date.toDateString();
            });
            
            const completed = dayTasks.filter(task => task.status === 'Completed').length;
            const total = dayTasks.length;
            
            return {
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completed,
                total,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }).reverse();

        // Category breakdown
        const categoryBreakdown = Object.keys(categoryColors).map(category => {
            const categoryTasks = tasks.filter(task => task.category === category);
            const completed = categoryTasks.filter(task => task.status === 'Completed').length;
            const total = categoryTasks.length;
            
            return {
                category,
                completed,
                total,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                color: categoryColors[category as Category]
            };
        }).filter(item => item.total > 0);

        // Overall stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'Completed').length;
        const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Streak calculation
        let currentStreak = 0;
        const todayTasks = tasks.filter(task => {
            const taskDate = new Date(task.startTime);
            return taskDate.toDateString() === today.toDateString();
        });
        const todayCompleted = todayTasks.filter(task => task.status === 'Completed').length;
        const todayCompletionRate = todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 100 : 0;
        
        if (todayCompletionRate >= 80) {
            currentStreak = 1;
            // Calculate previous days streak
            for (let i = 1; i <= 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.toDateString() === checkDate.toDateString();
                });
                const dayCompleted = dayTasks.filter(task => task.status === 'Completed').length;
                const dayCompletionRate = dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;
                
                if (dayCompletionRate >= 80) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        return {
            dailyCompletion,
            categoryBreakdown,
            overallCompletionRate,
            currentStreak,
            totalTasks,
            completedTasks
        };
    }, [tasks, categoryColors]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Task Analytics</h2>
                <p className="text-gray-400">Track your productivity and build better habits</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-white font-semibold">Completion Rate</h3>
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{analyticsData.overallCompletionRate}%</div>
                    <div className="text-gray-400 text-sm">
                        {analyticsData.completedTasks} of {analyticsData.totalTasks} tasks
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <FireIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <h3 className="text-white font-semibold">Current Streak</h3>
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{analyticsData.currentStreak}</div>
                    <div className="text-gray-400 text-sm">days in a row</div>
                </motion.div>

                <motion.div
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <ClockIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-white font-semibold">Total Tasks</h3>
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{analyticsData.totalTasks}</div>
                    <div className="text-gray-400 text-sm">all time</div>
                </motion.div>
            </div>

            {/* Daily Completion Chart */}
            <motion.div
                className="bg-white/5 rounded-xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-white text-xl font-semibold mb-4">7-Day Completion Trend</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.dailyCompletion}>
                            <Bar dataKey="completionRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
                className="bg-white/5 rounded-xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h3 className="text-white text-xl font-semibold mb-4">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.categoryBreakdown.map((category, index) => (
                        <motion.div
                            key={category.category}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                        >
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                                <span className="text-white font-medium">{category.category}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-bold">{category.completionRate}%</div>
                                <div className="text-gray-400 text-sm">
                                    {category.completed}/{category.total}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Motivation Message */}
            <motion.div
                className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <SparklesIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-white text-lg font-semibold">Keep Going!</h3>
                </div>
                <p className="text-gray-300">
                    {analyticsData.currentStreak > 0 
                        ? `Amazing! You've maintained a ${analyticsData.currentStreak}-day streak. Keep up the momentum!`
                        : analyticsData.overallCompletionRate > 70
                        ? "Great job! You're maintaining a high completion rate. Try to build a daily streak!"
                        : "Every task completed is progress. Focus on consistency to build better habits!"
                    }
                </p>
            </motion.div>
        </div>
    );
};

export default TaskAnalytics;
