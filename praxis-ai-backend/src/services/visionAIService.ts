// backend/src/services/vision-ai.service.ts

import { getAIOrchestrator } from './ai-orchestrator';

export interface ExtractedEventData {
  eventDetected: boolean;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  additionalInfo?: string;
  confidence?: number;
}

export interface HandwritingResult {
  text: string;
  confidence: number;
  structuredData?: {
    headings: string[];
    bulletPoints: string[];
    paragraphs: string[];
  };
}

export interface VisionAnalysisResult {
  success: boolean;
  data: any;
  confidence: number;
  processingTimeMs: number;
  modelUsed: string;
}

export class VisionAIService {
  private aiOrchestrator: ReturnType<typeof getAIOrchestrator>;

  constructor() {
    this.aiOrchestrator = getAIOrchestrator();
  }

  // ============================================
  // HANDWRITING OCR PROCESSING
  // ============================================

  async processHandwrittenNote(
    userId: string, 
    imageBase64: string, 
    mimeType: string
  ): Promise<HandwritingResult> {
    try {
      const prompt = `Extract all handwritten text from this image. Preserve formatting, bullet points, and structure.

Instructions:
- Convert handwritten text to typed text
- Maintain original formatting (headings, lists, paragraphs)
- Identify bullet points and numbered lists
- Preserve line breaks and spacing
- If text is unclear, make your best interpretation
- Return the extracted text in a clean, readable format

Format the response as:
EXTRACTED TEXT:
[The extracted text here]

STRUCTURE ANALYSIS:
- Headings: [list of headings found]
- Bullet Points: [list of bullet points]
- Paragraphs: [list of paragraphs]`;

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'high',
        files: [{ 
          filename: 'handwritten-note', 
          mimeType, 
          base64: imageBase64 
        }]
      });

      // Parse the structured response
      const structuredData = this.parseHandwritingResponse(response.content);
      
