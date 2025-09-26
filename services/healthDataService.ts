/**
 * Health Data Service
 * 
 * Comprehensive health data management system inspired by:
 * - Apple HealthKit integration patterns
 * - Google Fit API best practices
 * - Strava's activity tracking algorithms
 * - Headspace's wellness scoring system
 * 
 * Features:
 * - Real-time health data syncing
 * - 3-hour automatic sync logic
 * - Health-based point calculation
 * - Activity duration validation (>15 minutes)
 * - Stress and sleep quality impact scoring
 */

import { HealthData } from '../types';

export interface HealthMetrics {
    sleepQuality: 'poor' | 'fair' | 'good'; // Matches HealthData interface
    stressLevel: number; // 0-100 (higher = more stressed) - internal only
    physicalActivity: number; // minutes of activity >15min
    heartRateVariability: number; // 0-100 (higher = better recovery)
    energyLevel: 'low' | 'medium' | 'high';
    lastSyncTime: Date;
    activityStreak: number; // consecutive days with >15min activity
}

export interface ActivityData {
    type: 'walking' | 'running' | 'cycling' | 'workout' | 'other';
    duration: number; // in minutes
    intensity: 'low' | 'medium' | 'high';
    timestamp: Date;
    source: 'apple_health' | 'google_fit' | 'manual';
}

export interface HealthSyncConfig {
    syncInterval: number; // milliseconds (3 hours = 10,800,000)
    enableAutoSync: boolean;
    lastSyncTime: Date;
    syncSources: ('apple_health' | 'google_fit')[];
}

class HealthDataService {
    private config: HealthSyncConfig = {
        syncInterval: 3 * 60 * 60 * 1000, // 3 hours
        enableAutoSync: true,
        lastSyncTime: new Date(),
        syncSources: ['apple_health', 'google_fit']
    };

    private healthMetrics: HealthMetrics = {
        sleepQuality: 'good',
        stressLevel: 30,
        physicalActivity: 45,
        heartRateVariability: 65,
        energyLevel: 'medium',
        lastSyncTime: new Date(),
        activityStreak: 3
    };

    private activityHistory: ActivityData[] = [];

    /**
     * Calculate health impact on productivity points
     * Inspired by Headspace's wellness scoring and Apple's Activity Rings
     */
    calculateHealthImpact(basePoints: number): number {
        const healthFactors = this.getHealthFactors();
        let multiplier = 1.0;

        // Sleep quality impact (0.7 - 1.2 multiplier)
        if (healthFactors.sleepQuality === 'poor') {
            multiplier *= 0.7; // Poor sleep reduces points significantly
        } else if (healthFactors.sleepQuality === 'good') {
            multiplier *= 1.1; // Excellent sleep gives bonus
        }

        // Stress level impact (0.6 - 1.0 multiplier)
        if (healthFactors.stressLevel > 70) {
            multiplier *= 0.6; // High stress significantly reduces points
        } else if (healthFactors.stressLevel < 30) {
            multiplier *= 1.0; // Low stress maintains full points
        } else {
            multiplier *= 0.8; // Medium stress reduces points moderately
        }

        // Physical activity impact (0.8 - 1.3 multiplier)
        if (healthFactors.physicalActivity < 15) {
            multiplier *= 0.8; // No significant activity reduces points
        } else if (healthFactors.physicalActivity > 60) {
            multiplier *= 1.2; // High activity gives bonus
        }

        // Energy level impact
        switch (healthFactors.energyLevel) {
            case 'low':
                multiplier *= 0.7;
                break;
            case 'medium':
                multiplier *= 0.9;
                break;
            case 'high':
                multiplier *= 1.1;
                break;
        }

        return Math.round(basePoints * multiplier);
    }

    /**
     * Get current health factors for point calculation
     */
    getHealthFactors(): HealthMetrics {
        return { ...this.healthMetrics };
    }

