// backend/src/test/vision-ai.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { visionAIService } from '../services/visionAIService';

// Mock AI orchestrator
const mockAIOrchestrator = {
  processRequest: vi.fn(),
};

vi.mock('../services/ai-orchestrator', () => ({
  getAIOrchestrator: vi.fn(() => mockAIOrchestrator),
}));

describe('VisionAIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processHandwrittenNote', () => {
    it('should process handwritten notes successfully', async () => {
      const mockResponse = {
        content: `EXTRACTED TEXT:
This is handwritten text
With multiple lines
And some formatting

STRUCTURE ANALYSIS:
- Headings: [Main Title, Subtitle]
- Bullet Points: [Point 1, Point 2]
- Paragraphs: [First paragraph, Second paragraph]`,
        confidence: 0.9,
        processingTimeMs: 2000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.processHandwrittenNote(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result).toEqual({
        text: 'This is handwritten text\nWith multiple lines\nAnd some formatting\n',
        confidence: 0.9,
        structuredData: {
          headings: ['Main Title', 'Subtitle'],
          bulletPoints: ['Point 1', 'Point 2'],
          paragraphs: ['First paragraph', 'Second paragraph']
        }
      });

      expect(mockAIOrchestrator.processRequest).toHaveBeenCalledWith({
        userId: 'user-123',
        message: expect.stringContaining('Extract all handwritten text'),
        context: { conversationHistory: [] },
        featureType: 'vision_ocr',
        priority: 'high',
        files: [{
          filename: 'handwritten-note',
          mimeType: 'image/jpeg',
          base64: 'base64-image-data'
        }]
      });
    });

    it('should handle errors gracefully', async () => {
      mockAIOrchestrator.processRequest.mockRejectedValue(new Error('AI service error'));

      await expect(
        visionAIService.processHandwrittenNote('user-123', 'base64-image-data', 'image/jpeg')
      ).rejects.toThrow('Handwriting OCR failed: AI service error');
    });
  });

  describe('detectEventFromImage', () => {
    it('should detect events successfully', async () => {
      const mockResponse = {
        content: JSON.stringify({
          eventDetected: true,
          title: 'Tech Conference 2024',
          date: '2024-06-15',
          time: '09:00',
          location: 'Convention Center',
          additionalInfo: 'Early bird discount available',
          confidence: 0.95
        }),
        confidence: 0.95,
        processingTimeMs: 3000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.detectEventFromImage(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result).toEqual({
        eventDetected: true,
        title: 'Tech Conference 2024',
        date: '2024-06-15',
        time: '09:00',
        location: 'Convention Center',
        additionalInfo: 'Early bird discount available',
        confidence: 0.95
      });
    });

    it('should handle no event detected', async () => {
      const mockResponse = {
        content: JSON.stringify({
          eventDetected: false,
          title: null,
          date: null,
          time: null,
          location: null,
          additionalInfo: null,
          confidence: 0
        }),
        confidence: 0,
        processingTimeMs: 2000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.detectEventFromImage(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result.eventDetected).toBe(false);
      expect(result.title).toBeUndefined();
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        content: 'Invalid JSON response',
        confidence: 0.5,
        processingTimeMs: 2000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      await expect(
        visionAIService.detectEventFromImage('user-123', 'base64-image-data', 'image/jpeg')
      ).rejects.toThrow('Event detection failed');
    });
  });

  describe('extractInstagramLink', () => {
    it('should extract Instagram username successfully', async () => {
      const mockResponse = {
        content: '@username123',
        confidence: 0.8,
        processingTimeMs: 1500,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.extractInstagramLink(
        'user-123',
        'base64-image-data'
      );

      expect(result).toBe('@username123');
    });

    it('should clean Instagram URLs', async () => {
      const mockResponse = {
        content: 'instagram.com/username123',
        confidence: 0.8,
        processingTimeMs: 1500,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.extractInstagramLink(
        'user-123',
        'base64-image-data'
      );

      expect(result).toBe('@username123');
    });

    it('should return null when no Instagram link found', async () => {
      const mockResponse = {
        content: 'none',
        confidence: 0.8,
        processingTimeMs: 1500,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.extractInstagramLink(
        'user-123',
        'base64-image-data'
      );

      expect(result).toBeNull();
    });
  });

  describe('analyzeDocument', () => {
    it('should analyze receipt successfully', async () => {
      const mockResponse = {
        content: JSON.stringify({
          storeName: 'Coffee Shop',
          date: '2024-01-15',
          totalAmount: 12.50,
          items: ['Coffee', 'Pastry'],
          taxAmount: 1.00,
          paymentMethod: 'Credit Card'
        }),
        confidence: 0.9,
        processingTimeMs: 4000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.analyzeDocument(
        'user-123',
        'base64-image-data',
        'image/jpeg',
        'receipt'
      );

      expect(result.success).toBe(true);
      expect(result.data.storeName).toBe('Coffee Shop');
      expect(result.confidence).toBe(0.9);
    });

    it('should handle analysis errors gracefully', async () => {
      mockAIOrchestrator.processRequest.mockRejectedValue(new Error('Analysis error'));

      const result = await visionAIService.analyzeDocument(
        'user-123',
        'base64-image-data',
        'image/jpeg',
        'receipt'
      );

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('detectQRCode', () => {
    it('should detect QR code successfully', async () => {
      const mockResponse = {
        content: 'https://example.com/qr-link',
        confidence: 0.95,
        processingTimeMs: 1000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.detectQRCode(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result).toBe('https://example.com/qr-link');
    });

    it('should return null when no QR code found', async () => {
      const mockResponse = {
        content: 'none',
        confidence: 0.8,
        processingTimeMs: 1000,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.detectQRCode(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result).toBeNull();
    });
  });

  describe('extractTextWithFormatting', () => {
    it('should extract formatted text successfully', async () => {
      const mockResponse = {
        content: '# Heading\n**Bold text**\n*Italic text*\n• Bullet point',
        confidence: 0.85,
        processingTimeMs: 2500,
        modelUsed: 'gpt-4o-mini'
      };

      mockAIOrchestrator.processRequest.mockResolvedValue(mockResponse);

      const result = await visionAIService.extractTextWithFormatting(
        'user-123',
        'base64-image-data',
        'image/jpeg'
      );

      expect(result.text).toBe('# Heading\n**Bold text**\n*Italic text*\n• Bullet point');
      expect(result.formatting).toBeDefined();
      expect(result.formatting.bold).toContain('Bold text');
      expect(result.formatting.italic).toContain('Italic text');
    });
  });

  describe('processMultipleImages', () => {
    it('should process multiple images successfully', async () => {
      const images = [
        { base64: 'image1', mimeType: 'image/jpeg', type: 'handwriting' as const },
        { base64: 'image2', mimeType: 'image/jpeg', type: 'event' as const },
        { base64: 'image3', mimeType: 'image/jpeg', type: 'qr' as const }
      ];

      // Mock different responses for different image types
      mockAIOrchestrator.processRequest
        .mockResolvedValueOnce({
          content: 'EXTRACTED TEXT:\nHandwritten text\n\nSTRUCTURE ANALYSIS:\n- Headings: []\n- Bullet Points: []\n- Paragraphs: []',
          confidence: 0.9
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            eventDetected: true,
            title: 'Event Title',
            date: '2024-01-01',
            time: '12:00',
            location: 'Location',
            additionalInfo: 'Info',
            confidence: 0.8
          }),
          confidence: 0.8
        })
        .mockResolvedValueOnce({
          content: 'https://example.com/qr',
          confidence: 0.95
        });

      const results = await visionAIService.processMultipleImages('user-123', images);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].type).toBe('handwriting');
      expect(results[1].success).toBe(true);
      expect(results[1].type).toBe('event');
      expect(results[2].success).toBe(true);
      expect(results[2].type).toBe('qr');
    });

    it('should handle mixed success/failure results', async () => {
      const images = [
        { base64: 'image1', mimeType: 'image/jpeg', type: 'handwriting' as const },
        { base64: 'image2', mimeType: 'image/jpeg', type: 'event' as const }
      ];

      mockAIOrchestrator.processRequest
        .mockResolvedValueOnce({
          content: 'EXTRACTED TEXT:\nHandwritten text\n\nSTRUCTURE ANALYSIS:\n- Headings: []\n- Bullet Points: []\n- Paragraphs: []',
          confidence: 0.9
        })
        .mockRejectedValueOnce(new Error('Event detection failed'));

      const results = await visionAIService.processMultipleImages('user-123', images);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Event detection failed');
    });
  });

  describe('utility methods', () => {
    it('should clean Instagram handles correctly', () => {
      const service = visionAIService as any;
      
      expect(service.cleanInstagramHandle('@username')).toBe('@username');
      expect(service.cleanInstagramHandle('instagram.com/username')).toBe('@username');
      expect(service.cleanInstagramHandle('https://www.instagram.com/username/')).toBe('@username');
      expect(service.cleanInstagramHandle('username')).toBe('@username');
    });

    it('should parse formatting correctly', () => {
      const service = visionAIService as any;
      const text = '# Heading\n**Bold**\n*Italic*\n• Bullet';
      
      const formatting = service.parseFormatting(text);
      
      expect(formatting.bold).toContain('Bold');
      expect(formatting.italic).toContain('Italic');
      expect(formatting.headings).toContain('Heading');
      expect(formatting.lists).toContain('Bullet');
    });

    it('should parse handwriting response correctly', () => {
      const service = visionAIService as any;
      const content = `EXTRACTED TEXT:
This is the extracted text
With multiple lines

STRUCTURE ANALYSIS:
- Headings: [Title, Subtitle]
- Bullet Points: [Point 1, Point 2]
- Paragraphs: [Para 1, Para 2]`;

      const result = service.parseHandwritingResponse(content);
      
      expect(result.text).toBe('This is the extracted text\nWith multiple lines\n');
      expect(result.structure.headings).toEqual(['Title', 'Subtitle']);
      expect(result.structure.bulletPoints).toEqual(['Point 1', 'Point 2']);
      expect(result.structure.paragraphs).toEqual(['Para 1', 'Para 2']);
    });
  });
});
