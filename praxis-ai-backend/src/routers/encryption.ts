import { praxisProcedure, router } from '../context';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createEncryptionService } from '../services/encryptionService';

// ============================================
// ENCRYPTION MANAGEMENT ROUTER
// ============================================

export const encryptionRouter = router({
  // ============================================
  // ENCRYPTION KEY MANAGEMENT
  // ============================================

  generateEncryptionKey: praxisProcedure
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
      keyId: z.string().optional(),
    }))
    .mutation(async ({ ctx }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        const keyId = await encryptionService.generateUserEncryptionKey(ctx.user.id);
        
        return {
          success: true,
          message: 'Encryption key generated successfully',
          keyId: keyId.substring(0, 8) + '...' // Only show partial key ID for security
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate encryption key: ${error.message}`,
        });
      }
    }),

  getEncryptionStatus: praxisProcedure
    .output(z.object({
      hasEncryptionKey: z.boolean(),
      encryptedFields: z.array(z.string()),
      lastKeyRotation: z.string().optional(),
    }))
    .query(async ({ ctx }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        return await encryptionService.getEncryptionStatus(ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get encryption status: ${error.message}`,
        });
      }
    }),

  validateEncryption: praxisProcedure
    .output(z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
    }))
    .query(async ({ ctx }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        return await encryptionService.validateEncryption(ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to validate encryption: ${error.message}`,
        });
      }
    }),

  rotateEncryptionKey: praxisProcedure
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        await encryptionService.rotateUserEncryptionKey(ctx.user.id);
        
        return {
          success: true,
          message: 'Encryption key rotated successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to rotate encryption key: ${error.message}`,
        });
      }
    }),

  // ============================================
  // CONTENT ENCRYPTION/DECRYPTION
  // ============================================

  encryptContent: praxisProcedure
    .input(z.object({
      content: z.string().min(1),
    }))
    .output(z.object({
      encrypted: z.string(),
      iv: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        const userKey = await encryptionService.getUserEncryptionKey(ctx.user.id);
        
        if (!userKey) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User encryption key not found. Please generate one first.',
          });
        }

        return await encryptionService.encryptContent(input.content, userKey);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to encrypt content: ${error.message}`,
        });
      }
    }),

  decryptContent: praxisProcedure
    .input(z.object({
      encrypted: z.string(),
      iv: z.string(),
    }))
    .output(z.object({
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        const userKey = await encryptionService.getUserEncryptionKey(ctx.user.id);
        
        if (!userKey) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User encryption key not found. Please generate one first.',
          });
        }

        const content = await encryptionService.decryptContent(
          input.encrypted,
          input.iv,
          userKey
        );

        return { content };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to decrypt content: ${error.message}`,
        });
      }
    }),

  // ============================================
  // BULK ENCRYPTION/DECRYPTION
  // ============================================

  encryptUserData: praxisProcedure
    .input(z.object({
      data: z.record(z.string()),
    }))
    .output(z.object({
      encryptedData: z.record(z.object({
        encrypted: z.string(),
        iv: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        const encryptedData = await encryptionService.encryptUserData(ctx.user.id, input.data);
        
        return { encryptedData };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to encrypt user data: ${error.message}`,
        });
      }
    }),

  decryptUserData: praxisProcedure
    .input(z.object({
      encryptedData: z.record(z.object({
        encrypted: z.string(),
        iv: z.string(),
      })),
    }))
    .output(z.object({
      decryptedData: z.record(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        const decryptedData = await encryptionService.decryptUserData(ctx.user.id, input.encryptedData);
        
        return { decryptedData };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to decrypt user data: ${error.message}`,
        });
      }
    }),

  // ============================================
  // FIELD-SPECIFIC ENCRYPTION
  // ============================================

  encryptSensitiveFields: praxisProcedure
    .input(z.object({
      content: z.string().optional(),
      notes: z.string().optional(),
      apiKeys: z.record(z.string()).optional(),
      personalData: z.record(z.any()).optional(),
    }))
    .output(z.object({
      content_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      notes_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      api_keys_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      personal_data_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        return await encryptionService.encryptSensitiveFields(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to encrypt sensitive fields: ${error.message}`,
        });
      }
    }),

  decryptSensitiveFields: praxisProcedure
    .input(z.object({
      content_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      notes_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      api_keys_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
      personal_data_encrypted: z.object({
        encrypted: z.string(),
        iv: z.string(),
      }).optional(),
    }))
    .output(z.object({
      content: z.string().optional(),
      notes: z.string().optional(),
      apiKeys: z.record(z.string()).optional(),
      personalData: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const encryptionService = createEncryptionService(ctx.supabase);
        return await encryptionService.decryptSensitiveFields(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to decrypt sensitive fields: ${error.message}`,
        });
      }
    }),

  // ============================================
  // API KEY MANAGEMENT
  // ============================================

  storeAPIKey: praxisProcedure
    .input(z.object({
      service: z.string(),
      apiKey: z.string().min(1),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.aiSecurityService.storeEncryptedAPIKey(ctx.user.id, input.service, input.apiKey);
        
        return {
          success: true,
          message: `API key for ${input.service} stored securely`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to store API key: ${error.message}`,
        });
      }
    }),

  getAPIKey: praxisProcedure
    .input(z.object({
      service: z.string(),
    }))
    .output(z.object({
      apiKey: z.string().optional(),
      hasKey: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const apiKey = await ctx.aiSecurityService.getDecryptedAPIKey(ctx.user.id, input.service);
        
        return {
          apiKey: apiKey || undefined,
          hasKey: !!apiKey,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to retrieve API key: ${error.message}`,
        });
      }
    }),

  deleteAPIKey: praxisProcedure
    .input(z.object({
      service: z.string(),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { error } = await ctx.supabase
          .from('profiles')
          .update({
            [`${input.service}_api_key_encrypted`]: null,
            [`${input.service}_api_key_iv`]: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', ctx.user.id);

        if (error) {
          throw new Error(`Failed to delete API key: ${error.message}`);
        }

        return {
          success: true,
          message: `API key for ${input.service} deleted`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete API key: ${error.message}`,
        });
      }
    }),
});
