// Mind Mapping Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';
import { MindMapData, Goal, Task, Note } from '../types/ai';

export interface MindMapNode {
  id: string;
  type: 'goal' | 'task' | 'note' | 'theme' | 'opportunity' | 'connection';
  label: string;
  data: any;
  position: { x: number; y: number };
  size: number;
  color: string;
  priority: 'low' | 'medium' | 'high';
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency' | 'similarity' | 'support' | 'conflict' | 'expansion';
  strength: number;
  label?: string;
}

export interface MindMapTheme {
  id: string;
  name: string;
  nodes: string[];
  color: string;
  description: string;
}

export interface MindMapOpportunity {
  id: string;
  title: string;
  description: string;
  relatedNodes: string[];
  priority: 'low' | 'medium' | 'high';
  feasibility: number; // 0-1
  impact: number; // 0-1
}

export interface MindMapConfig {
  includeThemes: boolean;
  includeOpportunities: boolean;
  maxNodes: number;
  layout: 'hierarchical' | 'radial' | 'force-directed' | 'circular';
  focusArea?: string;
}

export class MindMappingService {
  constructor(private grokService: EnhancedGrokService) {}

  async generateMindMap(
    goals: Goal[],
    tasks: Task[],
    notes: Note[],
    config: MindMapConfig = {
      includeThemes: true,
      includeOpportunities: true,
      maxNodes: 50,
      layout: 'force-directed'
    }
  ): Promise<MindMapData> {
    // Generate AI-powered mind map structure
    const aiMindMap = await this.generateAIMindMap(goals, tasks, notes, config);
    
    // Create visual layout
    const layout = this.createLayout(aiMindMap.nodes, config.layout);
    
    // Generate themes
    const themes = config.includeThemes 
      ? await this.generateThemes(aiMindMap.nodes, goals, tasks, notes)
      : [];
    
    // Identify opportunities
    const opportunities = config.includeOpportunities
      ? await this.identifyOpportunities(aiMindMap.nodes, aiMindMap.edges)
      : [];

    return {
      nodes: layout.nodes,
      edges: layout.edges,
      themes,
      opportunities,
      metadata: {
        generatedAt: new Date().toISOString(),
        config,
        stats: {
          totalNodes: layout.nodes.length,
          totalEdges: layout.edges.length,
          themesCount: themes.length,
          opportunitiesCount: opportunities.length,
        }
      }
    };
  }

  async updateMindMap(
    existingMindMap: MindMapData,
    newGoals: Goal[],
    newTasks: Task[],
    newNotes: Note[]
  ): Promise<MindMapData> {
    // Analyze changes
    const changes = this.analyzeChanges(existingMindMap, newGoals, newTasks, newNotes);
    
    // Generate incremental updates
    const updates = await this.generateIncrementalUpdates(changes, existingMindMap);
    
    // Apply updates
    const updatedMindMap = this.applyUpdates(existingMindMap, updates);
    
    return updatedMindMap;
  }

  async generateFocusedMindMap(
    focusArea: string,
    goals: Goal[],
    tasks: Task[],
    notes: Note[]
  ): Promise<MindMapData> {
    const config: MindMapConfig = {
      includeThemes: true,
      includeOpportunities: true,
      maxNodes: 30,
      layout: 'hierarchical',
      focusArea
    };

    // Filter data by focus area
    const filteredData = this.filterByFocusArea(focusArea, goals, tasks, notes);
    
    return this.generateMindMap(
      filteredData.goals,
      filteredData.tasks,
      filteredData.notes,
      config
    );
  }

