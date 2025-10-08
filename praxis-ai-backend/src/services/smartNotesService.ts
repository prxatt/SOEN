// Smart Notes Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';
import { NoteInsights, Note } from '../types/ai';

export interface NoteAnalysis {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  themes: string[];
  connections: NoteConnection[];
  proposals: Proposal[];
  knowledgeGaps: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'simple' | 'moderate' | 'complex';
  category: string;
}

export interface ActionItem {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  context: string;
  relatedNotes: string[];
}

export interface NoteConnection {
  noteId1: string;
  noteId2: string;
  connectionType: 'similar' | 'contrasting' | 'supporting' | 'expanding';
  strength: number; // 0-1
  description: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  rationale: string;
  implementation: string[];
  resources: string[];
  timeline: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NoteProcessingConfig {
  includeProposals: boolean;
  includeConnections: boolean;
  includeKnowledgeGaps: boolean;
  maxActionItems: number;
  detailLevel: 'brief' | 'moderate' | 'detailed';
}

export class SmartNotesService {
  constructor(private grokService: EnhancedGrokService) {}

  async analyzeNotes(
    notes: Note[],
    config: NoteProcessingConfig = {
      includeProposals: true,
      includeConnections: true,
      includeKnowledgeGaps: true,
      maxActionItems: 10,
      detailLevel: 'moderate'
    }
  ): Promise<NoteInsights> {
    // Analyze individual notes
    const noteAnalyses = await Promise.all(
      notes.map(note => this.analyzeSingleNote(note, config))
    );

    // Generate cross-note insights
    const crossNoteInsights = await this.generateCrossNoteInsights(notes, noteAnalyses, config);

    // Extract themes across all notes
    const themes = this.extractThemes(noteAnalyses);

    // Generate proposals based on note content
    const proposals = config.includeProposals 
      ? await this.generateProposals(notes, noteAnalyses)
      : [];

    // Identify knowledge gaps
    const knowledgeGaps = config.includeKnowledgeGaps
      ? await this.identifyKnowledgeGaps(notes, noteAnalyses)
      : [];

    return {
      themes,
      actionItems: this.consolidateActionItems(noteAnalyses),
      proposals,
      connections: crossNoteInsights.connections,
      knowledgeGaps,
      overallSentiment: this.calculateOverallSentiment(noteAnalyses),
      complexityScore: this.calculateComplexityScore(noteAnalyses),
      insights: crossNoteInsights.insights,
    };
  }

  async processNote(
    note: Note,
    processingType: 'summarize' | 'expand' | 'analyze' | 'propose' | 'all' = 'all'
  ): Promise<NoteAnalysis> {
    const config: NoteProcessingConfig = {
      includeProposals: processingType === 'propose' || processingType === 'all',
      includeConnections: processingType === 'analyze' || processingType === 'all',
      includeKnowledgeGaps: processingType === 'analyze' || processingType === 'all',
      maxActionItems: 10,
      detailLevel: 'detailed'
    };

    return this.analyzeSingleNote(note, config);
  }

