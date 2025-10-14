# Gmail Agent Service

This implementation provides intelligent Gmail integration for Soen, featuring Mira as the AI assistant that automatically detects and extracts event information from emails.

## 🎯 **Service Overview**

The Gmail Agent Service enables Soen to:
- **Monitor Gmail** for new messages in real-time
- **Extract Event Information** using Mira's AI capabilities
- **Auto-create Tasks** for high-confidence events
- **Send Notifications** for user confirmation of detected events
- **Secure Token Storage** with encryption for Gmail credentials

## 🚀 **Key Features**

- ✅ **Real-time Gmail Monitoring** with push notifications and polling backup
- ✅ **Mira AI Event Extraction** from email content
- ✅ **Automatic Task Creation** for high-confidence events
- ✅ **Smart Notifications** with user confirmation options
- ✅ **Encrypted Token Storage** for security
- ✅ **Event Status Management** (pending, confirmed, rejected, auto_added)
- ✅ **Webhook Integration** for instant email processing

## 📋 **Database Schema**

### Gmail Integrations Table
```sql
CREATE TABLE gmail_integrations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  access_token_iv TEXT NOT NULL,
  refresh_token_iv TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  gmail_watch_expiration TIMESTAMP,
  gmail_history_id TEXT,
  watch_labels TEXT[] DEFAULT ARRAY['INBOX', 'UNREAD'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### Gmail Parsed Events Table
```sql
CREATE TABLE gmail_parsed_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMP NOT NULL,
  email_body_snippet TEXT,
  event_detected BOOLEAN NOT NULL,
  event_title TEXT,
  event_date TIMESTAMP,
  event_location TEXT,
  event_confidence DECIMAL(3,2) NOT NULL,
  extracted_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('auto_added', 'pending', 'confirmed', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, gmail_message_id)
);
```

### Notifications Table (if not exists)
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  action_label TEXT,
  action_data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **Usage Examples**

### Setup Gmail Integration
```typescript
import { gmailAgentService } from '../services/gmailAgentService';