  async generateDynamicConnections(
    mindMap: MindMapData,
    userContext: any
  ): Promise<MindMapEdge[]> {
    const connectionPrompt = this.buildConnectionPrompt(mindMap, userContext);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's connection generator. Analyze mind map nodes to identify new connections and relationships that might not be immediately obvious.`
      },
      {
        role: 'user',
        content: connectionPrompt
      }
    ]);

    const newConnections = JSON.parse(response.content).connections;
    
    return newConnections.map((conn: any) => ({
      id: `conn_${Date.now()}_${Math.random()}`,
      source: conn.source,
      target: conn.target,
      type: conn.type,
      strength: conn.strength,
      label: conn.label,
    }));
  }

  private async generateAIMindMap(
    goals: Goal[],
    tasks: Task[],
    notes: Note[],
    config: MindMapConfig
  ): Promise<{ nodes: MindMapNode[], edges: MindMapEdge[] }> {
    const mindMapPrompt = this.buildMindMapPrompt(goals, tasks, notes, config);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's mind mapping expert. Create a comprehensive mind map that:
- Connects goals, tasks, and notes logically
- Identifies relationships and dependencies
- Highlights patterns and themes
- Suggests new connections and opportunities
- Organizes information hierarchically

Format as JSON with: nodes[], edges[]`
      },
      {
        role: 'user',
        content: mindMapPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  private createLayout(
    nodes: MindMapNode[],
    layoutType: string
  ): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    switch (layoutType) {
      case 'hierarchical':
        return this.createHierarchicalLayout(nodes);
      case 'radial':
        return this.createRadialLayout(nodes);
      case 'circular':
        return this.createCircularLayout(nodes);
      default:
        return this.createForceDirectedLayout(nodes);
    }
  }

  private createHierarchicalLayout(nodes: MindMapNode[]): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    const goalNodes = nodes.filter(n => n.type === 'goal');
    const taskNodes = nodes.filter(n => n.type === 'task');
    const noteNodes = nodes.filter(n => n.type === 'note');
    
    const layoutNodes: MindMapNode[] = [];
    let yOffset = 0;
    
    // Place goals at the top
    goalNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        position: {
          x: index * 200 - (goalNodes.length - 1) * 100,
          y: yOffset
        }
      });
    });
    
    yOffset += 150;
    
    // Place tasks in the middle
    taskNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        position: {
          x: index * 150 - (taskNodes.length - 1) * 75,
          y: yOffset
        }
      });
    });
    
    yOffset += 150;
    
    // Place notes at the bottom
    noteNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        position: {
          x: index * 100 - (noteNodes.length - 1) * 50,
          y: yOffset
        }
      });
    });
    
    return { nodes: layoutNodes, edges: [] };
  }

  private createRadialLayout(nodes: MindMapNode[]): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    const layoutNodes = nodes.map((node: any, index: number) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      };
    });
    
    return { nodes: layoutNodes, edges: [] };
  }

  private createCircularLayout(nodes: MindMapNode[]): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    const centerX = 400;
    const centerY = 300;
    const radius = 150;
    
    const layoutNodes = nodes.map((node: any, index: number) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      };
    });
    
    return { nodes: layoutNodes, edges: [] };
  }

  private createForceDirectedLayout(nodes: MindMapNode[]): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    // Simple force-directed layout simulation
    const layoutNodes = nodes.map(node => ({
      ...node,
      position: {
        x: Math.random() * 800,
        y: Math.random() * 600
      }
    }));
    
    // Apply force simulation (simplified)
    for (let i = 0; i < 50; i++) {
      layoutNodes.forEach((node: any) => {
        // Repulsion from other nodes
        layoutNodes.forEach((otherNode: any) => {
          if (node.id !== otherNode.id) {
            const dx = node.position.x - otherNode.position.x;
            const dy = node.position.y - otherNode.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && distance < 100) {
              const force = (100 - distance) / 100;
              node.position.x += (dx / distance) * force * 0.1;
              node.position.y += (dy / distance) * force * 0.1;
            }
          }
        });
      });
    }
    
    return { nodes: layoutNodes, edges: [] };
  }

  private async generateThemes(
    nodes: MindMapNode[],
    goals: Goal[],
    tasks: Task[],
    notes: Note[]
  ): Promise<MindMapTheme[]> {
    const themePrompt = this.buildThemePrompt(nodes, goals, tasks, notes);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's theme generator. Analyze mind map nodes to identify overarching themes and patterns.`
      },
      {
        role: 'user',
        content: themePrompt
      }
    ]);

    const themes = JSON.parse(response.content).themes;
    
    return themes.map((theme: any) => ({
      id: `theme_${Date.now()}_${Math.random()}`,
      name: theme.name,
      nodes: theme.nodes,
      color: theme.color,
      description: theme.description,
    }));
  }

  private async identifyOpportunities(
    nodes: MindMapNode[],
    edges: MindMapEdge[]
  ): Promise<MindMapOpportunity[]> {
    const opportunityPrompt = this.buildOpportunityPrompt(nodes, edges);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's opportunity identifier. Analyze mind map structure to identify new opportunities and possibilities.`
      },
      {
        role: 'user',
        content: opportunityPrompt
      }
    ]);

    const opportunities = JSON.parse(response.content).opportunities;
    
    return opportunities.map((opp: any) => ({
      id: `opp_${Date.now()}_${Math.random()}`,
      title: opp.title,
      description: opp.description,
      relatedNodes: opp.relatedNodes,
      priority: opp.priority,
      feasibility: opp.feasibility,
      impact: opp.impact,
    }));
  }

  private analyzeChanges(
    existingMindMap: MindMapData,
    newGoals: Goal[],
    newTasks: Task[],
    newNotes: Note[]
  ): any {
    // Compare existing data with new data to identify changes
    return {
      newGoals: newGoals.filter(goal => !existingMindMap.nodes.some(node => node.data?.id === goal.id)),
      newTasks: newTasks.filter(task => !existingMindMap.nodes.some(node => node.data?.id === task.id)),
      newNotes: newNotes.filter(note => !existingMindMap.nodes.some(node => node.data?.id === note.id)),
      removedItems: [], // Would track removed items
      updatedItems: [], // Would track updated items
    };
  }

  private async generateIncrementalUpdates(_changes: any, _existingMindMap: MindMapData): Promise<any> {
    // Generate updates based on changes
    return {
      newNodes: [],
      newEdges: [],
      updatedNodes: [],
      removedNodes: [],
    };
  }

  private applyUpdates(existingMindMap: MindMapData, updates: any): MindMapData {
    // Apply updates to existing mind map
    return {
      ...existingMindMap,
      nodes: [...existingMindMap.nodes, ...updates.newNodes],
      edges: [...existingMindMap.edges, ...updates.newEdges],
    };
  }

  private filterByFocusArea(focusArea: string, goals: Goal[], tasks: Task[], notes: Note[]): any {
    const filteredGoals = goals.filter(goal => 
      goal.text.toLowerCase().includes(focusArea.toLowerCase())
    );
    
    const filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(focusArea.toLowerCase()) ||
      task.description?.toLowerCase().includes(focusArea.toLowerCase())
    );
    
    const filteredNotes = notes.filter(note => 
      note.title.toLowerCase().includes(focusArea.toLowerCase()) ||
      note.content.toLowerCase().includes(focusArea.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(focusArea.toLowerCase()))
    );
    
    return {
      goals: filteredGoals,
      tasks: filteredTasks,
      notes: filteredNotes,
    };
  }

  // Prompt building methods
  private buildMindMapPrompt(goals: Goal[], tasks: Task[], notes: Note[], config: MindMapConfig): string {
    return `
Create a mind map connecting these elements:

GOALS:
${goals.map(goal => `- ${goal.text} (${goal.term} term, ${goal.status})`).join('\n')}

TASKS:
${tasks.map(task => `- ${task.title} (${task.status}, ${task.priority})`).join('\n')}

NOTES:
${notes.map(note => `- ${note.title} (${note.tags.join(', ')})`).join('\n')}

CONFIG:
- Focus area: ${config.focusArea || 'all'}
- Max nodes: ${config.maxNodes}
- Include themes: ${config.includeThemes}
- Include opportunities: ${config.includeOpportunities}

Generate a comprehensive mind map with logical connections and relationships.
    `.trim();
  }

  private buildThemePrompt(nodes: MindMapNode[], goals: Goal[], tasks: Task[], notes: Note[]): string {
    return `
Identify themes from this mind map:

NODES: ${nodes.map(n => n.label).join(', ')}
GOALS: ${goals.map(g => g.text).join(', ')}
TASKS: ${tasks.map(t => t.title).join(', ')}
NOTES: ${notes.map(n => n.title).join(', ')}

Extract overarching themes and patterns that connect these elements.
    `.trim();
  }

  private buildOpportunityPrompt(nodes: MindMapNode[], edges: MindMapEdge[]): string {
    return `
Identify opportunities from this mind map:

NODES: ${nodes.map(n => n.label).join(', ')}
EDGES: ${edges.map(e => `${e.source} -> ${e.target} (${e.type})`).join(', ')}

Suggest new opportunities and possibilities that emerge from these connections.
    `.trim();
  }

  private buildConnectionPrompt(mindMap: MindMapData, userContext: any): string {
    return `
Analyze this mind map for new connections:

NODES: ${mindMap.nodes.map(n => n.label).join(', ')}
EDGES: ${mindMap.edges.map(e => `${e.source} -> ${e.target}`).join(', ')}
USER CONTEXT: ${JSON.stringify(userContext)}

Identify new connections and relationships that could be valuable.
    `.trim();
  }
}
