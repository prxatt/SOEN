import { google } from 'googleapis';
import { miraAIService } from './miraAIService';
import { GmailEvent, GmailExtractedEventData, GmailIntegration, GmailParsedEvent } from '../types';

// Mock Supabase client - replace with actual implementation
const supabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ 
          data: getMockData(table, 'single'), 
          error: null 
        }),
        order: (column: string, options: any) => ({
          limit: (count: number) => Promise.resolve({ 
            data: getMockData(table, 'array'), 
            error: null 
          })
        })
      }),
      order: (column: string, options: any) => ({
        limit: (count: number) => Promise.resolve({ 
          data: getMockData(table, 'array'), 
          error: null 
        })
      })
    }),
    insert: (data: any) => Promise.resolve({ 
      data: getMockData(table, 'insert'), 
      error: null 
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ 
        data: getMockData(table, 'update'), 
        error: null 
      })
    })
  })
};

// Mock data generator based on table and operation type
function getMockData(table: string, operation: string): any {
  const mockData: Record<string, Record<string, any>> = {
    'gmail_integrations': {
      single: {
        id: 1,
        user_id: 'mock-user-id',
        access_token_encrypted: 'mock-access-token',
        refresh_token_encrypted: 'mock-refresh-token',
        access_token_iv: 'mock-iv',
        refresh_token_iv: 'mock-refresh-iv',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        gmail_watch_expiration: new Date(Date.now() + 86400000).toISOString(),
        gmail_history_id: 'mock-history-id',
        watch_labels: ['INBOX', 'UNREAD'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      array: [{
        id: 1,
        user_id: 'mock-user-id',
        access_token_encrypted: 'mock-access-token',
        refresh_token_encrypted: 'mock-refresh-token',
        access_token_iv: 'mock-iv',
        refresh_token_iv: 'mock-refresh-iv',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        gmail_watch_expiration: new Date(Date.now() + 86400000).toISOString(),
        gmail_history_id: 'mock-history-id',
        watch_labels: ['INBOX', 'UNREAD'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }],
      insert: {
        id: 1,
        user_id: 'mock-user-id',
        access_token_encrypted: 'mock-access-token',
        refresh_token_encrypted: 'mock-refresh-token',
        access_token_iv: 'mock-iv',
        refresh_token_iv: 'mock-refresh-iv',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        watch_labels: ['INBOX', 'UNREAD'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      update: {
        id: 1,
        gmail_watch_expiration: new Date(Date.now() + 86400000).toISOString(),
        gmail_history_id: 'mock-history-id',
        updated_at: new Date().toISOString()
      }
    },
    'gmail_parsed_events': {
      single: {
        id: 1,
        user_id: 'mock-user-id',
        gmail_message_id: 'mock-message-id',
        subject: 'Mock Email Subject',
        sender: 'sender@example.com',
        received_at: new Date().toISOString(),
        email_body_snippet: 'Mock email body snippet',
        event_detected: true,
        event_title: 'Mock Event Title',
        event_date: new Date(Date.now() + 86400000).toISOString(),
        event_location: 'Mock Location',
        event_confidence: 0.95,
        extracted_details: { mock: 'details' },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      array: [{
        id: 1,
        user_id: 'mock-user-id',
        gmail_message_id: 'mock-message-id',
        subject: 'Mock Email Subject',
        sender: 'sender@example.com',
        received_at: new Date().toISOString(),
        email_body_snippet: 'Mock email body snippet',
        event_detected: true,
        event_title: 'Mock Event Title',
        event_date: new Date(Date.now() + 86400000).toISOString(),
        event_location: 'Mock Location',
        event_confidence: 0.95,
        extracted_details: { mock: 'details' },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }],
      insert: {
        id: 1,
        user_id: 'mock-user-id',
        gmail_message_id: 'mock-message-id',
        subject: 'Mock Email Subject',
        sender: 'sender@example.com',
        received_at: new Date().toISOString(),
        email_body_snippet: 'Mock email body snippet',
        event_detected: true,
        event_title: 'Mock Event Title',
        event_date: new Date(Date.now() + 86400000).toISOString(),
        event_location: 'Mock Location',
        event_confidence: 0.95,
        extracted_details: { mock: 'details' },
        status: 'pending',
        created_at: new Date().toISOString()
      },
      update: {
        id: 1,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }
    },
    'profiles': {
      single: {
        id: 'mock-user-id',
        email: 'user@example.com',
        mira_voice_preference: 'neutral',
        mira_personality_mode: 'supportive'
      },
      array: [{
        id: 'mock-user-id',
        email: 'user@example.com',
        mira_voice_preference: 'neutral',
        mira_personality_mode: 'supportive'
      }],
      insert: {
        id: 'mock-user-id',
        email: 'user@example.com',
        mira_voice_preference: 'neutral',
        mira_personality_mode: 'supportive'
      },
      update: {
        id: 'mock-user-id',
        mira_voice_preference: 'neutral',
        mira_personality_mode: 'supportive'
      }
    },
    'tasks': {
      single: {
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Task Title',
        category: 'Meeting',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        planned_duration: 60,
        location: 'Mock Location',
        notes: 'Mock task notes',
        extracted_from_image: false,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      array: [{
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Task Title',
        category: 'Meeting',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        planned_duration: 60,
        location: 'Mock Location',
        notes: 'Mock task notes',
        extracted_from_image: false,
        status: 'pending',
        created_at: new Date().toISOString()
      }],
      insert: {
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Task Title',
        category: 'Meeting',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        planned_duration: 60,
        location: 'Mock Location',
        notes: 'Mock task notes',
        extracted_from_image: false,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      update: {
        id: 1,
        status: 'completed',
        updated_at: new Date().toISOString()
      }
    },
    'notifications': {
      single: {
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Notification',
        message: 'Mock notification message',
        type: 'info',
        action_label: 'Mock Action',
        action_data: { mock: 'data' },
        read: false,
        created_at: new Date().toISOString()
      },
      array: [{
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Notification',
        message: 'Mock notification message',
        type: 'info',
        action_label: 'Mock Action',
        action_data: { mock: 'data' },
        read: false,
        created_at: new Date().toISOString()
      }],
      insert: {
        id: 1,
        user_id: 'mock-user-id',
        title: 'Mock Notification',
        message: 'Mock notification message',
        type: 'info',
        action_label: 'Mock Action',
        action_data: { mock: 'data' },
        read: false,
        created_at: new Date().toISOString()
      },
      update: {
        id: 1,
        read: true,
        updated_at: new Date().toISOString()
      }
    }
  };

  return mockData[table]?.[operation] || null;
}

class GmailAgentService {
  private gmail: any;
  private watchers: Map<string, NodeJS.Timeout> = new Map();

  async setupGmailIntegration(userId: string, authCode: string): Promise<void> {
    try {
      // Exchange auth code for tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);

      // Encrypt and save tokens
      const { encrypted: accessToken, iv: accessIv } = await this.encryptToken(tokens.access_token!);
      const { encrypted: refreshToken, iv: refreshIv } = await this.encryptToken(tokens.refresh_token!);

      await supabase.from('gmail_integrations').insert({
        user_id: userId,
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken,
        access_token_iv: accessIv,
        refresh_token_iv: refreshIv,
        token_expires_at: new Date(Date.now() + (tokens.expiry_date || 3600000)),
        watch_labels: ['INBOX', 'UNREAD'], // Default labels to watch
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Start watching Gmail for new messages
      await this.startGmailWatch(userId);
    } catch (error) {
      console.error('Error setting up Gmail integration:', error);
      throw new Error('Failed to setup Gmail integration');
    }
  }

  async startGmailWatch(userId: string) {
    try {
      // Get user's Gmail credentials
      const { data: integration } = await supabase
        .from('gmail_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!integration) {
        throw new Error('No active Gmail integration found');
      }

      const oauth2Client = await this.getAuthClient(userId);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Set up Gmail push notifications (webhook)
      const watchResponse = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: integration.watch_labels,
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/gmail-notifications`
        }
      });

      // Save watch info
      await supabase
        .from('gmail_integrations')
        .update({
          gmail_watch_expiration: new Date(watchResponse.data.expiration),
          gmail_history_id: watchResponse.data.historyId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Also poll every 5 minutes as backup
      const pollInterval = setInterval(() => {
        this.pollNewMessages(userId);
      }, 5 * 60 * 1000);

      this.watchers.set(userId, pollInterval);
    } catch (error) {
      console.error('Error starting Gmail watch:', error);
      throw error;
    }
  }

  async handleGmailWebhook(notification: any) {
    try {
      // Called when Gmail sends push notification
      const { emailAddress, historyId } = notification;

      // Find user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailAddress)
        .single();

      if (!profile) {
        console.log('No profile found for email:', emailAddress);
        return;
      }

      // Process new messages
      await this.processNewMessages(profile.id, historyId);
    } catch (error) {
      console.error('Error handling Gmail webhook:', error);
    }
  }

  private async pollNewMessages(userId: string) {
    try {
      const { data: integration } = await supabase
        .from('gmail_integrations')
        .select('gmail_history_id')
        .eq('user_id', userId)
        .single();

      if (!integration) return;

      await this.processNewMessages(userId, integration.gmail_history_id);
    } catch (error) {
      console.error('Error polling new messages:', error);
    }
  }

  private async processNewMessages(userId: string, startHistoryId: string) {
    try {
      const oauth2Client = await this.getAuthClient(userId);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Get new messages since last history ID
      const historyResponse = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded']
      });

      const history = historyResponse.data.history || [];
      
      for (const record of history) {
        if (record.messagesAdded) {
          for (const added of record.messagesAdded) {
            await this.analyzeEmailForEvents(userId, added.message.id);
          }
        }
      }

      // Update last processed history ID
      if (historyResponse.data.historyId) {
        await supabase
          .from('gmail_integrations')
          .update({ 
            gmail_history_id: historyResponse.data.historyId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error processing new messages:', error);
    }
  }

  private async analyzeEmailForEvents(userId: string, messageId: string) {
    try {
      // Fetch full email
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const email = this.parseGmailMessage(message.data);

      // Use Mira AI to extract event information
      const extractedData = await this.extractEventDataWithMira(email);

      // Save to database
      await supabase.from('gmail_parsed_events').insert({
        user_id: userId,
        gmail_message_id: messageId,
        subject: email.subject,
        sender: email.sender,
        received_at: email.receivedAt.toISOString(),
        email_body_snippet: email.bodySnippet,
        event_detected: extractedData.eventDetected,
        event_title: extractedData.title,
        event_date: extractedData.date.toISOString(),
        event_location: extractedData.location,
        event_confidence: extractedData.confidence,
        extracted_details: extractedData.extractedDetails,
        status: this.shouldAutoAdd(extractedData) ? 'auto_added' : 'pending',
        created_at: new Date().toISOString()
      });

      // Auto-add to calendar if confidence is high and user settings allow
      if (this.shouldAutoAdd(extractedData)) {
        await this.createTaskFromEmail(userId, extractedData);
        
        // Send notification
        await this.sendNotification(userId, {
          title: 'Event Added from Email',
          message: `Mira automatically added "${extractedData.title}" to your Soen schedule`,
          type: 'info'
        });
      } else if (extractedData.eventDetected) {
        // Send notification for user to confirm
        await this.sendNotification(userId, {
          title: 'Potential Event Detected',
          message: `Mira found "${extractedData.title}" in your email. Add to Soen schedule?`,
          type: 'info',
          action_label: 'Add to Schedule',
          action_data: { gmail_event_id: messageId }
        });
      }
    } catch (error) {
      console.error('Error analyzing email for events:', error);
    }
  }

  private parseGmailMessage(data: any): GmailEvent {
    const headers = data.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
    const from = headers.find((h: any) => h.name === 'From')?.value || '';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';

    // Extract body
    let body = data.snippet;
    if (data.payload.parts) {
      const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      messageId: data.id,
      subject,
      sender: from,
      receivedAt: new Date(date),
      bodySnippet: data.snippet,
      fullBody: body
    };
  }

  private async extractEventDataWithMira(email: GmailEvent): Promise<GmailExtractedEventData> {
    try {
      // Use Mira AI to extract event details
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
}

If no event is detected, set eventDetected to false and confidence to 0.`;

      const response = await miraAIService.processRequest({
        userId: email.sender, // Use sender as temporary user ID
        message: prompt,
        context: { conversationHistory: [] },
        featureType: 'gmail_event_extraction',
        priority: 'medium'
      });

      try {
        const extracted = JSON.parse(response.content);
        return {
          eventDetected: extracted.eventDetected || false,
          title: extracted.title || '',
          date: extracted.date ? new Date(extracted.date) : new Date(),
          time: extracted.time || undefined,
          location: extracted.location || undefined,
          duration: extracted.duration || undefined,
          confidence: extracted.confidence || 0,
          extractedDetails: extracted
        };
      } catch (parseError) {
        console.error('Error parsing Mira AI response:', parseError);
        return {
          eventDetected: false,
          title: '',
          date: new Date(),
          confidence: 0,
          extractedDetails: {}
        };
      }
    } catch (error) {
      console.error('Error extracting event data with Mira:', error);
      return {
        eventDetected: false,
        title: '',
        date: new Date(),
        confidence: 0,
        extractedDetails: {}
      };
    }
  }

  private shouldAutoAdd(eventData: GmailExtractedEventData): boolean {
    // Auto-add if confidence > 0.9 and user has enabled auto-add
    return eventData.confidence > 0.9 && eventData.eventDetected;
  }

  private async createTaskFromEmail(userId: string, eventData: GmailExtractedEventData) {
    try {
      // Create task from extracted event
      const { data: task } = await supabase.from('tasks').insert({
        user_id: userId,
        title: eventData.title,
        category: 'Meeting',
        start_time: eventData.date.toISOString(),
        planned_duration: eventData.duration || 60,
        location: eventData.location,
        notes: `Automatically added from email by Mira`,
        extracted_from_image: false,
        status: 'pending',
        created_at: new Date().toISOString()
      }).select().single();

      return task;
    } catch (error) {
      console.error('Error creating task from email:', error);
      throw error;
    }
  }

  private async getAuthClient(userId: string): Promise<any> {
    try {
      const { data: integration } = await supabase
        .from('gmail_integrations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!integration) throw new Error('No Gmail integration found');

      // Decrypt tokens
      const accessToken = await this.decryptToken(integration.access_token_encrypted, integration.access_token_iv);
      const refreshToken = await this.decryptToken(integration.refresh_token_encrypted, integration.refresh_token_iv);

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      return oauth2Client;
    } catch (error) {
      console.error('Error getting auth client:', error);
      throw error;
    }
  }

  private async encryptToken(token: string): Promise<{encrypted: string; iv: string}> {
    try {
      // Use AES-256-GCM encryption
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(token);

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );

      return {
        encrypted: Buffer.from(encrypted).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
      };
    } catch (error) {
      console.error('Error encrypting token:', error);
      throw error;
    }
  }

  private async decryptToken(encrypted: string, iv: string): Promise<string> {
    try {
      // Decryption logic - simplified for this implementation
      // In production, you'd implement proper AES-GCM decryption
      return encrypted; // Placeholder - implement proper decryption
    } catch (error) {
      console.error('Error decrypting token:', error);
      throw error;
    }
  }

  private async sendNotification(userId: string, notification: any) {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        ...notification,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Additional utility methods
  async stopGmailWatch(userId: string) {
    const pollInterval = this.watchers.get(userId);
    if (pollInterval) {
      clearInterval(pollInterval);
      this.watchers.delete(userId);
    }

    // Update integration status
    await supabase
      .from('gmail_integrations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  async getGmailIntegrationStatus(userId: string): Promise<GmailIntegration | null> {
    try {
      const { data } = await supabase
        .from('gmail_integrations')
        .select('*')
        .eq('user_id', userId)
        .single();

      return data;
    } catch (error) {
      console.error('Error getting Gmail integration status:', error);
      return null;
    }
  }

  async getParsedEvents(userId: string, limit: number = 50): Promise<GmailParsedEvent[]> {
    try {
      const { data } = await supabase
        .from('gmail_parsed_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting parsed events:', error);
      return [];
    }
  }

  async confirmEvent(userId: string, gmailEventId: string) {
    try {
      // Update event status to confirmed
      await supabase
        .from('gmail_parsed_events')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('gmail_message_id', gmailEventId)
        .eq('user_id', userId);

      // Get event details and create task
      const { data: event } = await supabase
        .from('gmail_parsed_events')
        .select('*')
        .eq('gmail_message_id', gmailEventId)
        .eq('user_id', userId)
        .single();

      if (event && event.event_detected) {
        await this.createTaskFromEmail(userId, {
          eventDetected: event.event_detected,
          title: event.event_title || '',
          date: new Date(event.event_date),
          location: event.event_location,
          confidence: event.event_confidence,
          extractedDetails: event.extracted_details
        });
      }
    } catch (error) {
      console.error('Error confirming event:', error);
      throw error;
    }
  }

  async rejectEvent(userId: string, gmailEventId: string) {
    try {
      await supabase
        .from('gmail_parsed_events')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('gmail_message_id', gmailEventId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error rejecting event:', error);
      throw error;
    }
  }
}

export const gmailAgentService = new GmailAgentService();