      return {
        text: structuredData.text,
        confidence: response.confidence || 0.8,
        structuredData: structuredData.structure
      };
    } catch (error) {
      console.error('Error processing handwritten note:', error);
      throw new Error(`Handwriting OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // EVENT DETECTION FROM IMAGES
  // ============================================

  async detectEventFromImage(
    userId: string, 
    imageBase64: string, 
    mimeType: string
  ): Promise<ExtractedEventData> {
    try {
      const prompt = `Analyze this image for any event/meeting information (flyer, poster, ticket, invitation, calendar, etc.).

Extract the following information if present:
- Event title/name
- Date (in YYYY-MM-DD format)
- Time (in HH:MM format, 24-hour)
- Location/venue
- Any additional details (links, contact info, description)

Return ONLY a valid JSON object in this exact format:
{
  "eventDetected": boolean,
  "title": "string or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null", 
  "location": "string or null",
  "additionalInfo": "string or null",
  "confidence": number
}

If no event is detected, return:
{
  "eventDetected": false,
  "title": null,
  "date": null,
  "time": null,
  "location": null,
  "additionalInfo": null,
  "confidence": 0
}`;

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_event_detection',
        priority: 'high',
        files: [{ 
          filename: 'event-image', 
          mimeType, 
          base64: imageBase64 
        }]
      });

      const eventData = JSON.parse(response.content);
      
      // Validate the response structure
      if (typeof eventData.eventDetected !== 'boolean') {
        throw new Error('Invalid event detection response format');
      }

      return {
        eventDetected: eventData.eventDetected,
        title: eventData.title || undefined,
        date: eventData.date || undefined,
        time: eventData.time || undefined,
        location: eventData.location || undefined,
        additionalInfo: eventData.additionalInfo || undefined,
        confidence: eventData.confidence || response.confidence || 0.7
      };
    } catch (error) {
      console.error('Error detecting event from image:', error);
      throw new Error(`Event detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // INSTAGRAM LINK EXTRACTION
  // ============================================

  async extractInstagramLink(
    userId: string, 
    imageBase64: string, 
    mimeType: string = 'image/jpeg'
  ): Promise<string | null> {
    try {
      const prompt = `Extract any Instagram usernames, profile links, or handles visible in this image.

Look for:
- @username format
- instagram.com/username links
- QR codes that might link to Instagram
- Any social media handles

Return ONLY the username or link, nothing else. If none found, return "none".`;

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'medium',
        files: [{ 
          filename: 'social-media-image', 
          mimeType, 
          base64: imageBase64 
        }]
      });

      const extractedText = response.content.trim().toLowerCase();
      
      if (extractedText === 'none' || extractedText === 'null' || extractedText === '') {
        return null;
      }

      // Clean up the extracted text
      return this.cleanInstagramHandle(extractedText);
    } catch (error) {
      console.error('Error extracting Instagram link:', error);
      return null;
    }
  }

  // ============================================
  // DOCUMENT ANALYSIS
  // ============================================

  async analyzeDocument(
    userId: string, 
    imageBase64: string, 
    mimeType: string,
    analysisType: 'receipt' | 'business_card' | 'menu' | 'general' = 'general'
  ): Promise<VisionAnalysisResult> {
    try {
      const prompts = {
        receipt: `Analyze this receipt image and extract:
- Store name
- Date
- Total amount
- Items purchased
- Tax amount
- Payment method

Return as structured JSON.`,
        
        business_card: `Analyze this business card and extract:
- Name
- Company
- Title
- Phone number
- Email
- Address
- Website

Return as structured JSON.`,
        
        menu: `Analyze this menu and extract:
- Restaurant name
- Menu sections
- Items and prices
- Special offers

Return as structured JSON.`,
        
        general: `Analyze this document and extract all relevant information in a structured format.`
      };

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompts[analysisType],
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'medium',
        files: [{ 
          filename: `${analysisType}-document`, 
          mimeType, 
          base64: imageBase64 
        }]
      });

      return {
        success: true,
        data: JSON.parse(response.content),
        confidence: response.confidence || 0.8,
        processingTimeMs: response.processingTimeMs || 0,
        modelUsed: response.modelUsed || 'unknown'
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      return {
        success: false,
        data: null,
        confidence: 0,
        processingTimeMs: 0,
        modelUsed: 'error'
      };
    }
  }

  // ============================================
  // QR CODE DETECTION
  // ============================================

  async detectQRCode(
    userId: string, 
    imageBase64: string, 
    mimeType: string
  ): Promise<string | null> {
    try {
      const prompt = `Detect and decode any QR codes in this image. Return the decoded text/URL if found, or "none" if no QR codes are detected.`;

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'medium',
        files: [{ 
          filename: 'qr-code-image', 
          mimeType, 
          base64: imageBase64 
        }]
      });

      const decodedText = response.content.trim();
      
      if (decodedText === 'none' || decodedText === 'null' || decodedText === '') {
        return null;
      }

      return decodedText;
    } catch (error) {
      console.error('Error detecting QR code:', error);
      return null;
    }
  }

  // ============================================
  // TEXT EXTRACTION WITH FORMATTING
  // ============================================

  async extractTextWithFormatting(
    userId: string, 
    imageBase64: string, 
    mimeType: string
  ): Promise<{ text: string; formatting: any }> {
    try {
      const prompt = `Extract all text from this image while preserving formatting.

Return the text with formatting markers:
- **bold text**
- *italic text*
- # Heading 1
- ## Heading 2
- ### Heading 3
- • Bullet point
- 1. Numbered item
- > Quote
- ` + '`code`' + `

Maintain the original structure and layout.`;

      const response = await this.aiOrchestrator.processRequest({
        userId,
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'high',
        files: [{ 
          filename: 'formatted-text-image', 
          mimeType, 
          base64: imageBase64 
        }]
      });

      return {
        text: response.content,
        formatting: this.parseFormatting(response.content)
      };
    } catch (error) {
      console.error('Error extracting formatted text:', error);
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private parseHandwritingResponse(content: string): { text: string; structure: any } {
    const lines = content.split('\n');
    let extractedText = '';
    let structure = {
      headings: [] as string[],
      bulletPoints: [] as string[],
      paragraphs: [] as string[]
    };

    let inExtractedSection = false;
    let inStructureSection = false;

    for (const line of lines) {
      if (line.includes('EXTRACTED TEXT:')) {
        inExtractedSection = true;
        inStructureSection = false;
        continue;
      }
      if (line.includes('STRUCTURE ANALYSIS:')) {
        inExtractedSection = false;
        inStructureSection = true;
        continue;
      }

      if (inExtractedSection && line.trim()) {
        extractedText += line + '\n';
      }

      if (inStructureSection) {
        if (line.includes('Headings:')) {
          const headings = line.split('Headings:')[1]?.split(',').map(h => h.trim()).filter(h => h) || [];
          structure.headings = headings;
        }
        if (line.includes('Bullet Points:')) {
          const bullets = line.split('Bullet Points:')[1]?.split(',').map(b => b.trim()).filter(b => b) || [];
          structure.bulletPoints = bullets;
        }
        if (line.includes('Paragraphs:')) {
          const paragraphs = line.split('Paragraphs:')[1]?.split(',').map(p => p.trim()).filter(p => p) || [];
          structure.paragraphs = paragraphs;
        }
      }
    }

    return {
      text: extractedText.trim(),
      structure
    };
  }

  private cleanInstagramHandle(text: string): string {
    // Remove common prefixes and clean up
    let cleaned = text
      .replace(/^@/, '') // Remove @ prefix
      .replace(/^instagram\.com\//, '') // Remove instagram.com/ prefix
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '') // Remove full URL
      .replace(/\/$/, '') // Remove trailing slash
      .trim();

    // Add @ prefix back if it's a username
    if (cleaned && !cleaned.startsWith('http')) {
      cleaned = '@' + cleaned;
    }

    return cleaned;
  }

  private parseFormatting(text: string): any {
    const formatting = {
      bold: [],
      italic: [],
      headings: [],
      lists: [],
      quotes: [],
      code: []
    };

    // Simple regex-based parsing
    const boldMatches = text.match(/\*\*(.*?)\*\*/g);
    if (boldMatches) {
      formatting.bold = boldMatches.map(match => match.replace(/\*\*/g, ''));
    }

    const italicMatches = text.match(/\*(.*?)\*/g);
    if (italicMatches) {
      formatting.italic = italicMatches.map(match => match.replace(/\*/g, ''));
    }

    const headingMatches = text.match(/^#{1,3}\s+(.*)$/gm);
    if (headingMatches) {
      formatting.headings = headingMatches.map(match => match.replace(/^#{1,3}\s+/, ''));
    }

    const listMatches = text.match(/^[\*\-\+]\s+(.*)$/gm);
    if (listMatches) {
      formatting.lists = listMatches.map(match => match.replace(/^[\*\-\+]\s+/, ''));
    }

    return formatting;
  }

  // ============================================
  // BATCH PROCESSING
  // ============================================

  async processMultipleImages(
    userId: string,
    images: Array<{ base64: string; mimeType: string; type: 'handwriting' | 'event' | 'document' | 'qr' }>
  ): Promise<Array<{ type: string; result: any; success: boolean }>> {
    const results = [];

    for (const image of images) {
      try {
        let result;
        
        switch (image.type) {
          case 'handwriting':
            result = await this.processHandwrittenNote(userId, image.base64, image.mimeType);
            break;
          case 'event':
            result = await this.detectEventFromImage(userId, image.base64, image.mimeType);
            break;
          case 'document':
            result = await this.analyzeDocument(userId, image.base64, image.mimeType);
            break;
          case 'qr':
            result = await this.detectQRCode(userId, image.base64, image.mimeType);
            break;
          default:
            throw new Error(`Unknown image type: ${image.type}`);
        }

        results.push({
          type: image.type,
          result,
          success: true
        });
      } catch (error) {
        results.push({
          type: image.type,
          result: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

export const visionAIService = new VisionAIService();
