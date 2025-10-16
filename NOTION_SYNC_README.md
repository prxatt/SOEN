# Notion Real-Time Sync Implementation

This implementation provides real-time synchronization between Soen notes and Notion pages, allowing users to seamlessly work with their notes across both platforms.

## Features

- **Bidirectional Sync**: Sync notes from Soen to Notion and vice versa
- **HTML to Notion Blocks Conversion**: Converts rich HTML content to Notion's block format
- **Database Management**: Automatically creates and manages Notion databases
- **Sync Logging**: Comprehensive logging of all sync operations
- **Error Handling**: Robust error handling with detailed error messages
- **Integration Setup**: Easy setup process for Notion API integration

## Files Created

### 1. `services/notionSyncService.ts`
The main service that handles all Notion synchronization logic:

- **NotionSyncService Class**: Core service with methods for:
  - `syncNoteToNotion()`: Sync Soen notes to Notion
  - `syncNotionToSoen()`: Sync Notion pages to Soen
  - `setupNotionIntegration()`: Setup user's Notion integration
  - `getSyncStatus()`: Get sync history and status

- **HTML Conversion**: 
  - `htmlToNotionBlocks()`: Converts HTML to Notion block format
  - `notionBlocksToHtml()`: Converts Notion blocks back to HTML

- **Database Management**:
  - `getOrCreateDatabase()`: Creates Notion databases for notebooks
  - `createNotionPage()`: Creates new Notion pages
  - `updateNotionPage()`: Updates existing Notion pages

### 2. `components/NotionSyncWidget.tsx`
React component for the Notion sync interface:

- **Setup Interface**: Form for entering Notion API key and workspace ID
- **Sync Controls**: Button to trigger sync operations
- **Status Display**: Shows connection status and sync history
- **Error Handling**: User-friendly error messages

### 3. `types.ts` Updates
Added Notion-related TypeScript interfaces:

- `NotionIntegration`: User's Notion integration settings
- `NotionSyncLog`: Sync operation logging
- `NotionDatabase`, `NotionPage`, `NotionBlock`: Notion API types
- Updated `Note` interface with `notion_page_id` field

## Database Schema Requirements

The implementation expects the following Supabase tables:

### `notion_integrations`
```sql
CREATE TABLE notion_integrations (
  user_id TEXT PRIMARY KEY,
  notion_api_key TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  default_database_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `notion_sync_log`
```sql
CREATE TABLE notion_sync_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  note_id INTEGER NOT NULL,
  notion_page_id TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('soen_to_notion', 'notion_to_soen')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `notes` table update
```sql
ALTER TABLE notes ADD COLUMN notion_page_id TEXT;
```

## Usage

### 1. Setup Notion Integration

```typescript
import { notionSyncService } from '../services/notionSyncService';

// Setup integration for a user
const success = await notionSyncService.setupNotionIntegration(
  userId,
  notionApiKey,
  workspaceId
);
```

### 2. Sync Note to Notion

```typescript
// Sync a specific note to Notion
const success = await notionSyncService.syncNoteToNotion(userId, noteId);
```

### 3. Use the Widget Component

```tsx
import { NotionSyncWidget } from '../components/NotionSyncWidget';

<NotionSyncWidget
  userId={currentUserId}
  noteId={selectedNote.id}
  onSyncComplete={(success) => {
    if (success) {
      console.log('Sync successful!');
    } else {
      console.log('Sync failed');
    }
  }}
/>
```

## Notion API Setup

1. **Create Notion Integration**:
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the integration token

2. **Get Workspace ID**:
   - In Notion, go to Settings & Members
   - Copy the workspace ID from the URL

3. **Grant Permissions**:
   - Share your Notion pages/databases with the integration
   - The integration needs read/write access

## HTML to Notion Blocks Conversion

The service converts HTML elements to Notion blocks:

- `<h1>`, `<h2>`, `<h3>` → `heading_1`, `heading_2`, `heading_3`
- `<p>` → `paragraph`
- `<ul>`, `<li>` → `bulleted_list_item`
- `<ol>`, `<li>` → `numbered_list_item`
- `<blockquote>` → `quote`
- `<code>` → `code`

## Error Handling

The service includes comprehensive error handling:

- **API Key Validation**: Tests Notion API key before saving
- **Sync Error Logging**: Logs all sync attempts with error details
- **Graceful Fallbacks**: Falls back to simple text blocks if HTML parsing fails
- **User Feedback**: Provides clear error messages to users

## Security Considerations

- **API Key Storage**: Notion API keys are stored securely in the database
- **User Isolation**: Each user's integration is isolated
- **Error Sanitization**: Error messages are sanitized before logging
- **Rate Limiting**: Consider implementing rate limiting for Notion API calls

## Future Enhancements

- **Real-time Webhooks**: Implement Notion webhooks for real-time sync
- **Conflict Resolution**: Handle conflicts when both platforms are modified
- **Batch Sync**: Sync multiple notes at once
- **Selective Sync**: Allow users to choose which notes to sync
- **Sync Scheduling**: Automatic periodic sync
- **Rich Media Support**: Support for images, files, and other media

## Testing

To test the implementation:

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test full sync workflows
3. **Error Scenarios**: Test with invalid API keys, network failures
4. **HTML Conversion**: Test various HTML structures

## Dependencies

- `@notionhq/client`: Official Notion API client
- `react`: For the UI component
- `typescript`: For type safety

## Environment Variables

Add to your environment:

```env
NOTION_API_KEY=your_notion_integration_token
```

Note: In production, each user will have their own Notion API key stored in the database.
