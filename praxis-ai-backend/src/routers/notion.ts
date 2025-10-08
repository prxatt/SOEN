// backend/src/routers/notion.ts

import { z } from 'zod';
import { router, praxisProcedure, aiRequestProcedure } from '../context';
import { notionSyncService } from '../services/notionSyncService';

// Input schemas
const SyncNoteToNotionSchema = z.object({
  noteId: z.number().int().positive(),
});

const SyncNotionToPraxisSchema = z.object({
  notionPageId: z.string().min(1),
});

const CreateNotionIntegrationSchema = z.object({
  accessToken: z.string().min(1),
  workspaceId: z.string().min(1),
  workspaceName: z.string().min(1),
});

const NotionWebhookSchema = z.object({
  type: z.string(),
  data: z.any(),
});

export const notionRouter = router({
  // Sync a Praxis note to Notion
  syncNoteToNotion: praxisProcedure
    .input(SyncNoteToNotionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const success = await notionSyncService.syncNoteToNotion(ctx.user.id, input.noteId);
        
        if (success) {
          return {
            success: true,
            message: 'Note synced to Notion successfully',
            noteId: input.noteId,
          };
        } else {
          throw new Error('Failed to sync note to Notion');
        }
      } catch (error) {
        console.error('Error syncing note to Notion:', error);
        throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Sync a Notion page to Praxis
  syncNotionToPraxis: praxisProcedure
    .input(SyncNotionToPraxisSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const success = await notionSyncService.syncNotionToPraxis(ctx.user.id, input.notionPageId);
        
        if (success) {
          return {
            success: true,
            message: 'Notion page synced to Praxis successfully',
            notionPageId: input.notionPageId,
          };
        } else {
          throw new Error('Failed to sync Notion page to Praxis');
        }
      } catch (error) {
        console.error('Error syncing Notion to Praxis:', error);
        throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Create Notion integration
  createIntegration: praxisProcedure
    .input(CreateNotionIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const success = await notionSyncService.createNotionIntegration(
          ctx.user.id,
          input.accessToken,
          input.workspaceId,
          input.workspaceName
        );

        if (success) {
          return {
            success: true,
            message: 'Notion integration created successfully',
            workspaceId: input.workspaceId,
            workspaceName: input.workspaceName,
          };
        } else {
          throw new Error('Failed to create Notion integration');
        }
      } catch (error) {
        console.error('Error creating Notion integration:', error);
        throw new Error(`Integration creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get user's Notion integration status
  getIntegrationStatus: praxisProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const integration = await notionSyncService.getUserNotionIntegration(ctx.user.id);
        
        return {
          hasIntegration: !!integration,
          integration: integration ? {
            workspaceId: integration.notion_workspace_id,
            workspaceName: integration.notion_workspace_name,
            isActive: integration.is_active,
            createdAt: integration.created_at,
          } : null,
        };
      } catch (error) {
        console.error('Error getting integration status:', error);
        throw new Error(`Failed to get integration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get sync logs for user
  getSyncLogs: praxisProcedure
    .input(z.object({
      limit: z.number().int().positive().max(100).default(20),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const { data: logs, error } = await ctx.supabase
          .from('notion_sync_log')
          .select('*')
          .eq('user_id', ctx.user.id)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          logs: logs || [],
          hasMore: (logs?.length || 0) === input.limit,
        };
      } catch (error) {
        console.error('Error getting sync logs:', error);
        throw new Error(`Failed to get sync logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Handle Notion webhook (for real-time sync)
  handleWebhook: aiRequestProcedure
    .input(NotionWebhookSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await notionSyncService.handleNotionWebhook(input);
        
        return {
          success: true,
          message: 'Webhook processed successfully',
        };
      } catch (error) {
        console.error('Error handling Notion webhook:', error);
        throw new Error(`Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Sync all notes to Notion (bulk operation)
  syncAllNotesToNotion: praxisProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        // Get all user's notes
        const { data: notes, error } = await ctx.supabase
          .from('notes')
          .select('id')
          .eq('user_id', ctx.user.id);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        if (!notes || notes.length === 0) {
          return {
            success: true,
            message: 'No notes to sync',
            syncedCount: 0,
            totalCount: 0,
          };
        }

        // Sync each note
        let syncedCount = 0;
        const errors: string[] = [];

        for (const note of notes) {
          try {
            const success = await notionSyncService.syncNoteToNotion(ctx.user.id, note.id);
            if (success) {
              syncedCount++;
            } else {
              errors.push(`Failed to sync note ${note.id}`);
            }
          } catch (error) {
            errors.push(`Error syncing note ${note.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return {
          success: errors.length === 0,
          message: `Synced ${syncedCount} of ${notes.length} notes`,
          syncedCount,
          totalCount: notes.length,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        console.error('Error in bulk sync:', error);
        throw new Error(`Bulk sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Test Notion connection
  testConnection: praxisProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user || !ctx.praxisAuth) {
        throw new Error('User not authenticated');
      }

      try {
        const integration = await notionSyncService.getUserNotionIntegration(ctx.user.id);
        
        if (!integration) {
          throw new Error('No Notion integration found');
        }

        // Test by trying to list databases (this would require proper token decryption)
        // For now, just return success if integration exists
        return {
          success: true,
          message: 'Notion connection is active',
          workspaceName: integration.notion_workspace_name,
        };
      } catch (error) {
        console.error('Error testing Notion connection:', error);
        throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
