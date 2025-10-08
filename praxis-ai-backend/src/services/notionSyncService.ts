// backend/src/services/notion-sync.service.ts

import { Client } from '@notionhq/client';
import { createSupabaseClient } from '../context';

export interface NotionIntegration {
  id: string;
  user_id: string;
  notion_workspace_id: string;
  notion_workspace_name: string;
  access_token_encrypted: string;
  access_token_iv: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotionSyncLog {
  id: string;
  user_id: string;
  note_id?: number;
  notion_page_id?: string;
  sync_direction: 'praxis_to_notion' | 'notion_to_praxis';
  sync_status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

export interface NotionBlock {
  type: string;
  [key: string]: any;
}

export class NotionSyncService {
  private notion: Client;
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.supabase = createSupabaseClient();
  }

  // ============================================
  // MAIN SYNC METHODS
  // ============================================

  async syncNoteToNotion(userId: string, noteId: number): Promise<boolean> {
    try {
      // Get note data
      const { data: note, error: noteError } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single();

      if (noteError || !note) {
        throw new Error(`Note not found: ${noteError?.message}`);
      }

      // Get user's Notion integration
      const integration = await this.getUserNotionIntegration(userId);
      if (!integration) {
        throw new Error('No active Notion integration found');
      }

      // Get or create Notion database for this notebook
      const notionDatabaseId = await this.getOrCreateDatabase(userId, note.notebook_id, integration);

      // Convert HTML content to Notion blocks
      const blocks = await this.htmlToNotionBlocks(note.content);

      if (note.notion_page_id) {
        // Update existing page
        await this.updateNotionPage(note.notion_page_id, note, blocks, integration);
      } else {
        // Create new page
        const page = await this.createNotionPage(notionDatabaseId, note, blocks, integration);
        
        // Save Notion page ID back to Praxis
        await this.supabase
          .from('notes')
          .update({ notion_page_id: page.id })
          .eq('id', noteId);
      }

      // Log successful sync
      await this.logSync(userId, noteId, note.notion_page_id, 'praxis_to_notion', 'success');

      return true;
    } catch (error) {
      console.error('Error syncing note to Notion:', error);
      await this.logSync(userId, noteId, undefined, 'praxis_to_notion', 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async syncNotionToPraxis(userId: string, notionPageId: string): Promise<boolean> {
    try {
      const integration = await this.getUserNotionIntegration(userId);
      if (!integration) {
        throw new Error('No active Notion integration found');
      }

      // Get Notion page data
      const page = await this.notion.pages.retrieve({ page_id: notionPageId });
      const blocks = await this.notion.blocks.children.list({ block_id: notionPageId });

      // Convert Notion blocks to HTML
      const htmlContent = await this.notionBlocksToHtml(blocks.results as NotionBlock[]);

      // Extract title and properties
      const title = this.extractNotionPageTitle(page);
      const tags = this.extractNotionPageTags(page);

      // Find or create corresponding note in Praxis
      const { data: existingNote } = await this.supabase
        .from('notes')
        .select('*')
        .eq('notion_page_id', notionPageId)
        .eq('user_id', userId)
        .single();

      if (existingNote) {
        // Update existing note
        await this.supabase
          .from('notes')
          .update({
            title,
            content: htmlContent,
            tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id);
      } else {
        // Create new note
        await this.supabase
          .from('notes')
          .insert({
            user_id: userId,
            notebook_id: 1, // Default notebook - could be improved
            title,
            content: htmlContent,
            tags,
            notion_page_id: notionPageId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Log successful sync
      await this.logSync(userId, undefined, notionPageId, 'notion_to_praxis', 'success');

      return true;
    } catch (error) {
      console.error('Error syncing Notion to Praxis:', error);
      await this.logSync(userId, undefined, notionPageId, 'notion_to_praxis', 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // ============================================
  // NOTION INTEGRATION MANAGEMENT
  // ============================================

  async getUserNotionIntegration(userId: string): Promise<NotionIntegration | null> {
    const { data: integration, error } = await this.supabase
      .from('notion_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !integration) {
      return null;
    }

    return integration;
  }

  async createNotionIntegration(userId: string, accessToken: string, workspaceId: string, workspaceName: string): Promise<boolean> {
    try {
      // Encrypt the access token
      const { encrypted, iv } = await this.encryptAccessToken(accessToken);

      const { error } = await this.supabase
        .from('notion_integrations')
        .insert({
          user_id: userId,
          notion_workspace_id: workspaceId,
          notion_workspace_name: workspaceName,
          access_token_encrypted: encrypted,
          access_token_iv: iv,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error creating Notion integration:', error);
      return false;
    }
  }

  // ============================================
  // NOTION DATABASE MANAGEMENT
  // ============================================

  private async getOrCreateDatabase(userId: string, notebookId: number, integration: NotionIntegration): Promise<string> {
    try {
      // Check if database already exists for this notebook
      const { data: existingDb } = await this.supabase
        .from('notion_databases')
        .select('notion_database_id')
        .eq('user_id', userId)
        .eq('notebook_id', notebookId)
        .single();

      if (existingDb) {
        return existingDb.notion_database_id;
      }

      // Create new database in Notion
      const database = await this.notion.databases.create({
        parent: { type: 'page_id', page_id: integration.notion_workspace_id },
        title: [{ type: 'text', text: { content: `Praxis Notebook ${notebookId}` } }],
        properties: {
          title: { title: {} },
          tags: { multi_select: {} },
          created_at: { created_time: {} },
          updated_at: { last_edited_time: {} }
        }
      });

      // Save database reference
      await this.supabase
        .from('notion_databases')
        .insert({
          user_id: userId,
          notebook_id: notebookId,
          notion_database_id: database.id,
          created_at: new Date().toISOString()
        });

      return database.id;
    } catch (error) {
      console.error('Error creating Notion database:', error);
      throw error;
    }
  }

  // ============================================
  // NOTION PAGE OPERATIONS
  // ============================================

  private async createNotionPage(databaseId: string, note: any, blocks: NotionBlock[], integration: NotionIntegration): Promise<any> {
    const page = await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ text: { content: note.title } }] },
        tags: { multi_select: note.tags.map((tag: string) => ({ name: tag })) },
        created_at: { created_time: note.created_at },
        updated_at: { last_edited_time: note.updated_at }
      },
      children: blocks
    });

    return page;
  }

  private async updateNotionPage(pageId: string, note: any, blocks: NotionBlock[], integration: NotionIntegration): Promise<void> {
    // Update page properties
    await this.notion.pages.update({
      page_id: pageId,
      properties: {
        title: { title: [{ text: { content: note.title } }] },
        tags: { multi_select: note.tags.map((tag: string) => ({ name: tag })) },
        updated_at: { last_edited_time: new Date().toISOString() }
      }
    });

    // Clear existing content and add new blocks
    const existingBlocks = await this.notion.blocks.children.list({ block_id: pageId });
    for (const block of existingBlocks.results) {
      await this.notion.blocks.delete({ block_id: block.id });
    }

    // Add new content
    if (blocks.length > 0) {
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: blocks
      });
    }
  }

  // ============================================
  // HTML TO NOTION BLOCKS CONVERSION
  // ============================================

  private async htmlToNotionBlocks(html: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    
    // Simple HTML parser - in production, use a proper HTML parser
    const lines = html.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('<h1>')) {
        blocks.push({
          type: 'heading_1',
          heading_1: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<h2>')) {
        blocks.push({
          type: 'heading_2',
          heading_2: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<h3>')) {
        blocks.push({
          type: 'heading_3',
          heading_3: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<ul>') || trimmedLine.startsWith('<li>')) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<ol>')) {
        blocks.push({
          type: 'numbered_list_item',
          numbered_list_item: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<blockquote>')) {
        blocks.push({
          type: 'quote',
          quote: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      } else if (trimmedLine.startsWith('<code>')) {
        blocks.push({
          type: 'code',
          code: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }],
            language: 'plain text'
          }
        });
      } else if (trimmedLine.length > 0) {
        blocks.push({
          type: 'paragraph',
          paragraph: { 
            rich_text: [{ text: { content: this.stripHtmlTags(trimmedLine) } }] 
          }
        });
      }
    }

    return blocks;
  }

  // ============================================
  // NOTION BLOCKS TO HTML CONVERSION
  // ============================================

  private async notionBlocksToHtml(blocks: NotionBlock[]): Promise<string> {
    const htmlParts: string[] = [];

    for (const block of blocks) {
      switch (block.type) {
        case 'heading_1':
          htmlParts.push(`<h1>${this.extractRichText(block.heading_1?.rich_text)}</h1>`);
          break;
        case 'heading_2':
          htmlParts.push(`<h2>${this.extractRichText(block.heading_2?.rich_text)}</h2>`);
          break;
        case 'heading_3':
          htmlParts.push(`<h3>${this.extractRichText(block.heading_3?.rich_text)}</h3>`);
          break;
        case 'paragraph':
          htmlParts.push(`<p>${this.extractRichText(block.paragraph?.rich_text)}</p>`);
          break;
        case 'bulleted_list_item':
          htmlParts.push(`<li>${this.extractRichText(block.bulleted_list_item?.rich_text)}</li>`);
          break;
        case 'numbered_list_item':
          htmlParts.push(`<li>${this.extractRichText(block.numbered_list_item?.rich_text)}</li>`);
          break;
        case 'quote':
          htmlParts.push(`<blockquote>${this.extractRichText(block.quote?.rich_text)}</blockquote>`);
          break;
        case 'code':
          htmlParts.push(`<code>${this.extractRichText(block.code?.rich_text)}</code>`);
          break;
        default:
          // Handle other block types as paragraphs
          htmlParts.push(`<p>${JSON.stringify(block)}</p>`);
      }
    }

    return htmlParts.join('\n');
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private extractRichText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.text?.content || '').join('');
  }

  private extractNotionPageTitle(page: any): string {
    const titleProperty = page.properties?.title || page.properties?.Name;
    if (titleProperty?.title) {
      return this.extractRichText(titleProperty.title);
    }
    return 'Untitled';
  }

  private extractNotionPageTags(page: any): string[] {
    const tagsProperty = page.properties?.tags || page.properties?.Tags;
    if (tagsProperty?.multi_select) {
      return tagsProperty.multi_select.map((tag: any) => tag.name);
    }
    return [];
  }

  private async encryptAccessToken(token: string): Promise<{ encrypted: string; iv: string }> {
    // This would use the encryption service
    // For now, return placeholder values
    return {
      encrypted: Buffer.from(token).toString('base64'),
      iv: 'placeholder-iv'
    };
  }

  private async logSync(
    userId: string, 
    noteId?: number, 
    notionPageId?: string, 
    direction: 'praxis_to_notion' | 'notion_to_praxis',
    status: 'success' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<void> {
    await this.supabase
      .from('notion_sync_log')
      .insert({
        user_id: userId,
        note_id: noteId,
        notion_page_id: notionPageId,
        sync_direction: direction,
        sync_status: status,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });
  }

  // ============================================
  // WEBHOOK HANDLING
  // ============================================

  async handleNotionWebhook(payload: any): Promise<void> {
    try {
      const { type, data } = payload;
      
      if (type === 'page.updated' || type === 'page.created') {
        const pageId = data.id;
        
        // Find the user who owns this page
        const { data: integration } = await this.supabase
          .from('notion_integrations')
          .select('user_id')
          .eq('notion_workspace_id', data.parent.database_id)
          .single();

        if (integration) {
          await this.syncNotionToPraxis(integration.user_id, pageId);
        }
      }
    } catch (error) {
      console.error('Error handling Notion webhook:', error);
    }
  }
}

export const notionSyncService = new NotionSyncService();
