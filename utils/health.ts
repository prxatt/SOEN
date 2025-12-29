/**
 * Health Metric Utilities
 * 
 * Shared helper functions for calculating and displaying health metrics
 * across Profile, Dashboard, and other components.
 * 
 * Ensures consistency in health data interpretation and display.
 */

export interface HealthMetric {
    value: string;
    color: string;
}

export const HEALTH_COLORS = {
    excellent: '#10b981', // green
    good: '#f59e0b',      // amber
    warning: '#f59e0b',   // amber
    low: '#ef4444',       // red
    poor: '#ef4444'       // red
} as const;

/**
 * Get energy level metric with appropriate color coding
 */
export const getEnergyMetric = (energyLevel?: string): HealthMetric => {
    const level = energyLevel?.toLowerCase();
    if (level === 'high') {
        return { value: 'High', color: HEALTH_COLORS.excellent };
    }
    if (level === 'low') {
        return { value: 'Low', color: HEALTH_COLORS.low };
    }
    return { value: 'Medium', color: HEALTH_COLORS.warning };
};

/**
 * Get sleep metric with appropriate color coding based on hours
 */
export const getSleepMetric = (avgSleepHours?: number): HealthMetric => {
    const hours = avgSleepHours || 0;
    if (hours >= 8) {
        return { value: `${hours}h`, color: HEALTH_COLORS.excellent };
    }
    if (hours >= 6) {
        return { value: `${hours}h`, color: HEALTH_COLORS.good };
    }
    return { value: `${hours}h`, color: HEALTH_COLORS.low };
};

/**
 * Get activity metric with appropriate color coding based on steps
 */
export const getActivityMetric = (stepsToday?: number): HealthMetric => {
    if (!stepsToday) {
        return { value: 'Good', color: HEALTH_COLORS.good };
    }
    if (stepsToday >= 10000) {
        return { value: 'Excellent', color: HEALTH_COLORS.excellent };
    }
    if (stepsToday >= 5000) {
        return { value: 'Good', color: HEALTH_COLORS.good };
    }
    return { value: 'Low', color: HEALTH_COLORS.low };
};

/**
 * Get stress metric based on sleep quality
 * Note: This is a proxy metric - actual stress would come from HRV or other sources
 */
export const getStressMetric = (sleepQuality?: string): HealthMetric => {
    const quality = sleepQuality?.toLowerCase();
    if (quality === 'poor') {
        return { value: 'High', color: HEALTH_COLORS.poor };
    }
    if (quality === 'good') {
        return { value: 'Low', color: HEALTH_COLORS.excellent };
    }
    return { value: 'Medium', color: HEALTH_COLORS.warning };
};