  async expandNote(note: Note, expansionType: 'ideas' | 'examples' | 'details' | 'connections'): Promise<string> {
    const expansionPrompt = this.buildExpansionPrompt(note, expansionType);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's note expansion expert. Expand notes by adding:
- Ideas: Generate related ideas and concepts
- Examples: Provide concrete examples and case studies
- Details: Add depth and specificity
- Connections: Link to other concepts and knowledge areas

Be creative but grounded in the original content.`
      },
      {
        role: 'user',
        content: expansionPrompt
      }
    ]);

    return response.content;
  }

  async generateProposalFromNote(note: Note): Promise<Proposal> {
    const proposalPrompt = this.buildProposalPrompt(note);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's proposal generator. Create actionable proposals based on note content that include:
- Clear title and description
- Rationale for the proposal
- Step-by-step implementation plan
- Required resources
- Realistic timeline
- Priority assessment

Format as JSON with: id, title, description, rationale, implementation[], resources[], timeline, priority`
      },
      {
        role: 'user',
        content: proposalPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async findRelatedNotes(note: Note, allNotes: Note[]): Promise<NoteConnection[]> {
    const relatedNotes = allNotes.filter(n => n.id !== note.id);
    
    const connections: NoteConnection[] = [];
    
    for (const relatedNote of relatedNotes) {
      const connection = await this.analyzeNoteConnection(note, relatedNote);
      if (connection.strength > 0.3) { // Threshold for meaningful connection
        connections.push(connection);
      }
    }
    
    return connections.sort((a, b) => b.strength - a.strength).slice(0, 5);
  }

  private async analyzeSingleNote(note: Note, config: NoteProcessingConfig): Promise<NoteAnalysis> {
    const analysisPrompt = this.buildAnalysisPrompt(note, config);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's note analysis expert. Analyze notes to extract:
- Concise summary
- Key points and insights
- Actionable items with priorities
- Main themes and topics
- Sentiment and complexity
- Category classification

Format as JSON with: summary, keyPoints[], actionItems[], themes[], sentiment, complexity, category`
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ]);

    const analysis = JSON.parse(response.content);
    
    return {
      ...analysis,
      connections: [],
      proposals: [],
      knowledgeGaps: [],
    };
  }

  private async generateCrossNoteInsights(
    notes: Note[],
    analyses: NoteAnalysis[],
    config: NoteProcessingConfig
  ): Promise<{ connections: NoteConnection[], insights: string[] }> {
    if (!config.includeConnections || notes.length < 2) {
      return { connections: [], insights: [] };
    }

    const connections: NoteConnection[] = [];
    const insights: string[] = [];

    // Find connections between notes
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const connection = await this.analyzeNoteConnection(notes[i], notes[j]);
        if (connection.strength > 0.3) {
          connections.push(connection);
        }
      }
    }

    // Generate insights from connections
    if (connections.length > 0) {
      const insightPrompt = this.buildInsightPrompt(notes, analyses, connections);
      
      const response = await this.grokService.makeGrokRequest([
        {
          role: 'system',
          content: `You are Praxis-AI's insight generator. Analyze note connections to generate actionable insights.`
        },
        {
          role: 'user',
          content: insightPrompt
        }
      ]);

