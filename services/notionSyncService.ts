import { Client } from '@notionhq/client';
import { Note, Notebook, NotionIntegration, NotionSyncLog, NotionDatabase, NotionPage, NotionBlock } from '../types';

class NotionSyncService {
  private notion: Client | null = null;
  private supabase: any = null; // Will be injected

  constructor() {
    // Initialize Supabase client (this would be injected in a real implementation)
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    // In a real implementation, this would initialize the Supabase client
    // For now, we'll use a placeholder
    this.supabase = {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
        })
      })
    };
  }

  async initializeNotionClient(apiKey: string): Promise<void> {
    try {
      this.notion = new Client({ auth: apiKey });
      // Test the connection
      await this.notion.users.me();
    } catch (error) {
      console.error('Failed to initialize Notion client:', error);
      throw new Error('Invalid Notion API key');
    }
  }

  async syncNoteToNotion(userId: string, noteId: number): Promise<boolean> {
    if (!this.notion) {
      throw new Error('Notion client not initialized');
    }

    try {
      // Get note data
      const { data: note, error: noteError } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (noteError || !note) {
        throw new Error(`Note not found: ${noteError?.message}`);
      }

      // Get user's Notion integration
      const { data: integration, error: integrationError } = await this.supabase
        .from('notion_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        throw new Error(`Notion integration not found: ${integrationError?.message}`);
      }

      // Initialize Notion client with user's API key
      await this.initializeNotionClient(integration.notion_api_key);

      // Get or create Notion database for this notebook
      const notionDatabaseId = await this.getOrCreateDatabase(userId, note.notebook_id, integration);

      // Convert HTML content to Notion blocks
      const blocks = this.htmlToNotionBlocks(note.content);

      if (note.notion_page_id) {
        // Update existing page
        await this.updateNotionPage(note.notion_page_id, note, blocks);
      } else {
        // Create new page
        const page = await this.createNotionPage(notionDatabaseId, note, blocks);
        
        // Save Notion page ID to note
        await this.supabase
          .from('notes')
          .update({ notion_page_id: page.id })
          .eq('id', noteId);
      }

      // Log successful sync
      await this.logSync({
        user_id: userId,
        note_id: noteId,
        notion_page_id: note.notion_page_id,
        sync_direction: 'soen_to_notion',
        sync_status: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error syncing note to Notion:', error);
      
      // Log failed sync
      await this.logSync({
        user_id: userId,
        note_id: noteId,
        sync_direction: 'soen_to_notion',
        sync_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  async syncNotionToSoen(userId: string, notionPageId: string): Promise<boolean> {
    if (!this.notion) {
      throw new Error('Notion client not initialized');
    }

    try {
      // Get Notion page
      const page = await this.notion.pages.retrieve({ page_id: notionPageId });
      
      // Get page blocks
      const blocks = await this.notion.blocks.children.list({
        block_id: notionPageId
      });

      // Convert Notion blocks to HTML
      const htmlContent = this.notionBlocksToHtml(blocks.results as NotionBlock[]);

      // Extract title from page properties
      const title = this.extractTitleFromNotionPage(page as any);

      // Create or update note in Soen
      const { data: existingNote } = await this.supabase
        .from('notes')
        .select('*')
        .eq('notion_page_id', notionPageId)
        .single();

      if (existingNote) {
        // Update existing note
        await this.supabase
          .from('notes')
          .update({
            title,
            content: htmlContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id);
      } else {
        // Create new note
        await this.supabase
          .from('notes')
          .insert({
            title,
            content: htmlContent,
            notebook_id: 1, // Default notebook
            notion_page_id: notionPageId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Log successful sync
      await this.logSync({
        user_id: userId,
        note_id: existingNote?.id || 0,
        notion_page_id: notionPageId,
        sync_direction: 'notion_to_soen',
        sync_status: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error syncing Notion to Soen:', error);
      
      // Log failed sync
      await this.logSync({
        user_id: userId,
        notion_page_id: notionPageId,
        sync_direction: 'notion_to_soen',
        sync_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  private async getOrCreateDatabase(userId: string, notebookId: number, integration: NotionIntegration): Promise<string> {
    if (!this.notion) {
      throw new Error('Notion client not initialized');
    }

    try {
      // Check if user has a default database
      if (integration.default_database_id) {
        return integration.default_database_id;
      }

      // Get notebook info
      const { data: notebook } = await this.supabase
        .from('notebooks')
        .select('*')
        .eq('id', notebookId)
        .single();

      const databaseTitle = notebook?.title || `Soen Notes - Notebook ${notebookId}`;

      // Create new database
      const database = await this.notion.databases.create({
        parent: { type: 'page_id', page_id: integration.workspace_id },
        title: [{ type: 'text', text: { content: databaseTitle } }],
        properties: {
          title: {
            title: {}
          },
          tags: {
            multi_select: {}
          },
          created_at: {
            created_time: {}
          },
          updated_at: {
            last_edited_time: {}
          }
        }
      });

      // Update integration with new database ID
      await this.supabase
        .from('notion_integrations')
        .update({ default_database_id: database.id })
        .eq('user_id', userId);

      return database.id;
    } catch (error) {
      console.error('Error creating Notion database:', error);
      throw error;
    }
  }

  private async createNotionPage(databaseId: string, note: Note, blocks: NotionBlock[]): Promise<NotionPage> {
    if (!this.notion) {
      throw new Error('Notion client not initialized');
    }

    return await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: { 
          title: [{ text: { content: note.title } }] 
        },
        tags: { 
          multi_select: note.tags.map(tag => ({ name: tag })) 
        }
      },
      children: blocks
    }) as NotionPage;
  }

  private async updateNotionPage(pageId: string, note: Note, blocks: NotionBlock[]): Promise<void> {
    if (!this.notion) {
      throw new Error('Notion client not initialized');
    }

    // Update page properties
    await this.notion.pages.update({
      page_id: pageId,
      properties: {
        title: { title: [{ text: { content: note.title } }] },
        tags: { multi_select: note.tags.map(tag => ({ name: tag })) }
      }
    });

    // Clear existing content and add new blocks
    const existingBlocks = await this.notion.blocks.children.list({
      block_id: pageId
    });

    // Delete existing blocks
    for (const block of existingBlocks.results) {
      await this.notion.blocks.delete({
        block_id: block.id
      });
    }

    // Add new blocks
    if (blocks.length > 0) {
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: blocks
      });
    }
  }

  private htmlToNotionBlocks(html: string): NotionBlock[] {
    const blocks: NotionBlock[] = [];
    
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const processNode = (node: ChildNode): void => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) {
            blocks.push({
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: text } }]
              }
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          switch (element.tagName.toLowerCase()) {
            case 'h1':
              blocks.push({
                type: 'heading_1',
                heading_1: {
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            case 'h2':
              blocks.push({
                type: 'heading_2',
                heading_2: {
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            case 'h3':
              blocks.push({
                type: 'heading_3',
                heading_3: {
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            case 'p':
              blocks.push({
                type: 'paragraph',
                paragraph: {
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            case 'ul':
              const listItems = Array.from(element.children).filter(child => 
                child.tagName.toLowerCase() === 'li'
              );
              listItems.forEach(item => {
                blocks.push({
                  type: 'bulleted_list_item',
                  bulleted_list_item: {
                    rich_text: [{ text: { content: item.textContent || '' } }]
                  }
                });
              });
              break;
            case 'ol':
              const orderedItems = Array.from(element.children).filter(child => 
                child.tagName.toLowerCase() === 'li'
              );
              orderedItems.forEach((item, index) => {
                blocks.push({
                  type: 'numbered_list_item',
                  numbered_list_item: {
                    rich_text: [{ text: { content: item.textContent || '' } }]
                  }
                });
              });
              break;
            case 'blockquote':
              blocks.push({
                type: 'quote',
                quote: {
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            case 'code':
              blocks.push({
                type: 'code',
                code: {
                  language: 'plain text',
                  rich_text: [{ text: { content: element.textContent || '' } }]
                }
              });
              break;
            default:
              // For other elements, process children
              Array.from(element.childNodes).forEach(processNode);
              break;
          }
        }
      };

      // Process all child nodes
      Array.from(doc.body.childNodes).forEach(processNode);

      // If no blocks were created, create a default paragraph
      if (blocks.length === 0) {
        blocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: html.replace(/<[^>]*>/g, '') || 'Empty note' } }]
          }
        });
      }

    } catch (error) {
      console.error('Error converting HTML to Notion blocks:', error);
      // Fallback: create a simple paragraph block
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: html.replace(/<[^>]*>/g, '') || 'Empty note' } }]
        }
      });
    }

    return blocks;
  }

  private notionBlocksToHtml(blocks: NotionBlock[]): string {
    let html = '';

    blocks.forEach(block => {
      switch (block.type) {
        case 'heading_1':
          html += `<h1>${this.extractTextFromRichText(block.heading_1?.rich_text)}</h1>`;
          break;
        case 'heading_2':
          html += `<h2>${this.extractTextFromRichText(block.heading_2?.rich_text)}</h2>`;
          break;
        case 'heading_3':
          html += `<h3>${this.extractTextFromRichText(block.heading_3?.rich_text)}</h3>`;
          break;
        case 'paragraph':
          html += `<p>${this.extractTextFromRichText(block.paragraph?.rich_text)}</p>`;
          break;
        case 'bulleted_list_item':
          html += `<li>${this.extractTextFromRichText(block.bulleted_list_item?.rich_text)}</li>`;
          break;
        case 'numbered_list_item':
          html += `<li>${this.extractTextFromRichText(block.numbered_list_item?.rich_text)}</li>`;
          break;
        case 'quote':
          html += `<blockquote>${this.extractTextFromRichText(block.quote?.rich_text)}</blockquote>`;
          break;
        case 'code':
          html += `<code>${this.extractTextFromRichText(block.code?.rich_text)}</code>`;
          break;
        default:
          // For unknown block types, try to extract text
          const text = this.extractTextFromBlock(block);
          if (text) {
            html += `<p>${text}</p>`;
          }
          break;
      }
    });

    return html;
  }

  private extractTextFromRichText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    
    return richText
      .map(item => item.text?.content || '')
      .join('');
  }

  private extractTextFromBlock(block: NotionBlock): string {
    // Try to extract text from various block properties
    const properties = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'quote', 'code'];
    
    for (const prop of properties) {
      if (block[prop]?.rich_text) {
        return this.extractTextFromRichText(block[prop].rich_text);
      }
    }
    
    return '';
  }

  private extractTitleFromNotionPage(page: any): string {
    const titleProperty = page.properties?.title || page.properties?.Name;
    if (titleProperty?.title) {
      return this.extractTextFromRichText(titleProperty.title);
    }
    return 'Untitled Note';
  }

  private async logSync(logData: Omit<NotionSyncLog, 'created_at'>): Promise<void> {
    try {
      await this.supabase
        .from('notion_sync_log')
        .insert({
          ...logData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  // Public methods for integration
  async setupNotionIntegration(userId: string, apiKey: string, workspaceId: string): Promise<boolean> {
    try {
      // Test the API key
      const testClient = new Client({ auth: apiKey });
      await testClient.users.me();

      // Save integration
      await this.supabase
        .from('notion_integrations')
        .insert({
          user_id: userId,
          notion_api_key: apiKey,
          workspace_id: workspaceId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Error setting up Notion integration:', error);
      return false;
    }
  }

  async getSyncStatus(userId: string): Promise<NotionSyncLog[]> {
    try {
      const { data } = await this.supabase
        .from('notion_sync_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return data || [];
    } catch (error) {
      console.error('Error getting sync status:', error);
      return [];
    }
  }
}

export const notionSyncService = new NotionSyncService();
