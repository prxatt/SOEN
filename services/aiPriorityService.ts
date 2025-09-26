/**
 * AI Priority System Service
 * 
 * Intelligent task prioritization system inspired by:
 * - Todoist's Smart Schedule AI
 * - Notion's AI-powered task management
 * - Microsoft Viva's productivity insights
 * - RescueTime's automatic categorization
 * 
 * Features:
 * - Kiko AI task importance scoring
 * - Context-aware priority calculation
 * - Learning pattern recognition
 * - Productivity impact analysis
 */

import { Task, Category } from '../types';

export interface TaskPriority {
    taskId: number;
    importanceScore: number; // 0-100
    urgencyScore: number; // 0-100
    complexityScore: number; // 0-100
    learningValue: number; // 0-100
    overallPriority: number; // 0-100
    priorityLevel: 'low' | 'medium' | 'high' | 'critical';
    reasoning: string;
}

export interface LearningPattern {
    category: Category;
    averageCompletionTime: number;
    successRate: number;
    learningCurve: number; // How much user improves over time
    difficultyLevel: number; // 1-5
}

export interface ProductivityInsights {
    peakHours: number[];
    mostProductiveCategories: Category[];
    learningStrengths: Category[];
    improvementAreas: Category[];
    recommendedFocusTime: number; // minutes
}

class AIPriorityService {
    private learningPatterns: Map<Category, LearningPattern> = new Map();
    private taskHistory: Task[] = [];
    private productivityInsights: ProductivityInsights = {
        peakHours: [9, 10, 11, 14, 15], // Default peak hours
        mostProductiveCategories: ['Deep Work', 'Learning'],
        learningStrengths: ['Learning', 'Prototyping'],
        improvementAreas: ['Admin', 'Meeting'],
        recommendedFocusTime: 25
    };

    /**
     * Calculate AI-powered task priority
     */
    calculateTaskPriority(task: Task): TaskPriority {
        const importanceScore = this.calculateImportanceScore(task);
        const urgencyScore = this.calculateUrgencyScore(task);
        const complexityScore = this.calculateComplexityScore(task);
        const learningValue = this.calculateLearningValue(task);
        
        // Weighted overall priority calculation
        const overallPriority = Math.round(
            (importanceScore * 0.3) +
            (urgencyScore * 0.25) +
            (complexityScore * 0.2) +
            (learningValue * 0.25)
        );
        
        const priorityLevel = this.getPriorityLevel(overallPriority);
        const reasoning = this.generateReasoning(task, {
            importanceScore,
            urgencyScore,
            complexityScore,
            learningValue,
            overallPriority
        });
        
        return {
            taskId: task.id,
            importanceScore,
            urgencyScore,
            complexityScore,
            learningValue,
            overallPriority,
            priorityLevel,
            reasoning
        };
    }

