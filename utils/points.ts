/**
 * Points Calculation Utility
 * 
 * Centralized logic for calculating SOEN Flow Points.
 * This ensures consistency across all components that calculate points.
 */

import { Task, HealthData } from '../types';

/**
 * Round points to nearest whole number ending in 0 or 5
 */
export const roundToNearestFiveOrZero = (points: number): number => {
    const rounded = Math.round(points);
    const remainder = rounded % 5;
    if (remainder === 0) return rounded;
    // Round to nearest 5
    return rounded + (remainder <= 2 ? -remainder : 5 - remainder);
};

/**
 * Get priority multiplier based on task category
 */
export const getPriorityMultiplier = (task: Task): number => {
    const categoryWeights: Record<string, number> = {
        'Deep Work': 2.0,
        'Learning': 1.8,
        'Prototyping': 1.6,
        'Meeting': 1.2,
        'Workout': 1.4,
        'Editing': 1.3,
        'Personal': 1.1,
        'Admin': 0.8
    };
    
    return categoryWeights[task.category] || 1.0;
};

/**
 * Calculate health impact on points
 */
export const getHealthImpact = (basePoints: number, healthData?: HealthData): number => {
    if (!healthData) return basePoints;
    
    const energyLevel = healthData.energyLevel || 'medium';
    const sleepQuality = healthData.sleepQuality || 'good';
    
    let multiplier = 1.0;
    
    // Energy level impact
    if (energyLevel === 'low') multiplier *= 0.7;
    else if (energyLevel === 'high') multiplier *= 1.1;
    
    // Sleep quality impact
    if (sleepQuality === 'poor') multiplier *= 0.8;
    else if (sleepQuality === 'good') multiplier *= 1.1;
    
    return roundToNearestFiveOrZero(basePoints * multiplier);
};

/**
 * Check if task was completed with Pomodoro timer
 * TODO: Replace with actual Pomodoro service integration
 */
export const checkPomodoroCompletion = (taskId: number): boolean => {
    // Pomodoro Service Integration - Check if task was completed with timer
    return Math.random() > 0.3; // Simulated: 70% chance task was completed with Pomodoro
};

/**
 * Get Pomodoro streak bonus
 * Returns values ending in 0 or 5
 * TODO: Replace with actual Pomodoro streak data
 */
export const getPomodoroStreakBonus = (): number => {
    // Pomodoro Streak Bonus - returns values ending in 0 or 5
    const streak = Math.floor(Math.random() * 10) + 1; // Simulated streak (1-10)
    
    if (streak >= 7) return 10; // 1 week streak (7+ days)
    if (streak >= 4) return 5; // Few days streak (4-6 days)
    
    return 0; // Less than 4 days
};

/**
 * Calculate Flow Points for completed tasks
 */
export const calculateFlowPoints = (
    tasks: Task[],
    healthData?: HealthData
): { totalPoints: number; level: number } => {
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // NEW SYSTEM: Base points reduced to 10 per task
    let totalPoints = 0;
    let dailyPoints = 0;
    
    // Calculate points for each completed task
    for (const task of completedTasks) {
        let taskPoints = 10; // Base points per task
        
        // Apply AI priority multiplier
        const priorityMultiplier = getPriorityMultiplier(task);
        taskPoints *= priorityMultiplier;
        
        // Apply health impact
        const healthImpact = getHealthImpact(taskPoints, healthData);
        taskPoints = healthImpact;
        
        // Check if task was completed with Pomodoro timer
        const pomodoroBonus = checkPomodoroCompletion(task.id) ? 5 : 0;
        taskPoints += pomodoroBonus;
        
        dailyPoints += taskPoints;
    }
    
    // Apply daily cap of 100 points
    dailyPoints = Math.min(dailyPoints, 100);
    
    // Add Pomodoro streak bonuses
    const streakBonus = getPomodoroStreakBonus();
    dailyPoints += streakBonus;
    
    // Add completion rate bonus (reduced) - round to nearest 0 or 5
    const completionBonus = roundToNearestFiveOrZero(completionRate * 0.5);
    dailyPoints += completionBonus;
    
    // Final rounding to ensure points end in 0 or 5
    totalPoints = roundToNearestFiveOrZero(dailyPoints);
    
    // Calculate level (every 500 points = 1 level)
    const level = Math.floor(totalPoints / 500) + 1;
    
    return { totalPoints, level };
};