      insights.push(...JSON.parse(response.content).insights);
    }

    return { connections, insights };
  }

  private async generateProposals(notes: Note[], analyses: NoteAnalysis[]): Promise<Proposal[]> {
    const proposals: Proposal[] = [];

    // Generate proposals from individual notes
    for (const note of notes) {
      if (this.isProposalWorthy(note)) {
        const proposal = await this.generateProposalFromNote(note);
        proposals.push(proposal);
      }
    }

    // Generate cross-note proposals
    const crossNoteProposals = await this.generateCrossNoteProposals(notes, analyses);
    proposals.push(...crossNoteProposals);

    return proposals.slice(0, 5); // Limit to top 5 proposals
  }

  private async identifyKnowledgeGaps(notes: Note[], analyses: NoteAnalysis[]): Promise<string[]> {
    const allTopics = analyses.flatMap(analysis => analysis.themes);
    const uniqueTopics = [...new Set(allTopics)];
    
    const gapPrompt = this.buildKnowledgeGapPrompt(notes, uniqueTopics);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's knowledge gap identifier. Analyze notes to identify missing knowledge areas and learning opportunities.`
      },
      {
        role: 'user',
        content: gapPrompt
      }
    ]);

    return JSON.parse(response.content).gaps;
  }

  private extractThemes(analyses: NoteAnalysis[]): string[] {
    const themeCounts: { [theme: string]: number } = {};
    
    analyses.forEach(analysis => {
      analysis.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    return Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([theme]) => theme)
      .slice(0, 10);
  }

  private consolidateActionItems(analyses: NoteAnalysis[]): ActionItem[] {
    const allActionItems = analyses.flatMap(analysis => analysis.actionItems);
    
    // Remove duplicates and merge similar items
    const consolidated: ActionItem[] = [];
    const seen = new Set<string>();
    
    allActionItems.forEach(item => {
      const key = item.text.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        consolidated.push(item);
      }
    });

    // Sort by priority
    return consolidated
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 20); // Limit to top 20 action items
  }

  private calculateOverallSentiment(analyses: NoteAnalysis[]): 'positive' | 'neutral' | 'negative' {
    const sentiments = analyses.map(analysis => analysis.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateComplexityScore(analyses: NoteAnalysis[]): number {
    const complexities = analyses.map(analysis => {
      const complexityOrder = { simple: 1, moderate: 2, complex: 3 };
      return complexityOrder[analysis.complexity];
    });
    
    return complexities.reduce((sum, complexity) => sum + complexity, 0) / complexities.length;
  }

  private async analyzeNoteConnection(note1: Note, note2: Note): Promise<NoteConnection> {
    const connectionPrompt = this.buildConnectionPrompt(note1, note2);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's connection analyzer. Analyze the relationship between two notes and determine:
- Connection type (similar, contrasting, supporting, expanding)
- Connection strength (0-1)
- Description of the relationship

Format as JSON with: connectionType, strength, description`
      },
      {
        role: 'user',
        content: connectionPrompt
      }
    ]);

    const connection = JSON.parse(response.content);
    
    return {
      noteId1: note1.id,
      noteId2: note2.id,
      connectionType: connection.connectionType,
      strength: connection.strength,
      description: connection.description,
    };
  }

  private async generateCrossNoteProposals(notes: Note[], analyses: NoteAnalysis[]): Promise<Proposal[]> {
    const crossNotePrompt = this.buildCrossNoteProposalPrompt(notes, analyses);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's cross-note proposal generator. Create proposals that combine insights from multiple notes.`
      },
      {
        role: 'user',
        content: crossNotePrompt
      }
    ]);

    return JSON.parse(response.content).proposals || [];
  }

  private isProposalWorthy(note: Note): boolean {
    // Determine if a note contains content suitable for proposal generation
    const proposalKeywords = ['idea', 'suggest', 'propose', 'recommend', 'should', 'could', 'opportunity'];
    const content = note.content.toLowerCase();
    
    return proposalKeywords.some(keyword => content.includes(keyword)) || 
           note.content.length > 200; // Longer notes are more likely to contain actionable content
  }

  // Prompt building methods
  private buildAnalysisPrompt(note: Note, config: NoteProcessingConfig): string {
    return `
Analyze this note:

TITLE: ${note.title}
CONTENT: ${note.content}
TAGS: ${note.tags.join(', ')}
CREATED: ${note.createdAt}

Extract key insights, action items, and themes. Focus on actionable content and practical applications.
    `.trim();
  }

  private buildExpansionPrompt(note: Note, expansionType: string): string {
    return `
Expand this note by adding ${expansionType}:

TITLE: ${note.title}
CONTENT: ${note.content}

Provide relevant ${expansionType} that enhance the original content while maintaining its core message.
    `.trim();
  }

  private buildProposalPrompt(note: Note): string {
    return `
Create an actionable proposal based on this note:

TITLE: ${note.title}
CONTENT: ${note.content}

Generate a practical proposal that can be implemented to achieve the goals or ideas mentioned in the note.
    `.trim();
  }

  private buildConnectionPrompt(note1: Note, note2: Note): string {
    return `
Analyze the connection between these two notes:

NOTE 1:
TITLE: ${note1.title}
CONTENT: ${note1.content}

NOTE 2:
TITLE: ${note2.title}
CONTENT: ${note2.content}

Determine how these notes relate to each other and the strength of their connection.
    `.trim();
  }

  private buildInsightPrompt(notes: Note[], analyses: NoteAnalysis[], connections: NoteConnection[]): string {
    return `
Generate insights from these note connections:

NOTES: ${notes.map(n => n.title).join(', ')}
CONNECTIONS: ${connections.map(c => `${c.description} (strength: ${c.strength})`).join(', ')}

Provide actionable insights that emerge from these connections.
    `.trim();
  }

  private buildKnowledgeGapPrompt(notes: Note[], topics: string[]): string {
    return `
Identify knowledge gaps based on these notes:

NOTES: ${notes.map(n => n.title).join(', ')}
TOPICS COVERED: ${topics.join(', ')}

Suggest knowledge areas that would complement or expand on the existing content.
    `.trim();
  }

  private buildCrossNoteProposalPrompt(notes: Note[], analyses: NoteAnalysis[]): string {
    return `
Create proposals that combine insights from these notes:

NOTES: ${notes.map(n => n.title).join(', ')}
THEMES: ${analyses.flatMap(a => a.themes).join(', ')}

Generate proposals that leverage multiple notes to create new opportunities or solutions.
    `.trim();
  }
}
