/**
 * HealthMetrics Component
 * 
 * Displays comprehensive health tracking and insights
 * Features:
 * - Sleep tracking
 * - Energy levels
 * - Activity metrics
 * - Health trends
 * - Interactive charts
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { HealthData } from '../../types';
import { safeGet } from '../../utils/validation';
import { HeartIcon, BoltIcon, SunIcon, ActivityIcon } from '../Icons';

interface HealthMetricsProps {
    healthData: HealthData;
}

const HealthMetrics: React.FC<HealthMetricsProps> = ({ healthData }) => {
    const [activeMetric, setActiveMetric] = useState<'sleep' | 'energy' | 'activity'>('sleep');

    // Process health data for visualization
    const healthMetrics = useMemo(() => {
        const sleep = {
            hours: safeGet(healthData, 'avgSleepHours', 7.5),
            quality: healthData.sleepQuality || 'Good',
            color: '#10B981'
        };

        const energy = {
            level: healthData.energyLevel || 'High',
            percentage: healthData.energyLevel === 'high' ? 85 : healthData.energyLevel === 'medium' ? 60 : 35,
            color: '#F59E0B'
        };

        const activity = {
            steps: safeGet(healthData, 'stepsToday', 8500),
            heartRate: safeGet(healthData, 'heartRate', 72),
            calories: safeGet(healthData, 'caloriesBurned', 2100),
            color: '#EF4444'
        };

        // Generate mock weekly data for trends
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sleep: sleep.hours + (Math.random() - 0.5) * 2,
                energy: energy.percentage + (Math.random() - 0.5) * 20,
                steps: activity.steps + (Math.random() - 0.5) * 2000,
                heartRate: activity.heartRate + (Math.random() - 0.5) * 10
            };
        });

        return {
            sleep,
            energy,
            activity,
            weeklyData
        };
    }, [healthData]);

    const getEnergyColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'high': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'low': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getSleepQualityColor = (quality: string) => {
        switch (quality.toLowerCase()) {
            case 'excellent': return '#10B981';
            case 'good': return '#3B82F6';
            case 'fair': return '#F59E0B';
            case 'poor': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Health Metrics</h2>
                <p className="text-gray-400">Track your wellness and optimize your performance</p>
            </div>

            {/* Metric Tabs */}
            <div className="flex gap-2 justify-center">
                {[
                    { id: 'sleep', label: 'Sleep', icon: SunIcon },
                    { id: 'energy', label: 'Energy', icon: BoltIcon },
                    { id: 'activity', label: 'Activity', icon: ActivityIcon }
                ].map((metric) => (
                    <motion.button
                        key={metric.id}
                        onClick={() => setActiveMetric(metric.id as any)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                            activeMetric === metric.id
                                ? 'bg-white text-black shadow-lg'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <metric.icon className="w-5 h-5" />
                        {metric.label}
                    </motion.button>
                ))}
            </div>

            {/* Sleep Metrics */}
            {activeMetric === 'sleep' && (
                <motion.div
                    key="sleep"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Sleep Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${healthMetrics.sleep.color}20` }}
                                >
                                    <SunIcon className="w-6 h-6" style={{ color: healthMetrics.sleep.color }} />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Sleep Duration</h3>
                                    <p className="text-gray-400 text-sm">Last night</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.sleep.hours}h</div>
                            <div className="text-gray-400 text-sm">Average per night</div>
                        </motion.div>

                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${getSleepQualityColor(healthMetrics.sleep.quality)}20` }}
                                >
                                    <HeartIcon className="w-6 h-6" style={{ color: getSleepQualityColor(healthMetrics.sleep.quality) }} />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Sleep Quality</h3>
                                    <p className="text-gray-400 text-sm">Overall rating</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.sleep.quality}</div>
                            <div className="text-gray-400 text-sm">Quality assessment</div>
                        </motion.div>
                    </div>

                    {/* Sleep Trend Chart */}
                    <motion.div
                        className="bg-white/5 rounded-xl p-6 border border-white/10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-white text-xl font-semibold mb-4">7-Day Sleep Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={healthMetrics.weeklyData}>
                                    <Area 
                                        type="monotone" 
                                        dataKey="sleep" 
                                        stroke="#10B981" 
                                        fill="#10B981" 
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Energy Metrics */}
            {activeMetric === 'energy' && (
                <motion.div
                    key="energy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Energy Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${getEnergyColor(healthMetrics.energy.level)}20` }}
                                >
                                    <BoltIcon className="w-6 h-6" style={{ color: getEnergyColor(healthMetrics.energy.level) }} />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Energy Level</h3>
                                    <p className="text-gray-400 text-sm">Current status</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.energy.level}</div>
                            <div className="text-gray-400 text-sm">Today's energy</div>
                        </motion.div>

                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/20">
                                    <ActivityIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Energy Percentage</h3>
                                    <p className="text-gray-400 text-sm">Measured level</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.energy.percentage}%</div>
                            <div className="text-gray-400 text-sm">Current level</div>
                        </motion.div>
                    </div>

                    {/* Energy Trend Chart */}
                    <motion.div
                        className="bg-white/5 rounded-xl p-6 border border-white/10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-white text-xl font-semibold mb-4">7-Day Energy Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={healthMetrics.weeklyData}>
                                    <Line 
                                        type="monotone" 
                                        dataKey="energy" 
                                        stroke="#F59E0B" 
                                        strokeWidth={3}
                                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Activity Metrics */}
            {activeMetric === 'activity' && (
                <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Activity Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/20">
                                    <ActivityIcon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Steps</h3>
                                    <p className="text-gray-400 text-sm">Today</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                {healthMetrics.activity.steps.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-sm">Total steps</div>
                        </motion.div>

                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/20">
                                    <HeartIcon className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Heart Rate</h3>
                                    <p className="text-gray-400 text-sm">BPM</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.activity.heartRate}</div>
                            <div className="text-gray-400 text-sm">Beats per minute</div>
                        </motion.div>

                        <motion.div
                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/20">
                                    <BoltIcon className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Calories</h3>
                                    <p className="text-gray-400 text-sm">Burned</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{healthMetrics.activity.calories}</div>
                            <div className="text-gray-400 text-sm">Calories burned</div>
                        </motion.div>
                    </div>

                    {/* Activity Trend Chart */}
                    <motion.div
                        className="bg-white/5 rounded-xl p-6 border border-white/10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-white text-xl font-semibold mb-4">7-Day Activity Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={healthMetrics.weeklyData}>
                                    <Area 
                                        type="monotone" 
                                        dataKey="steps" 
                                        stroke="#EF4444" 
                                        fill="#EF4444" 
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Health Insights */}
            <motion.div
                className="bg-green-500/10 rounded-xl p-6 border border-green-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <HeartIcon className="w-6 h-6 text-green-400" />
                    <h3 className="text-white text-lg font-semibold">Health Insights</h3>
                </div>
                <p className="text-gray-300">
                    {healthMetrics.sleep.hours >= 8 
                        ? "Great sleep habits! You're getting optimal rest for peak performance."
                        : healthMetrics.sleep.hours >= 6
                        ? "Your sleep is decent, but try to aim for 7-8 hours for better recovery."
                        : "Consider improving your sleep routine. Quality rest is crucial for productivity."
                    }
                </p>
            </motion.div>
        </div>
    );
};

export default HealthMetrics;