    /**
     * Simulate health data sync (will be replaced with real API calls)
     * Inspired by Apple HealthKit's data aggregation patterns
     */
    async syncHealthData(): Promise<HealthMetrics> {
        // Simulate realistic health data variations
        const now = new Date();
        const hour = now.getHours();
        
        // Simulate sleep quality based on time of day
        let sleepQuality: 'poor' | 'fair' | 'good' = 'good';
        if (hour < 6) sleepQuality = 'poor'; // Early morning = poor sleep
        else if (hour > 22) sleepQuality = 'good'; // Late evening = good sleep
        
        // Simulate stress levels
        let stressLevel = 30;
        if (hour >= 9 && hour <= 17) stressLevel = 45; // Work hours = higher stress
        else if (hour >= 18 && hour <= 21) stressLevel = 25; // Evening = lower stress
        
        // Simulate physical activity
        let physicalActivity = Math.floor(Math.random() * 60) + 20; // 20-80 minutes
        
        // Simulate energy levels
        let energyLevel: 'low' | 'medium' | 'high' = 'medium';
        if (hour >= 6 && hour <= 10) energyLevel = 'high'; // Morning energy
        else if (hour >= 14 && hour <= 16) energyLevel = 'low'; // Afternoon dip
        else if (hour >= 20) energyLevel = 'low'; // Evening fatigue
        
        // Update metrics
        this.healthMetrics = {
            sleepQuality: sleepQuality,
            stressLevel: stressLevel + Math.floor(Math.random() * 20) - 10,
            physicalActivity: physicalActivity,
            heartRateVariability: 65 + Math.floor(Math.random() * 30) - 15,
            energyLevel: energyLevel,
            lastSyncTime: now,
            activityStreak: this.calculateActivityStreak()
        };

        return this.healthMetrics;
    }

    /**
     * Check if sync is needed based on 3-hour interval
     */
    shouldSync(): boolean {
        const now = new Date();
        const timeSinceLastSync = now.getTime() - this.config.lastSyncTime.getTime();
        return timeSinceLastSync >= this.config.syncInterval;
    }

    /**
     * Perform automatic sync if needed
     */
    async autoSync(): Promise<HealthMetrics | null> {
        if (this.shouldSync()) {
            console.log('🔄 Auto-syncing health data...');
            const updatedMetrics = await this.syncHealthData();
            this.config.lastSyncTime = new Date();
            return updatedMetrics;
        }
        return null;
    }

    /**
     * Validate activity duration (>15 minutes requirement)
     */
    validateActivityDuration(duration: number): boolean {
        return duration >= 15;
    }

    /**
     * Calculate activity streak
     */
    private calculateActivityStreak(): number {
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            
            const dayActivities = this.activityHistory.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate.toDateString() === checkDate.toDateString() &&
                       this.validateActivityDuration(activity.duration);
            });
            
            if (dayActivities.length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Add activity data (from Apple Health/Google Fit)
     */
    addActivity(activity: ActivityData): void {
        this.activityHistory.push(activity);
        
        // Update physical activity metric
        const todayActivities = this.activityHistory.filter(a => {
            const today = new Date();
            const activityDate = new Date(a.timestamp);
            return activityDate.toDateString() === today.toDateString() &&
                   this.validateActivityDuration(a.duration);
        });
        
        this.healthMetrics.physicalActivity = todayActivities.reduce(
            (total, activity) => total + activity.duration, 0
        );
    }

    /**
     * Get activity streak rewards
     */
    getActivityStreakRewards(): { streak: number; bonusPoints: number } {
        const streak = this.healthMetrics.activityStreak;
        let bonusPoints = 0;
        
        if (streak >= 7) bonusPoints = 10; // 1 week streak
        else if (streak >= 14) bonusPoints = 25; // 2 week streak
        else if (streak >= 30) bonusPoints = 50; // 1 month streak
        
        return { streak, bonusPoints };
    }

    /**
     * Initialize service with app startup
     */
    async initialize(): Promise<void> {
        console.log('🏥 Initializing Health Data Service...');
        
        // Perform initial sync
        await this.syncHealthData();
        
        // Set up auto-sync interval
        if (this.config.enableAutoSync) {
            setInterval(async () => {
                await this.autoSync();
            }, this.config.syncInterval);
        }
        
        console.log('✅ Health Data Service initialized');
    }
}

// Export singleton instance
export const healthDataService = new HealthDataService();
