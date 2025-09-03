import { Task, Category, TaskStatus } from '../types';
import { LEARNING_MULTIPLIER } from '../constants';

export const getActualDuration = (task: Task): number => {
// FIX: 'Category' is a type, not an enum. Compare to the string literal 'Learning'.
    if(task.category === 'Learning') {
        return task.plannedDuration * LEARNING_MULTIPLIER;
    }
    return task.plannedDuration;
};

export const calculateStreak = (tasks: Task[]): number => {
    const completedDates = new Set<string>();
    tasks.forEach(task => {
        if (task.status === TaskStatus.Completed) {
            const d = new Date(task.startTime);
            d.setHours(0, 0, 0, 0);
            completedDates.add(d.toISOString().split('T')[0]);
        }
    });

    if (completedDates.size === 0) return 0;

    let streakCount = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = checkDate.toISOString().split('T')[0];
    const hasCompletedToday = completedDates.has(todayStr);

    if (!hasCompletedToday) {
        // If no tasks were completed today, check if the streak ended yesterday.
        // If not, the streak is 0.
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];
        if (!completedDates.has(yesterdayStr)) {
            return 0;
        }
    }
    
    // Starting from today (or yesterday if today had no completions), count backwards.
    while (completedDates.has(checkDate.toISOString().split('T')[0])) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streakCount;
};

export const getTodaysTaskCompletion = (tasks: Task[]): number => {
    const today = new Date().toDateString();
    const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today);
    if (todaysTasks.length === 0) return 0;
    const completedTasks = todaysTasks.filter(t => t.status === TaskStatus.Completed);
    return Math.round((completedTasks.length / todaysTasks.length) * 100);
}

export const inferHomeLocation = (tasks: Task[]): string | null => {
    const locationCounts: Record<string, number> = {};
    let sleepLocation: string | null = null;

    tasks.forEach(task => {
        if (task.location && !task.isVirtual) {
            const hour = new Date(task.startTime).getHours();
            // Prioritize tasks named "Sleep"
            if (task.title.toLowerCase().includes('sleep')) {
                sleepLocation = task.location;
            }
            // Count locations for tasks occurring during typical home hours (e.g., 10 PM - 6 AM)
            if (hour >= 22 || hour <= 6) {
                locationCounts[task.location] = (locationCounts[task.location] || 0) + 1;
            }
        }
    });

    if (sleepLocation) {
        return sleepLocation;
    }

    // Find the most frequent nighttime location
    const mostFrequentLocation = Object.entries(locationCounts).sort(([, a], [, b]) => b - a)[0];

    return mostFrequentLocation ? mostFrequentLocation[0] : null;
};