    /**
     * Calculate importance score based on task characteristics
     */
    private calculateImportanceScore(task: Task): number {
        let score = 50; // Base score
        
        // Category importance weights
        const categoryWeights: Record<Category, number> = {
            'Deep Work': 90,
            'Learning': 85,
            'Prototyping': 80,
            'Meeting': 60,
            'Workout': 70,
            'Editing': 65,
            'Personal': 55,
            'Admin': 40
        };
        
        score = categoryWeights[task.category] || 50;
        
        // Title keywords that indicate importance
        const importantKeywords = [
            'urgent', 'critical', 'deadline', 'important', 'priority',
            'review', 'final', 'presentation', 'meeting', 'client'
        ];
        
        const titleLower = task.title.toLowerCase();
        const keywordMatches = importantKeywords.filter(keyword => 
            titleLower.includes(keyword)
        ).length;
        
        score += keywordMatches * 10;
        
        // Duration impact (longer tasks often more important)
        if (task.plannedDuration > 60) score += 10;
        if (task.plannedDuration > 120) score += 5;
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate urgency score based on deadlines and context
     */
    private calculateUrgencyScore(task: Task): number {
        let score = 30; // Base urgency
        
        const now = new Date();
        const taskDate = new Date(task.startTime);
        const daysUntilTask = Math.ceil((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Urgency based on time until task
        if (daysUntilTask < 0) score = 100; // Overdue
        else if (daysUntilTask === 0) score = 90; // Today
        else if (daysUntilTask === 1) score = 80; // Tomorrow
        else if (daysUntilTask <= 3) score = 70; // This week
        else if (daysUntilTask <= 7) score = 50; // Next week
        else score = 30; // Future
        
        // Status impact
        if (task.status === 'In Progress') score += 20;
        if (task.status === 'Completed') score = 0;
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate complexity score based on task characteristics
     */
    private calculateComplexityScore(task: Task): number {
        let score = 50; // Base complexity
        
        // Duration-based complexity
        if (task.plannedDuration <= 15) score = 20; // Simple task
        else if (task.plannedDuration <= 30) score = 40; // Moderate
        else if (task.plannedDuration <= 60) score = 60; // Complex
        else if (task.plannedDuration <= 120) score = 80; // Very complex
        else score = 90; // Extremely complex
        
        // Category complexity weights
        const complexityWeights: Record<Category, number> = {
            'Deep Work': 85,
            'Prototyping': 80,
            'Learning': 75,
            'Editing': 60,
            'Meeting': 50,
            'Workout': 30,
            'Personal': 40,
            'Admin': 35
        };
        
        const categoryComplexity = complexityWeights[task.category] || 50;
        score = Math.round((score + categoryComplexity) / 2);
        
        // Title complexity indicators
        const complexKeywords = [
            'analyze', 'research', 'develop', 'create', 'build',
            'implement', 'design', 'optimize', 'integrate', 'refactor'
        ];
        
        const titleLower = task.title.toLowerCase();
        const complexMatches = complexKeywords.filter(keyword => 
            titleLower.includes(keyword)
        ).length;
        
        score += complexMatches * 5;
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate learning value based on user's learning patterns
     */
    private calculateLearningValue(task: Task): number {
        let score = 50; // Base learning value
        
        // Category learning weights
        const learningWeights: Record<Category, number> = {
            'Learning': 95,
            'Prototyping': 85,
            'Deep Work': 80,
            'Editing': 60,
            'Meeting': 40,
            'Workout': 30,
            'Personal': 50,
            'Admin': 20
        };
        
        score = learningWeights[task.category] || 50;
        
        // Learning keywords
        const learningKeywords = [
            'learn', 'study', 'practice', 'tutorial', 'course',
            'research', 'explore', 'experiment', 'understand', 'master'
        ];
        
        const titleLower = task.title.toLowerCase();
        const learningMatches = learningKeywords.filter(keyword => 
            titleLower.includes(keyword)
        ).length;
        
        score += learningMatches * 10;
        
        // Adjust based on user's learning patterns
        const pattern = this.learningPatterns.get(task.category);
        if (pattern) {
            score = Math.round(score * (pattern.learningCurve / 100));
        }
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Get priority level from overall score
     */
    private getPriorityLevel(overallPriority: number): 'low' | 'medium' | 'high' | 'critical' {
        if (overallPriority >= 85) return 'critical';
        if (overallPriority >= 70) return 'high';
        if (overallPriority >= 50) return 'medium';
        return 'low';
    }

    /**
     * Generate human-readable reasoning for priority
     */
    private generateReasoning(task: Task, scores: any): string {
        const reasons: string[] = [];
        
        if (scores.importanceScore >= 80) {
            reasons.push('High importance task');
        }
        
        if (scores.urgencyScore >= 80) {
            reasons.push('Urgent deadline');
        }
        
        if (scores.complexityScore >= 80) {
            reasons.push('Complex work requiring focus');
        }
        
        if (scores.learningValue >= 80) {
            reasons.push('High learning value');
        }
        
        // Category-specific reasoning
        switch (task.category) {
            case 'Deep Work':
                reasons.push('Deep work session');
                break;
            case 'Learning':
                reasons.push('Learning opportunity');
                break;
            case 'Prototyping':
                reasons.push('Creative development');
                break;
        }
        
        return reasons.length > 0 ? reasons.join(', ') : 'Standard priority task';
    }

    /**
     * Calculate points multiplier based on task priority
     */
    getPointsMultiplier(priority: TaskPriority): number {
        switch (priority.priorityLevel) {
            case 'critical': return 2.0; // Double points for critical tasks
            case 'high': return 1.5;     // 50% bonus for high priority
            case 'medium': return 1.0;   // Standard points
            case 'low': return 0.8;      // Reduced points for low priority
            default: return 1.0;
        }
    }

    /**
     * Update learning patterns based on completed tasks
     */
    updateLearningPatterns(completedTask: Task): void {
        const category = completedTask.category;
        const existingPattern = this.learningPatterns.get(category) || {
            category,
            averageCompletionTime: 0,
            successRate: 0,
            learningCurve: 50,
            difficultyLevel: 3
        };
        
        // Update average completion time
        const categoryTasks = this.taskHistory.filter(t => 
            t.category === category && t.status === 'Completed'
        );
        
        if (categoryTasks.length > 0) {
            existingPattern.averageCompletionTime = Math.round(
                categoryTasks.reduce((sum, t) => sum + t.plannedDuration, 0) / categoryTasks.length
            );
        }
        
        // Update success rate
        const totalCategoryTasks = this.taskHistory.filter(t => t.category === category);
        existingPattern.successRate = totalCategoryTasks.length > 0 
            ? (categoryTasks.length / totalCategoryTasks.length) * 100 
            : 0;
        
        this.learningPatterns.set(category, existingPattern);
    }

    /**
     * Get productivity insights for user
     */
    getProductivityInsights(): ProductivityInsights {
        return { ...this.productivityInsights };
    }

    /**
     * Add task to history for pattern analysis
     */
    addTaskToHistory(task: Task): void {
        this.taskHistory.push(task);
        
        // Keep only last 100 tasks for performance
        if (this.taskHistory.length > 100) {
            this.taskHistory = this.taskHistory.slice(-100);
        }
    }
}

// Export singleton instance
export const aiPriorityService = new AIPriorityService();
