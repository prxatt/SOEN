// Insights Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';

export interface LearningMaterial {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'book' | 'video' | 'course' | 'note' | 'podcast';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  completed: boolean;
  rating?: number; // 1-5
}

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  rationale: string;
  learningGoals: string[];
  requiredSkills: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources: string[];
  nextSteps: string[];
  priority: 'low' | 'medium' | 'high';
  feasibility: number; // 0-1
  impact: number; // 0-1
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'gap' | 'opportunity' | 'connection';
  title: string;
  description: string;
  relatedMaterials: string[];
  actionableItems: string[];
  confidence: number; // 0-1
}

export interface SkillAnalysis {
  skill: string;
  currentLevel: number; // 0-5
  targetLevel: number; // 0-5
  gap: number;
  learningPath: string[];
  resources: string[];
  estimatedTime: string;
}

export interface InsightsConfig {
  includeProjectIdeas: boolean;
  includeSkillAnalysis: boolean;
  includeLearningInsights: boolean;
  maxProjectIdeas: number;
  focusAreas: string[];
}

export class InsightsService {
  constructor(private grokService: EnhancedGrokService) {}

  async generateActionableInsights(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    userSkills: any[],
    config: InsightsConfig = {
      includeProjectIdeas: true,
      includeSkillAnalysis: true,
      includeLearningInsights: true,
      maxProjectIdeas: 5,
      focusAreas: []
    }
  ): Promise<{
    projectIdeas: ProjectIdea[];
    skillAnalysis: SkillAnalysis[];
    learningInsights: LearningInsight[];
    recommendations: string[];
  }> {
    const insights: any = {
      projectIdeas: [],
      skillAnalysis: [],
      learningInsights: [],
      recommendations: []
    };

    // Generate project ideas from learning materials
    if (config.includeProjectIdeas) {
      insights.projectIdeas = await this.generateProjectIdeas(
        learningMaterials,
        userGoals,
        config.maxProjectIdeas
      );
    }

    // Analyze skills and learning gaps
    if (config.includeSkillAnalysis) {
      insights.skillAnalysis = await this.analyzeSkills(
        learningMaterials,
        userSkills,
        userGoals
      );
    }

    // Generate learning insights
    if (config.includeLearningInsights) {
      insights.learningInsights = await this.generateLearningInsights(
        learningMaterials,
        userGoals
      );
    }

    // Generate overall recommendations
    insights.recommendations = await this.generateRecommendations(
      learningMaterials,
      userGoals,
      insights
    );

    return insights;
  }

