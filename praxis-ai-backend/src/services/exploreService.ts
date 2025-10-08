// Explore Service for Praxis-AI
import { EnhancedGrokService } from './enhancedGrokService';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore: number;
  publishDate?: Date;
  author?: string;
}

export interface SearchResults {
  query: string;
  results: SearchResult[];
  insights: string[];
  relatedTopics: string[];
  sources: string[];
  actionableItems: string[];
  searchMetadata: {
    totalResults: number;
    searchTime: number;
    sources: string[];
  };
}

export interface ImageAnalysis {
  description: string;
  extractedText: string;
  insights: string[];
  actionItems: string[];
  connections: string[];
  confidence: number;
  tags: string[];
}

export interface ExploreConfig {
  maxResults: number;
  includeInsights: boolean;
  includeRelatedTopics: boolean;
  includeActionableItems: boolean;
  searchEngines: string[];
  imageAnalysisMode: 'basic' | 'detailed' | 'comprehensive';
}

export class ExploreService {
  constructor(private grokService: EnhancedGrokService) {}

  async searchAndAnalyze(
    query: string,
    config: ExploreConfig = {
      maxResults: 10,
      includeInsights: true,
      includeRelatedTopics: true,
      includeActionableItems: true,
      searchEngines: ['web', 'academic', 'news'],
      imageAnalysisMode: 'detailed'
    }
  ): Promise<SearchResults> {
    // Perform grounded web search
    const searchResults = await this.performGroundedSearch(query, config);
    
    // Analyze results with AI
    const analysis = await this.analyzeSearchResults(searchResults, query, config);
    
    return {
      query,
      results: searchResults,
      insights: analysis.insights,
      relatedTopics: analysis.relatedTopics,
      sources: analysis.sources,
      actionableItems: analysis.actionableItems,
      searchMetadata: {
        totalResults: searchResults.length,
        searchTime: Date.now(),
        sources: config.searchEngines,
      }
    };
  }

  async analyzeImage(
    imageUrl: string,
    context: string,
    config: ExploreConfig
  ): Promise<ImageAnalysis> {
    const analysisPrompt = this.buildImageAnalysisPrompt(imageUrl, context, config);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's image analysis expert. Analyze images to:
- Provide accurate visual descriptions
- Extract any text or data
- Identify patterns and insights
- Suggest actionable next steps
- Connect visual information to user context

Format as JSON with: description, extractedText, insights[], actionItems[], connections[], confidence, tags[]`
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async generateContextualSearch(
    userContext: any,
    focusArea: string
  ): Promise<SearchResults> {
    const contextualQuery = await this.generateContextualQuery(userContext, focusArea);
    
    return this.searchAndAnalyze(contextualQuery);
  }

  async findRelatedResources(
    topic: string,
    resourceType: 'articles' | 'videos' | 'courses' | 'books' | 'all' = 'all'
  ): Promise<SearchResult[]> {
    const resourceQuery = this.buildResourceQuery(topic, resourceType);
    
    const searchResults = await this.performGroundedSearch(resourceQuery, {
      maxResults: 15,
      includeInsights: false,
      includeRelatedTopics: false,
      includeActionableItems: false,
      searchEngines: ['web'],
      imageAnalysisMode: 'basic'
    });
    
    return searchResults;
  }

  async verifyInformation(
    claim: string,
    sources: string[]
  ): Promise<{
    verified: boolean;
    confidence: number;
    supportingSources: string[];
    contradictingSources: string[];
    verificationNotes: string[];
  }> {
    const verificationPrompt = this.buildVerificationPrompt(claim, sources);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's fact-checking expert. Verify claims against provided sources and provide:
- Verification status
- Confidence level
- Supporting evidence
- Contradicting evidence
- Verification notes

Format as JSON with: verified, confidence, supportingSources[], contradictingSources[], verificationNotes[]`
      },
      {
        role: 'user',
        content: verificationPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async generateResearchSummary(
    searchResults: SearchResult[],
    focusQuestion: string
  ): Promise<{
    summary: string;
    keyFindings: string[];
    evidence: string[];
    conclusions: string[];
    recommendations: string[];
    limitations: string[];
  }> {
    const summaryPrompt = this.buildResearchSummaryPrompt(searchResults, focusQuestion);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's research synthesizer. Create comprehensive research summaries that:
- Synthesize multiple sources
- Identify key findings
- Present evidence objectively
- Draw evidence-based conclusions
- Provide actionable recommendations

Format as JSON with: summary, keyFindings[], evidence[], conclusions[], recommendations[], limitations[]`
      },
      {
        role: 'user',
        content: summaryPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  async trackTrendingTopics(
    category: 'technology' | 'business' | 'science' | 'health' | 'education' | 'general'
  ): Promise<{
    topics: Array<{
      topic: string;
      trend: 'rising' | 'stable' | 'declining';
      relevance: number;
      sources: string[];
    }>;
    insights: string[];
    predictions: string[];
  }> {
    const trendingQuery = this.buildTrendingQuery(category);
    
    const searchResults = await this.performGroundedSearch(trendingQuery, {
      maxResults: 20,
      includeInsights: true,
      includeRelatedTopics: true,
      includeActionableItems: false,
      searchEngines: ['news', 'web'],
      imageAnalysisMode: 'basic'
    });
    
    const trendAnalysis = await this.analyzeTrends(searchResults, category);
    
    return trendAnalysis;
  }

  private async performGroundedSearch(query: string, config: ExploreConfig): Promise<SearchResult[]> {
    // This would integrate with real search APIs (Google Search, Bing, etc.)
    // For now, return mock results
    const mockResults: SearchResult[] = [
      {
        title: `Search results for: ${query}`,
        url: 'https://example.com/result1',
        snippet: `This is a mock search result for "${query}". In production, this would be replaced with real search results from Google Search API or similar service.`,
        source: 'Mock Search',
        relevanceScore: 0.9,
        publishDate: new Date(),
        author: 'Example Author'
      },
      {
        title: `More results for: ${query}`,
        url: 'https://example.com/result2',
        snippet: `Additional mock search result for "${query}". Real implementation would use actual search APIs.`,
        source: 'Mock Search',
        relevanceScore: 0.8,
        publishDate: new Date(),
        author: 'Another Author'
      }
    ];
    
    return mockResults.slice(0, config.maxResults);
  }

  private async analyzeSearchResults(
    results: SearchResult[],
    query: string,
    config: ExploreConfig
  ): Promise<{
    insights: string[];
    relatedTopics: string[];
    sources: string[];
    actionableItems: string[];
  }> {
    const analysisPrompt = this.buildSearchAnalysisPrompt(results, query, config);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's search result analyzer. Analyze search results to extract insights, related topics, and actionable items.`
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  private async generateContextualQuery(userContext: any, focusArea: string): Promise<string> {
    const contextualPrompt = this.buildContextualQueryPrompt(userContext, focusArea);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's contextual search generator. Generate search queries that are relevant to the user's context and focus area.`
      },
      {
        role: 'user',
        content: contextualPrompt
      }
    ]);

    return response.content;
  }

  private async analyzeTrends(
    searchResults: SearchResult[],
    category: string
  ): Promise<{
    topics: Array<{
      topic: string;
      trend: 'rising' | 'stable' | 'declining';
      relevance: number;
      sources: string[];
    }>;
    insights: string[];
    predictions: string[];
  }> {
    const trendPrompt = this.buildTrendAnalysisPrompt(searchResults, category);
    
    const response = await this.grokService.makeGrokRequest([
      {
        role: 'system',
        content: `You are Praxis-AI's trend analyst. Analyze search results to identify trending topics, insights, and predictions.`
      },
      {
        role: 'user',
        content: trendPrompt
      }
    ]);