// Setup integration with OAuth code
await gmailAgentService.setupGmailIntegration(
  userId,
  authCode
);
```

### Handle Gmail Webhook
```typescript
// Express.js webhook endpoint
app.post('/gmail-webhook', async (req, res) => {
  try {
    await gmailAgentService.handleGmailWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});
```

### Get Integration Status
```typescript
const status = await gmailAgentService.getGmailIntegrationStatus(userId);
if (status?.is_active) {
  console.log('Gmail integration is active');
  console.log('Watching labels:', status.watch_labels);
}
```

### Get Parsed Events
```typescript
const events = await gmailAgentService.getParsedEvents(userId, 20);
events.forEach(event => {
  if (event.event_detected) {
    console.log(`Event: ${event.event_title}`);
    console.log(`Date: ${event.event_date}`);
    console.log(`Confidence: ${event.event_confidence}`);
  }
});
```

### Confirm/Reject Events
```typescript
// User confirms an event
await gmailAgentService.confirmEvent(userId, gmailMessageId);

// User rejects an event
await gmailAgentService.rejectEvent(userId, gmailMessageId);
```

## 🔐 **Security Features**

### Token Encryption
- **AES-256-GCM Encryption** for access and refresh tokens
- **Unique IV per Token** for enhanced security
- **Secure Key Management** using Web Crypto API

### Privacy Protection
- **Encrypted Storage** of all sensitive data
- **User Isolation** - each user's data is separate
- **Automatic Token Refresh** handling
- **Secure Webhook Validation** (implement in production)

## 🤖 **Mira AI Integration**

### Event Extraction Process
1. **Email Analysis**: Mira analyzes email subject and body
2. **Event Detection**: Determines if email contains event information
3. **Data Extraction**: Extracts title, date, time, location, duration
4. **Confidence Scoring**: Provides confidence level (0-1)
5. **JSON Response**: Returns structured event data

### Mira AI Prompt
```typescript
const prompt = `You are Mira, an AI assistant for Soen. Analyze this email and extract any event/meeting information:

Subject: ${email.subject}
From: ${email.sender}
Body: ${email.fullBody}

Extract the following information if present:
1. Is there a meeting/event? (true/false)
2. Event title
3. Date and time
4. Location (physical address or virtual meeting link)
5. Duration estimate in minutes

Return ONLY a valid JSON object with these exact fields:
{
  "eventDetected": boolean,
  "title": "string or empty string",
  "date": "YYYY-MM-DD format",
  "time": "HH:MM format or null",
  "location": "string or null",
  "duration": number (minutes) or null,
  "confidence": number between 0-1
}`;
```

## 🔧 **Configuration**

### Environment Variables
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
GOOGLE_CLOUD_PROJECT=your_cloud_project_id
```

### Gmail API Setup
1. **Enable Gmail API** in Google Cloud Console
2. **Create OAuth 2.0 Credentials** for web application
3. **Configure Redirect URI** for OAuth flow
4. **Set up Pub/Sub Topic** for Gmail push notifications
5. **Configure Webhook URL** in Gmail API settings

### Watch Configuration
```typescript
// Default labels to watch
watch_labels: ['INBOX', 'UNREAD']

// Custom labels can be added
watch_labels: ['INBOX', 'UNREAD', 'IMPORTANT', 'STARRED']
```

## 📊 **Event Processing Flow**

### 1. Email Reception
- Gmail sends push notification to webhook
- Service processes notification and fetches email
- Email is parsed and analyzed by Mira AI

### 2. Event Detection
- Mira AI analyzes email content
- Extracts event information with confidence score
- Determines if event should be auto-added

### 3. Task Creation
- High confidence events (>0.9) are auto-added
- Lower confidence events require user confirmation
- Tasks are created in Soen with extracted details

### 4. User Notification
- Notifications sent for detected events
- Users can confirm or reject events
- Status updated in database accordingly

## 🎨 **Integration Examples**

### React Component Integration
```tsx
import { GmailIntegrationWidget } from '../components/GmailIntegrationWidget';

<GmailIntegrationWidget
  userId={currentUserId}
  onIntegrationSetup={(success) => {
    if (success) {
      showToast('Gmail integration setup successfully!');
    }
  }}
  onEventDetected={(event) => {
    showEventConfirmationDialog(event);
  }}
/>
```

### Express.js Webhook Handler
```javascript
const express = require('express');
const app = express();

app.post('/gmail-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    // Verify webhook signature (implement in production)
    const signature = req.headers['x-gmail-signature'];
    
    // Process Gmail notification
    await gmailAgentService.handleGmailWebhook(req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Gmail webhook error:', error);
    res.status(500).send('Error');
  }
});
```

## 🔮 **Future Enhancements**

### Advanced Features
- **Smart Filtering**: Learn user preferences for event types
- **Calendar Integration**: Sync with Google Calendar automatically
- **Meeting Link Detection**: Extract Zoom, Teams, Meet links
- **Recurring Events**: Detect and handle recurring meetings
- **Time Zone Handling**: Automatic time zone conversion

### AI Improvements
- **Context Learning**: Learn from user confirmations/rejections
- **Email Threading**: Analyze entire conversation threads
- **Language Support**: Multi-language email processing
- **Custom Patterns**: User-defined event detection patterns

### Integration Enhancements
- **Multiple Email Accounts**: Support for multiple Gmail accounts
- **Other Email Providers**: Outlook, Yahoo, etc.
- **Slack Integration**: Extract events from Slack messages
- **Calendar Sync**: Bidirectional calendar synchronization

## 🧪 **Testing**

### Unit Tests
```typescript
describe('GmailAgentService', () => {
  it('should extract event data from email', async () => {
    const mockEmail = {
      subject: 'Meeting Tomorrow at 2 PM',
      sender: 'colleague@company.com',
      fullBody: 'Hi, let\'s meet tomorrow at 2 PM in the conference room.'
    };
    
    const result = await gmailAgentService.extractEventDataWithMira(mockEmail);
    
    expect(result.eventDetected).toBe(true);
    expect(result.title).toContain('Meeting');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests
- **OAuth Flow**: Test complete Gmail integration setup
- **Webhook Processing**: Test Gmail webhook handling
- **Event Extraction**: Test various email formats
- **Task Creation**: Test automatic task creation

## 📊 **Monitoring & Analytics**

### Key Metrics
- **Email Processing Rate**: Emails processed per minute
- **Event Detection Accuracy**: Percentage of correctly detected events
- **User Confirmation Rate**: Percentage of events users confirm
- **Auto-add Success Rate**: Success rate of automatic task creation

### Error Handling
- **Token Expiration**: Automatic token refresh
- **API Rate Limits**: Exponential backoff for rate limits
- **Webhook Failures**: Retry mechanism for failed webhooks
- **AI Service Errors**: Fallback handling for Mira AI failures

## 🚀 **Deployment Considerations**

### Production Setup
- **Webhook Security**: Implement signature verification
- **Rate Limiting**: Implement API rate limiting
- **Error Monitoring**: Set up comprehensive error tracking
- **Database Indexing**: Optimize database queries
- **Caching**: Cache frequently accessed data

### Scaling
- **Horizontal Scaling**: Multiple service instances
- **Database Sharding**: Shard by user ID
- **Queue Processing**: Use message queues for email processing
- **CDN Integration**: Cache static assets

This Gmail Agent Service provides a robust foundation for intelligent email processing in Soen, with Mira as the AI assistant that seamlessly integrates email events into the user's productivity workflow.
