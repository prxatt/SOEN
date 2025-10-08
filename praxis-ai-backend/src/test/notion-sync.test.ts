// backend/src/test/notion-sync.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { notionSyncService } from '../services/notionSyncService';

// Mock dependencies
vi.mock('@notionhq/client', () => ({
  Client: vi.fn().mockImplementation(() => ({
    pages: {
      create: vi.fn(),
      update: vi.fn(),
      retrieve: vi.fn(),
    },
    blocks: {
      children: {
        list: vi.fn(),
        append: vi.fn(),
      },
      delete: vi.fn(),
    },
    databases: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('../context', () => ({
  createSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

describe('NotionSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncNoteToNotion', () => {
    it('should successfully sync a note to Notion', async () => {
      // Mock note data
      const mockNote = {
        id: 1,
        user_id: 'user-123',
        notebook_id: 1,
        title: 'Test Note',
        content: '<h1>Test Content</h1><p>This is a test note.</p>',
        tags: ['test', 'notion'],
        notion_page_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock integration data
      const mockIntegration = {
        id: 'integration-123',
        user_id: 'user-123',
        notion_workspace_id: 'workspace-123',
        notion_workspace_name: 'Test Workspace',
        access_token_encrypted: 'encrypted-token',
        access_token_iv: 'iv',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock Supabase responses
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      };

      // Mock getUserNotionIntegration
      vi.spyOn(notionSyncService, 'getUserNotionIntegration').mockResolvedValue(mockIntegration);

      // Mock getOrCreateDatabase
      vi.spyOn(notionSyncService as any, 'getOrCreateDatabase').mockResolvedValue('database-123');

      // Mock createNotionPage
      vi.spyOn(notionSyncService as any, 'createNotionPage').mockResolvedValue({ id: 'page-123' });

      // Mock logSync
      vi.spyOn(notionSyncService as any, 'logSync').mockResolvedValue(undefined);

      const result = await notionSyncService.syncNoteToNotion('user-123', 1);

      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock error case
      vi.spyOn(notionSyncService, 'getUserNotionIntegration').mockResolvedValue(null);

      const result = await notionSyncService.syncNoteToNotion('user-123', 1);

      expect(result).toBe(false);
    });
  });

  describe('syncNotionToPraxis', () => {
    it('should successfully sync a Notion page to Praxis', async () => {
      // Mock integration
      const mockIntegration = {
        id: 'integration-123',
        user_id: 'user-123',
        notion_workspace_id: 'workspace-123',
        notion_workspace_name: 'Test Workspace',
        access_token_encrypted: 'encrypted-token',
        access_token_iv: 'iv',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock Notion page data
      const mockPage = {
        id: 'page-123',
        properties: {
          title: {
            title: [{ text: { content: 'Notion Page Title' } }],
          },
          tags: {
            multi_select: [{ name: 'notion-tag' }],
          },
        },
      };

      const mockBlocks = [
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: 'Notion Heading' } }],
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'Notion paragraph content' } }],
          },
        },
      ];

      // Mock methods
      vi.spyOn(notionSyncService, 'getUserNotionIntegration').mockResolvedValue(mockIntegration);
      vi.spyOn(notionSyncService as any, 'notionBlocksToHtml').mockResolvedValue('<h1>Notion Heading</h1><p>Notion paragraph content</p>');
      vi.spyOn(notionSyncService as any, 'extractNotionPageTitle').mockReturnValue('Notion Page Title');
      vi.spyOn(notionSyncService as any, 'extractNotionPageTags').mockReturnValue(['notion-tag']);
      vi.spyOn(notionSyncService as any, 'logSync').mockResolvedValue(undefined);

      const result = await notionSyncService.syncNotionToPraxis('user-123', 'page-123');

      expect(result).toBe(true);
    });
  });

  describe('htmlToNotionBlocks', () => {
    it('should convert HTML to Notion blocks correctly', async () => {
      const html = `
        <h1>Main Heading</h1>
        <h2>Sub Heading</h2>
        <h3>Small Heading</h3>
        <p>This is a paragraph with <strong>bold text</strong>.</p>
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
        <blockquote>This is a quote</blockquote>
        <code>console.log('Hello World');</code>
      `;

      const blocks = await (notionSyncService as any).htmlToNotionBlocks(html);

      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].type).toBe('heading_1');
      expect(blocks[0].heading_1.rich_text[0].text.content).toBe('Main Heading');
      expect(blocks[1].type).toBe('heading_2');
      expect(blocks[2].type).toBe('heading_3');
      expect(blocks[3].type).toBe('paragraph');
      expect(blocks[4].type).toBe('bulleted_list_item');
      expect(blocks[5].type).toBe('quote');
      expect(blocks[6].type).toBe('code');
    });

    it('should handle empty HTML gracefully', async () => {
      const blocks = await (notionSyncService as any).htmlToNotionBlocks('');
      expect(blocks).toEqual([]);
    });
  });

  describe('notionBlocksToHtml', () => {
    it('should convert Notion blocks to HTML correctly', async () => {
      const blocks = [
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: 'Main Heading' } }],
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'This is a paragraph.' } }],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: 'List item' } }],
          },
        },
      ];

      const html = await (notionSyncService as any).notionBlocksToHtml(blocks);

      expect(html).toContain('<h1>Main Heading</h1>');
      expect(html).toContain('<p>This is a paragraph.</p>');
      expect(html).toContain('<li>List item</li>');
    });
  });

  describe('createNotionIntegration', () => {
    it('should create a new Notion integration', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      };

      // Mock encryptAccessToken
      vi.spyOn(notionSyncService as any, 'encryptAccessToken').mockResolvedValue({
        encrypted: 'encrypted-token',
        iv: 'iv',
      });

      const result = await notionSyncService.createNotionIntegration(
        'user-123',
        'access-token',
        'workspace-123',
        'Test Workspace'
      );

      expect(result).toBe(true);
    });
  });

  describe('handleNotionWebhook', () => {
    it('should handle page.updated webhook', async () => {
      const payload = {
        type: 'page.updated',
        data: {
          id: 'page-123',
          parent: {
            database_id: 'database-123',
          },
        },
      };

      // Mock getUserNotionIntegration
      vi.spyOn(notionSyncService, 'getUserNotionIntegration').mockResolvedValue({
        id: 'integration-123',
        user_id: 'user-123',
        notion_workspace_id: 'workspace-123',
        notion_workspace_name: 'Test Workspace',
        access_token_encrypted: 'encrypted-token',
        access_token_iv: 'iv',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // Mock syncNotionToPraxis
      vi.spyOn(notionSyncService, 'syncNotionToPraxis').mockResolvedValue(true);

      await notionSyncService.handleNotionWebhook(payload);

      expect(notionSyncService.syncNotionToPraxis).toHaveBeenCalledWith('user-123', 'page-123');
    });

    it('should handle unknown webhook types gracefully', async () => {
      const payload = {
        type: 'unknown.type',
        data: {},
      };

      // Should not throw an error
      await expect(notionSyncService.handleNotionWebhook(payload)).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should strip HTML tags correctly', () => {
      const html = '<h1>Title</h1><p>Content with <strong>bold</strong> text</p>';
      const result = (notionSyncService as any).stripHtmlTags(html);
      expect(result).toBe('TitleContent with bold text');
    });

    it('should extract rich text correctly', () => {
      const richText = [
        { text: { content: 'Hello' } },
        { text: { content: ' World' } },
      ];
      const result = (notionSyncService as any).extractRichText(richText);
      expect(result).toBe('Hello World');
    });

    it('should handle empty rich text', () => {
      const result = (notionSyncService as any).extractRichText([]);
      expect(result).toBe('');
    });

    it('should extract Notion page title correctly', () => {
      const page = {
        properties: {
          title: {
            title: [{ text: { content: 'Page Title' } }],
          },
        },
      };
      const result = (notionSyncService as any).extractNotionPageTitle(page);
      expect(result).toBe('Page Title');
    });

    it('should extract Notion page tags correctly', () => {
      const page = {
        properties: {
          tags: {
            multi_select: [
              { name: 'tag1' },
              { name: 'tag2' },
            ],
          },
        },
      };
      const result = (notionSyncService as any).extractNotionPageTags(page);
      expect(result).toEqual(['tag1', 'tag2']);
    });
  });
});
