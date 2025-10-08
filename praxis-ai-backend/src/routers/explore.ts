// Explore Router for Praxis-AI (Web Search & Image Analysis)
import { z } from 'zod';
import { router, protectedProcedure } from '../context';
import { SearchQuerySchema, ImageAnalysisSchema } from '../types/ai';
import { AIServiceManager } from '../services/aiService';

// Explore input schemas
const WebSearchSchema = z.object({
  query: z.string().min(1).max(500),
  numResults: z.number().min(1).max(20).default(10),
  searchType: z.enum(['web', 'images', 'news', 'academic']).default('web'),
});

const ImageAnalysisSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().min(1).max(1000),
  analysisType: z.enum(['describe', 'analyze', 'extract_text', 'custom']).default('describe'),
});

const SaveSearchSchema = z.object({
  query: z.string(),
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    source: z.string(),
  })),
});

const GetSearchHistorySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const exploreRouter = router({
  // Web search
  webSearch: protectedProcedure
    .input(WebSearchSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // For now, we'll use a mock search service
      // In production, you'd integrate with Google Search API, Bing API, or similar
      const mockResults = [
        {
          title: `Search results for: ${input.query}`,
          url: 'https://example.com',
          snippet: `This is a mock search result for "${input.query}". In production, this would be replaced with real search results from Google Search API or similar service.`,
          source: 'Mock Search',
        },
        {
          title: `More results for: ${input.query}`,
          url: 'https://example2.com',
          snippet: `Additional mock search result for "${input.query}". Real implementation would use actual search APIs.`,
          source: 'Mock Search',
        },
      ];

      // Save search query to history
      const { data: savedSearch } = await supabase
        .from('search_queries')
        .insert({
          user_id: user.id,
          query: input.query,
          results: mockResults.slice(0, input.numResults),
          search_type: input.searchType,
        })
        .select()
        .single();

      return {
        query: input.query,
        results: mockResults.slice(0, input.numResults),
        searchId: savedSearch.id,
        timestamp: new Date().toISOString(),
      };
    }),

  // Image analysis using AI
  analyzeImage: protectedProcedure
    .input(ImageAnalysisSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const aiService = new AIServiceManager({
        grok: { apiKey: process.env.GROK_API_KEY! },
        gemini: { apiKey: process.env.GEMINI_API_KEY! },
        openai: { apiKey: process.env.OPENAI_API_KEY! },
      });

      let analysisPrompt = '';
      
      switch (input.analysisType) {
        case 'describe':
          analysisPrompt = 'Describe this image in detail, including objects, people, text, colors, and overall composition.';
          break;
        case 'analyze':
          analysisPrompt = 'Analyze this image and provide insights about its content, context, and any notable features.';
          break;
        case 'extract_text':
          analysisPrompt = 'Extract all text visible in this image, including any handwritten or printed text.';
          break;
        case 'custom':
          analysisPrompt = input.prompt;
          break;
        default:
          analysisPrompt = input.prompt;
      }

      try {
        const analysis = await aiService.analyzeImage(input.imageUrl, analysisPrompt);
        
        // Extract tags from analysis
        const tags = analysis.toLowerCase()
          .split(/[,\s]+/)
          .filter(word => word.length > 3)
          .slice(0, 10);

        // Save image analysis
        const { data: savedAnalysis } = await supabase
          .from('image_analyses')
          .insert({
            user_id: user.id,
            image_url: input.imageUrl,
            prompt: input.prompt,
            analysis: analysis,
            tags: tags,
            analysis_type: input.analysisType,
          })
          .select()
          .single();

        return {
          analysis: analysis,
          tags: tags,
          analysisId: savedAnalysis.id,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Image analysis error:', error);
        throw new Error('Image analysis failed. Please try again.');
      }
    }),

  // Get search history
  getSearchHistory: protectedProcedure
    .input(GetSearchHistorySchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: searchHistory } = await supabase
        .from('search_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      return searchHistory || [];
    }),

  // Get image analysis history
  getImageAnalysisHistory: protectedProcedure
    .input(GetSearchHistorySchema)
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      const { data: analysisHistory } = await supabase
        .from('image_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      return analysisHistory || [];
    }),

  // Delete search history item
  deleteSearchHistory: protectedProcedure
    .input(z.object({ searchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('search_queries')
        .delete()
        .eq('id', input.searchId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Delete image analysis
  deleteImageAnalysis: protectedProcedure
    .input(z.object({ analysisId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      await supabase
        .from('image_analyses')
        .delete()
        .eq('id', input.analysisId)
        .eq('user_id', user.id);

      return { success: true };
    }),

  // Get trending topics (mock implementation)
  getTrendingTopics: protectedProcedure
    .input(z.object({
      category: z.enum(['technology', 'business', 'science', 'health', 'general']).default('general'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock trending topics - in production, this would integrate with news APIs
      const mockTrendingTopics = {
        technology: [
          { topic: 'Artificial Intelligence', searches: 1250 },
          { topic: 'Quantum Computing', searches: 890 },
          { topic: 'Blockchain', searches: 750 },
        ],
        business: [
          { topic: 'Remote Work', searches: 1100 },
          { topic: 'Sustainability', searches: 950 },
          { topic: 'Digital Transformation', searches: 800 },
        ],
        science: [
          { topic: 'Climate Change', searches: 1300 },
          { topic: 'Space Exploration', searches: 900 },
          { topic: 'Biotechnology', searches: 700 },
        ],
        health: [
          { topic: 'Mental Health', searches: 1200 },
          { topic: 'Nutrition', searches: 850 },
          { topic: 'Exercise', searches: 750 },
        ],
        general: [
          { topic: 'Productivity', searches: 1000 },
          { topic: 'Learning', searches: 900 },
          { topic: 'Creativity', searches: 800 },
        ],
      };

      return mockTrendingTopics[input.category] || [];
    }),

  // Generate search suggestions
  generateSearchSuggestions: protectedProcedure
    .input(z.object({
      partialQuery: z.string().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const { user, supabase } = ctx;
      
      // Get user's previous searches for suggestions
      const { data: previousSearches } = await supabase
        .from('search_queries')
        .select('query')
        .eq('user_id', user.id)
        .ilike('query', `%${input.partialQuery}%`)
        .order('timestamp', { ascending: false })
        .limit(5);

      const suggestions = previousSearches?.map(search => search.query) || [];
      
      // Add some generic suggestions based on partial query
      const genericSuggestions = [
        `${input.partialQuery} tips`,
        `${input.partialQuery} best practices`,
        `${input.partialQuery} guide`,
        `${input.partialQuery} examples`,
      ];

      return [...suggestions, ...genericSuggestions].slice(0, 8);
    }),

  // Get explore dashboard data
  getExploreDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, supabase } = ctx;
      
      // Get recent searches
      const { data: recentSearches } = await supabase
        .from('search_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      // Get recent image analyses
      const { data: recentAnalyses } = await supabase
        .from('image_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      // Get search statistics
      const { data: allSearches } = await supabase
        .from('search_queries')
        .select('timestamp')
        .eq('user_id', user.id);

      const searchesThisWeek = allSearches?.filter(search => {
        const searchDate = new Date(search.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return searchDate > weekAgo;
      }).length || 0;

      return {
        recentSearches: recentSearches || [],
        recentAnalyses: recentAnalyses || [],
        statistics: {
          totalSearches: allSearches?.length || 0,
          searchesThisWeek: searchesThisWeek,
          totalAnalyses: recentAnalyses?.length || 0,
        },
      };
    }),
});

