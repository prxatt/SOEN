// backend/src/routers/vision.ts

import { z } from 'zod';
import { router, aiRequestProcedure } from '../context';
import { visionAIService } from '../services/visionAIService';

// Input schemas
const ProcessHandwritingSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

const DetectEventSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

const ExtractInstagramSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().optional().default('image/jpeg'),
});

const AnalyzeDocumentSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
  analysisType: z.enum(['receipt', 'business_card', 'menu', 'general']).default('general'),
});

const DetectQRCodeSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

const ExtractFormattedTextSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

const ProcessMultipleImagesSchema = z.object({
  images: z.array(z.object({
    base64: z.string().min(1),
    mimeType: z.string().min(1),
    type: z.enum(['handwriting', 'event', 'document', 'qr']),
  })).min(1).max(10), // Limit to 10 images per batch
});

export const visionRouter = router({
  // Process handwritten notes
  processHandwriting: aiRequestProcedure
    .input(ProcessHandwritingSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.processHandwrittenNote(
          ctx.user.id,
          input.imageBase64,
          input.mimeType
        );

        return {
          success: true,
          data: result,
          message: 'Handwriting processed successfully',
        };
      } catch (error) {
        console.error('Error processing handwriting:', error);
        throw new Error(`Handwriting processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Detect events from images
  detectEvent: aiRequestProcedure
    .input(DetectEventSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.detectEventFromImage(
          ctx.user.id,
          input.imageBase64,
          input.mimeType
        );

        return {
          success: true,
          data: result,
          message: result.eventDetected ? 'Event detected successfully' : 'No event detected',
        };
      } catch (error) {
        console.error('Error detecting event:', error);
        throw new Error(`Event detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Extract Instagram links
  extractInstagramLink: aiRequestProcedure
    .input(ExtractInstagramSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.extractInstagramLink(
          ctx.user.id,
          input.imageBase64,
          input.mimeType
        );

        return {
          success: true,
          data: { instagramLink: result },
          message: result ? 'Instagram link extracted successfully' : 'No Instagram link found',
        };
      } catch (error) {
        console.error('Error extracting Instagram link:', error);
        throw new Error(`Instagram extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Analyze documents
  analyzeDocument: aiRequestProcedure
    .input(AnalyzeDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.analyzeDocument(
          ctx.user.id,
          input.imageBase64,
          input.mimeType,
          input.analysisType
        );

        return {
          success: result.success,
          data: result.data,
          confidence: result.confidence,
          processingTimeMs: result.processingTimeMs,
          modelUsed: result.modelUsed,
          message: result.success ? 'Document analyzed successfully' : 'Document analysis failed',
        };
      } catch (error) {
        console.error('Error analyzing document:', error);
        throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Detect QR codes
  detectQRCode: aiRequestProcedure
    .input(DetectQRCodeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.detectQRCode(
          ctx.user.id,
          input.imageBase64,
          input.mimeType
        );

        return {
          success: true,
          data: { qrCode: result },
          message: result ? 'QR code detected successfully' : 'No QR code found',
        };
      } catch (error) {
        console.error('Error detecting QR code:', error);
        throw new Error(`QR code detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Extract formatted text
  extractFormattedText: aiRequestProcedure
    .input(ExtractFormattedTextSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await visionAIService.extractTextWithFormatting(
          ctx.user.id,
          input.imageBase64,
          input.mimeType
        );

        return {
          success: true,
          data: result,
          message: 'Formatted text extracted successfully',
        };
      } catch (error) {
        console.error('Error extracting formatted text:', error);
        throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Process multiple images in batch
  processMultipleImages: aiRequestProcedure
    .input(ProcessMultipleImagesSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const results = await visionAIService.processMultipleImages(
          ctx.user.id,
          input.images
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return {
          success: failureCount === 0,
          data: results,
          message: `Processed ${successCount} images successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
          },
        };
      } catch (error) {
        console.error('Error processing multiple images:', error);
        throw new Error(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get supported image formats
  getSupportedFormats: aiRequestProcedure
    .query(async ({ ctx }) => {
      return {
        success: true,
        data: {
          supportedFormats: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/tiff'
          ],
          maxFileSize: '10MB',
          recommendedFormats: ['image/jpeg', 'image/png'],
          maxBatchSize: 10,
        },
        message: 'Supported formats retrieved successfully',
      };
    }),

  // Get processing capabilities
  getCapabilities: aiRequestProcedure
    .query(async ({ ctx }) => {
      return {
        success: true,
        data: {
          capabilities: [
            'handwriting_ocr',
            'event_detection',
            'instagram_extraction',
            'document_analysis',
            'qr_code_detection',
            'formatted_text_extraction',
            'batch_processing'
          ],
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
          processingTime: {
            handwriting: '2-5 seconds',
            event_detection: '3-6 seconds',
            document_analysis: '4-8 seconds',
            batch_processing: 'varies by batch size'
          }
        },
        message: 'Capabilities retrieved successfully',
      };
    }),
});
