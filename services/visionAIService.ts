import { miraAIService } from './miraAIService';

interface ExtractedEventData {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  contactInfo?: string;
  links?: string[];
  confidence: number;
}

class VisionAIService {
  async processHandwrittenNote(userId: string, imageBase64: string, mimeType: string): Promise<{text: string; confidence: number}> {
    try {
      // Use Mira AI service for OCR processing
      const response = await miraAIService.processRequest({
        userId,
        message: 'Extract all handwritten text from this image. Preserve formatting, bullet points, and structure. Return only the extracted text without any additional commentary.',
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'high',
        files: [{ base64: imageBase64, mimeType }]
      });

      return {
        text: response.content,
        confidence: response.confidence || 0.85
      };
    } catch (error) {
      console.error('Error processing handwritten note:', error);
      throw new Error('Failed to process handwritten note');
    }
  }

  async detectEventFromImage(userId: string, imageBase64: string, mimeType: string): Promise<ExtractedEventData> {
    try {
      const prompt = `Analyze this image for any event/meeting information (flyer, poster, ticket, invitation, calendar, etc.).

Extract the following information if present:
- Event title
- Date and time
- Location
- Description or details
- Contact information
- Any relevant links or URLs

Return ONLY a valid JSON object with these fields:
{
  "title": "string or null",
  "date": "string or null", 
  "time": "string or null",
  "location": "string or null",
  "description": "string or null",
  "contactInfo": "string or null",
  "links": ["array of strings or empty array"],
  "confidence": number between 0-1
}

If no event information is found, return null values with confidence 0.`;

      const response = await miraAIService.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_event_detection',
        priority: 'high',
        files: [{ base64: imageBase64, mimeType }]
      });

      try {
        const extractedData = JSON.parse(response.content);
        return {
          title: extractedData.title || null,
          date: extractedData.date || null,
          time: extractedData.time || null,
          location: extractedData.location || null,
          description: extractedData.description || null,
          contactInfo: extractedData.contactInfo || null,
          links: extractedData.links || [],
          confidence: extractedData.confidence || 0.5
        };
      } catch (parseError) {
        console.error('Error parsing event extraction response:', parseError);
        return {
          title: null,
          date: null,
          time: null,
          location: null,
          description: null,
          contactInfo: null,
          links: [],
          confidence: 0.3
        };
      }
    } catch (error) {
      console.error('Error detecting event from image:', error);
      throw new Error('Failed to detect event from image');
    }
  }

  async extractTextFromDocument(userId: string, imageBase64: string, mimeType: string): Promise<{text: string; confidence: number; structure?: any}> {
    try {
      const prompt = `Extract all text from this document image. Preserve the original structure, formatting, and layout as much as possible.

For structured documents (forms, tables, etc.), also identify:
- Headers and sections
- Key-value pairs
- Lists and bullet points
- Tables and their data

Return the extracted text with preserved formatting and structure.`;

      const response = await miraAIService.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_document_ocr',
        priority: 'medium',
        files: [{ base64: imageBase64, mimeType }]
      });

      return {
        text: response.content,
        confidence: response.confidence || 0.8,
        structure: response.structure
      };
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async analyzeImageContent(userId: string, imageBase64: string, mimeType: string, analysisType: 'general' | 'productivity' | 'creative' = 'general'): Promise<{description: string; insights: string[]; tags: string[]}> {
    try {
      const prompts = {
        general: 'Analyze this image and provide a detailed description of what you see.',
        productivity: 'Analyze this image from a productivity perspective. What tasks, goals, or organizational elements do you see?',
        creative: 'Analyze this image from a creative perspective. What artistic elements, inspiration, or creative potential do you see?'
      };

      const response = await miraAIService.processRequest({
        userId,
        message: prompts[analysisType],
        context: { conversationHistory: [] },
        featureType: 'vision_analysis',
        priority: 'medium',
        files: [{ base64: imageBase64, mimeType }]
      });

      // Extract insights and tags from the response
      const insights = this.extractInsightsFromResponse(response.content);
      const tags = this.extractTagsFromResponse(response.content);

      return {
        description: response.content,
        insights,
        tags
      };
    } catch (error) {
      console.error('Error analyzing image content:', error);
      throw new Error('Failed to analyze image content');
    }
  }

  private extractInsightsFromResponse(content: string): string[] {
    // Simple extraction of insights - look for bullet points or numbered lists
    const insights: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+\.\s/)) {
        insights.push(trimmed.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, ''));
      }
    }
    
    return insights.slice(0, 5); // Limit to 5 insights
  }

  private extractTagsFromResponse(content: string): string[] {
    // Extract potential tags from the content
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    const tags = words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0);
    
    // Return unique tags, limited to 10
    return [...new Set(tags)].slice(0, 10);
  }
}

export const visionAIService = new VisionAIService();
export type { ExtractedEventData };