    return JSON.parse(response.content);
  }

  // Prompt building methods
  private buildImageAnalysisPrompt(imageUrl: string, context: string, config: ExploreConfig): string {
    return `
Analyze this image in the context of: ${context}

Image URL: ${imageUrl}
Analysis Mode: ${config.imageAnalysisMode}

Provide comprehensive analysis including description, extracted text, insights, and actionable items.
    `.trim();
  }

  private buildSearchAnalysisPrompt(
    results: SearchResult[],
    query: string,
    config: ExploreConfig
  ): string {
    return `
Analyze these search results for the query: "${query}"

RESULTS:
${results.map(result => `
- ${result.title}
  URL: ${result.url}
  Snippet: ${result.snippet}
  Source: ${result.source}
`).join('\n')}

CONFIG:
- Include insights: ${config.includeInsights}
- Include related topics: ${config.includeRelatedTopics}
- Include actionable items: ${config.includeActionableItems}

Extract insights, related topics, and actionable items from these results.
    `.trim();
  }

  private buildContextualQueryPrompt(userContext: any, focusArea: string): string {
    return `
Generate a contextual search query based on:

USER CONTEXT:
- Goals: ${userContext.goals?.map((g: any) => g.text).join(', ') || 'Not specified'}
- Recent activities: ${userContext.recentActivities?.map((a: any) => a.title).join(', ') || 'Not specified'}
- Learning focus: ${userContext.learningFocus?.map((l: any) => l.topic).join(', ') || 'Not specified'}
- Health status: ${userContext.healthStatus?.mood || 'Not specified'}

FOCUS AREA: ${focusArea}

Generate a search query that would be most relevant and helpful for this user.
    `.trim();
  }

  private buildResourceQuery(topic: string, resourceType: string): string {
    const resourceKeywords = {
      articles: 'articles about',
      videos: 'videos about',
      courses: 'online courses about',
      books: 'books about',
      all: 'resources about'
    };
    
    return `${resourceKeywords[resourceType as keyof typeof resourceKeywords]} ${topic}`;
  }

  private buildVerificationPrompt(claim: string, sources: string[]): string {
    return `
Verify this claim against the provided sources:

CLAIM: ${claim}

SOURCES:
${sources.map(source => `- ${source}`).join('\n')}

Analyze the claim's accuracy and provide verification details.
    `.trim();
  }

  private buildResearchSummaryPrompt(searchResults: SearchResult[], focusQuestion: string): string {
    return `
Create a research summary based on these sources:

FOCUS QUESTION: ${focusQuestion}

SOURCES:
${searchResults.map(result => `
- ${result.title}
  URL: ${result.url}
  Snippet: ${result.snippet}
`).join('\n')}

Synthesize the information to answer the focus question comprehensively.
    `.trim();
  }

  private buildTrendAnalysisPrompt(searchResults: SearchResult[], category: string): string {
    return `
Analyze trends in ${category} based on these search results:

RESULTS:
${searchResults.map(result => `
- ${result.title}
  Snippet: ${result.snippet}
  Source: ${result.source}
`).join('\n')}

Identify trending topics, insights, and predictions for this category.
    `.trim();
  }
}