  async generateProjectIdeas(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    maxIdeas: number = 5
  ): Promise<ProjectIdea[]> {
    const projectPrompt = this.buildProjectIdeasPrompt(learningMaterials, userGoals);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's project idea generator. Create actionable project ideas based on learning materials and user goals that:
- Apply learned concepts practically
- Align with user goals and interests
- Provide hands-on experience
- Build relevant skills
- Have clear learning outcomes

Format as JSON with: projectIdeas[]`
      },
      {
        role: 'user',
        content: projectPrompt
      }
    ]);

    const projectIdeas = JSON.parse(response.content).projectIdeas;
    
    return projectIdeas.slice(0, maxIdeas).map((idea: any) => ({
      id: `project_${Date.now()}_${Math.random()}`,
      title: idea.title,
      description: idea.description,
      rationale: idea.rationale,
      learningGoals: idea.learningGoals,
      requiredSkills: idea.requiredSkills,
      estimatedDuration: idea.estimatedDuration,
      difficulty: idea.difficulty,
      resources: idea.resources,
      nextSteps: idea.nextSteps,
      priority: idea.priority,
      feasibility: idea.feasibility,
      impact: idea.impact,
    }));
  }

  async analyzeSkills(
    learningMaterials: LearningMaterial[],
    userSkills: any[],
    userGoals: any[]
  ): Promise<SkillAnalysis[]> {
    const skillPrompt = this.buildSkillAnalysisPrompt(learningMaterials, userSkills, userGoals);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's skill analyst. Analyze learning materials and user skills to:
- Identify skill gaps
- Suggest learning paths
- Recommend resources
- Estimate time requirements

Format as JSON with: skillAnalysis[]`
      },
      {
        role: 'user',
        content: skillPrompt
      }
    ]);

    const skillAnalysis = JSON.parse(response.content).skillAnalysis;
    
    return skillAnalysis.map((analysis: any) => ({
      skill: analysis.skill,
      currentLevel: analysis.currentLevel,
      targetLevel: analysis.targetLevel,
      gap: analysis.targetLevel - analysis.currentLevel,
      learningPath: analysis.learningPath,
      resources: analysis.resources,
      estimatedTime: analysis.estimatedTime,
    }));
  }

  async generateLearningInsights(
    learningMaterials: LearningMaterial[],
    userGoals: any[]
  ): Promise<LearningInsight[]> {
    const insightPrompt = this.buildLearningInsightsPrompt(learningMaterials, userGoals);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's learning insight generator. Analyze learning materials to identify:
- Patterns and connections
- Knowledge gaps
- Learning opportunities
- Actionable insights

Format as JSON with: learningInsights[]`
      },
      {
        role: 'user',
        content: insightPrompt
      }
    ]);

    const learningInsights = JSON.parse(response.content).learningInsights;
    
    return learningInsights.map((insight: any) => ({
      id: `insight_${Date.now()}_${Math.random()}`,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      relatedMaterials: insight.relatedMaterials,
      actionableItems: insight.actionableItems,
      confidence: insight.confidence,
    }));
  }

  async generateRecommendations(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    insights: any
  ): Promise<string[]> {
    const recommendationPrompt = this.buildRecommendationsPrompt(learningMaterials, userGoals, insights);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's recommendation engine. Generate personalized recommendations based on learning materials, goals, and insights.`
      },
      {
        role: 'user',
        content: recommendationPrompt
      }
    ]);

    return JSON.parse(response.content).recommendations;
  }

  async suggestNextLearningSteps(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    completedMaterials: LearningMaterial[]
  ): Promise<string[]> {
    const nextStepsPrompt = this.buildNextStepsPrompt(learningMaterials, userGoals, completedMaterials);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's learning path optimizer. Suggest the next best learning steps based on completed materials and goals.`
      },
      {
        role: 'user',
        content: nextStepsPrompt
      }
    ]);

    return JSON.parse(response.content).nextSteps;
  }

  async identifyLearningPatterns(
    learningMaterials: LearningMaterial[]
  ): Promise<{
    preferredTypes: string[];
    difficultyProgression: string[];
    topicClusters: string[];
    learningVelocity: number;
    recommendations: string[];
  }> {
    const patternPrompt = this.buildPatternAnalysisPrompt(learningMaterials);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's learning pattern analyzer. Analyze learning materials to identify patterns and preferences.`
      },
      {
        role: 'user',
        content: patternPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async generateLearningRoadmap(
    userGoals: any[],
    currentSkills: any[],
    availableMaterials: LearningMaterial[]
  ): Promise<{
    phases: any[];
    milestones: any[];
    estimatedTimeline: string;
    resources: string[];
  }> {
    const roadmapPrompt = this.buildRoadmapPrompt(userGoals, currentSkills, availableMaterials);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's learning roadmap generator. Create a comprehensive learning roadmap based on goals, skills, and available materials.`
      },
      {
        role: 'user',
        content: roadmapPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  // Prompt building methods
  private buildProjectIdeasPrompt(learningMaterials: LearningMaterial[], userGoals: any[]): string {
    return `
Generate project ideas based on these learning materials and user goals:

LEARNING MATERIALS:
${learningMaterials.map(material => `
- ${material.title} (${material.type}, ${material.difficulty})
  Tags: ${material.tags.join(', ')}
  Content: ${material.content.substring(0, 200)}...
`).join('\n')}

USER GOALS:
${userGoals.map(goal => `- ${goal.text} (${goal.term} term)`).join('\n')}

Create practical project ideas that apply the learned concepts and align with user goals.
    `.trim();
  }

  private buildSkillAnalysisPrompt(
    learningMaterials: LearningMaterial[],
    userSkills: any[],
    userGoals: any[]
  ): string {
    return `
Analyze skills based on learning materials and user profile:

LEARNING MATERIALS:
${learningMaterials.map(material => `
- ${material.title} (${material.type}, ${material.difficulty})
  Tags: ${material.tags.join(', ')}
`).join('\n')}

USER SKILLS:
${userSkills.map(skill => `- ${skill.name}: ${skill.level}/5`).join('\n')}

USER GOALS:
${userGoals.map(goal => `- ${goal.text}`).join('\n')}

Identify skill gaps and suggest learning paths.
    `.trim();
  }

  private buildLearningInsightsPrompt(learningMaterials: LearningMaterial[], userGoals: any[]): string {
    return `
Generate learning insights from these materials:

MATERIALS:
${learningMaterials.map(material => `
- ${material.title} (${material.type})
  Content: ${material.content.substring(0, 300)}...
  Tags: ${material.tags.join(', ')}
`).join('\n')}

GOALS:
${userGoals.map(goal => `- ${goal.text}`).join('\n')}

Identify patterns, gaps, and opportunities for learning.
    `.trim();
  }

  private buildRecommendationsPrompt(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    insights: any
  ): string {
    return `
Generate personalized recommendations based on:

MATERIALS: ${learningMaterials.map(m => m.title).join(', ')}
GOALS: ${userGoals.map(g => g.text).join(', ')}
PROJECT IDEAS: ${insights.projectIdeas?.map((p: any) => p.title).join(', ') || 'None'}
SKILL GAPS: ${insights.skillAnalysis?.map((s: any) => s.skill).join(', ') || 'None'}

Provide actionable recommendations for continued learning and growth.
    `.trim();
  }

  private buildNextStepsPrompt(
    learningMaterials: LearningMaterial[],
    userGoals: any[],
    completedMaterials: LearningMaterial[]
  ): string {
    return `
Suggest next learning steps based on:

COMPLETED MATERIALS:
${completedMaterials.map(material => `- ${material.title} (${material.type})`).join('\n')}

AVAILABLE MATERIALS:
${learningMaterials.map(material => `- ${material.title} (${material.type}, ${material.difficulty})`).join('\n')}

GOALS:
${userGoals.map(goal => `- ${goal.text}`).join('\n')}

Recommend the next best learning steps.
    `.trim();
  }

  private buildPatternAnalysisPrompt(learningMaterials: LearningMaterial[]): string {
    return `
Analyze learning patterns from these materials:

MATERIALS:
${learningMaterials.map(material => `
- ${material.title}
  Type: ${material.type}
  Difficulty: ${material.difficulty}
  Duration: ${material.duration || 'Unknown'}
  Rating: ${material.rating || 'Not rated'}
  Tags: ${material.tags.join(', ')}
`).join('\n')}

Identify patterns in learning preferences, difficulty progression, and topic clusters.
    `.trim();
  }

  private buildRoadmapPrompt(
    userGoals: any[],
    currentSkills: any[],
    availableMaterials: LearningMaterial[]
  ): string {
    return `
Create a learning roadmap based on:

GOALS:
${userGoals.map(goal => `- ${goal.text} (${goal.term} term)`).join('\n')}

CURRENT SKILLS:
${currentSkills.map(skill => `- ${skill.name}: ${skill.level}/5`).join('\n')}

AVAILABLE MATERIALS:
${availableMaterials.map(material => `- ${material.title} (${material.type}, ${material.difficulty})`).join('\n')}

Create a comprehensive learning roadmap with phases, milestones, and timeline.
    `.trim();
  }
}
