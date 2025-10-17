import { createClient } from '@supabase/supabase-js'
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afowfefzjonwbqtthacq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3dmZWZ6am9ud2JxdHRoYWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcyMTQsImV4cCI6MjA3MjA5MzIxNH0.3V2q6dfsG-JB8HRxEvwXW0Nt9duVMUMtQrZH-ENSyqg'

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Get encryption key from environment or use a default (in production, this should be properly managed)
const getEncryptionKey = async (): Promise<Buffer> => {
  const keyString = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production'
  const scryptAsync = promisify(scrypt)
  return scryptAsync(keyString, 'salt', KEY_LENGTH) as Promise<Buffer>
}

// Create Supabase client with error handling
let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  // Create a mock client for development
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
      resetPasswordForEmail: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }) }),
      insert: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }),
      update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }) })
    })
  };
}

export { supabase }

// Encryption utility functions
const encryptText = async (text: string): Promise<{ encrypted: string; iv: string }> => {
  try {
    const key = await getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    cipher.setAAD(Buffer.from('mira-message', 'utf8'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    const encryptedWithTag = encrypted + tag.toString('hex')
    
    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('hex')
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt message content')
  }
}

const decryptText = async (encryptedText: string, iv: string): Promise<string> => {
  try {
    const key = await getEncryptionKey()
    const ivBuffer = Buffer.from(iv, 'hex')
    const encryptedBuffer = Buffer.from(encryptedText, 'hex')
    
    // Extract tag from the end of encrypted data
    const tag = encryptedBuffer.slice(-TAG_LENGTH)
    const encrypted = encryptedBuffer.slice(0, -TAG_LENGTH)
    
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, ivBuffer)
    decipher.setAAD(Buffer.from('mira-message', 'utf8'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt message content')
  }
}

// Auth helper functions
export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }
}

// Database helper functions
export const db = {
  // Profiles (Enhanced)
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
    return { data, error }
  },

  async updateMiraPersonality(userId: string, personality: string, voice: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        mira_personality_mode: personality,
        mira_voice_preference: voice,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
    return { data, error }
  },

  async updateUserPreferences(userId: string, preferences: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
    return { data, error }
  },

  // Notebooks
  async getNotebooks(userId: string) {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createNotebook(userId: string, notebook: any) {
    const { data, error } = await supabase
      .from('notebooks')
      .insert({ ...notebook, user_id: userId })
      .select()
    return { data, error }
  },

  // Notes
  async getNotes(notebookId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createNote(note: any) {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
    return { data, error }
  },

  // Tasks
  async getTasks(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createTask(userId: string, task: any) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
    return { data, error }
  },

  // Projects
  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createProject(userId: string, project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select()
    return { data, error }
  },

  // Goals
  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createGoal(userId: string, goal: any) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId })
      .select()
    return { data, error }
  },

  // Mira AI Chat System (New)
  async getMiraConversations(userId: string) {
    const { data, error } = await supabase
      .from('mira_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
    return { data, error }
  },

  async createMiraConversation(userId: string, title: string = 'New Chat') {
    const { data, error } = await supabase
      .from('mira_conversations')
      .insert({ user_id: userId, title })
      .select()
    return { data, error }
  },

  async getMiraMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('mira_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (error || !data) {
      return { data, error }
    }

    // Decrypt messages
    try {
      const decryptedMessages = await Promise.all(
        data.map(async (message) => {
          if (message.content_encrypted && message.content_iv) {
            try {
              const decryptedContent = await decryptText(message.content_encrypted, message.content_iv)
              return {
                ...message,
                content_plaintext: decryptedContent,
                content_encrypted: undefined, // Remove encrypted content from response
                content_iv: undefined // Remove IV from response
              }
            } catch (decryptError) {
              console.error('Failed to decrypt message:', decryptError)
              // Fallback to plaintext if decryption fails (for backward compatibility)
              return {
                ...message,
                content_plaintext: message.content_plaintext || '[Encrypted message - decryption failed]'
              }
            }
          } else if (message.content_plaintext) {
            // Handle legacy messages that only have plaintext
            return message
          } else {
            // No content available
            return {
              ...message,
              content_plaintext: '[No content available]'
            }
          }
        })
      )
      
      return { data: decryptedMessages, error: null }
    } catch (error) {
      console.error('Error decrypting messages:', error)
      return { data, error }
    }
  },

  async createMiraMessage(conversationId: string, role: 'user' | 'mira', content: string, metadata: any = {}) {
    try {
      // Encrypt the message content
      const { encrypted, iv } = await encryptText(content)
      
      const { data, error } = await supabase
        .from('mira_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content_encrypted: encrypted,
          content_iv: iv,
          content_plaintext: null, // No longer store plaintext
          ...metadata
        })
        .select()
      return { data, error }
    } catch (encryptionError) {
      console.error('Failed to encrypt message:', encryptionError)
      return { 
        data: null, 
        error: { 
          message: 'Failed to encrypt message content',
          details: encryptionError instanceof Error ? encryptionError.message : 'Unknown encryption error'
        } 
      }
    }
  },

  async deleteMiraConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('mira_conversations')
      .delete()
      .eq('id', conversationId)
      .select()
    return { data, error }
  },

  // AI Usage Tracking (New)
  async logAIUsage(userId: string, usage: {
    model_used: string;
    operation_type: string;
    feature_used?: string;
    tokens_input?: number;
    tokens_output?: number;
    cost_cents?: number;
    latency_ms?: number;
    cache_hit?: boolean;
    fallback_used?: boolean;
  }) {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        ...usage
      })
      .select()
    return { data, error }
  },

  async getAIUsageStats(userId: string, days: number = 30) {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getDailyAIUsageSummary(userId: string, date: string) {
    const { data, error } = await supabase
      .from('daily_ai_usage_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()
    return { data, error }
  },

  // Strategic Briefings (New)
  async getStrategicBriefing(userId: string, date: string) {
    const { data, error } = await supabase
      .from('strategic_briefings')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()
    return { data, error }
  },

  async createStrategicBriefing(userId: string, date: string, content: any, metadata: any = {}) {
    const { data, error } = await supabase
      .from('strategic_briefings')
      .insert({
        user_id: userId,
        date,
        content,
        ...metadata
      })
      .select()
    return { data, error }
  },

  // Health Data (Enhanced)
  async getHealthData(userId: string, date: string) {
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()
    return { data, error }
  },

  async updateHealthData(userId: string, date: string, healthData: any) {
    const { data, error } = await supabase
      .from('health_data')
      .upsert({
        user_id: userId,
        date,
        ...healthData
      })
      .select()
    return { data, error }
  },

  // Notifications (New)
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'ai_insight';
    action_label?: string;
    action_data?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ...notification
      })
      .select()
    return { data, error }
  },

  async markNotificationRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
    return { data, error }
  }
}

// Real-time subscriptions
export const realtime = {
  subscribeToNotes(notebookId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notes:${notebookId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notes', filter: `notebook_id=eq.${notebookId}` },
        callback
      )
      .subscribe()
  },

  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`tasks:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe()
  }
}

// Utility functions
export const utils = {
  // Check if user is authenticated
  async isAuthenticated() {
    const session = await auth.getSession()
    return !!session
  },

  // Get current user ID
  async getCurrentUserId() {
    const user = await auth.getCurrentUser()
    return user?.id
  },

  // Initialize user profile if it doesn't exist
  async initializeUserProfile(userId: string, userData: any) {
    const { data: existingProfile } = await db.getProfile(userId)
    
    if (!existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: userData.full_name || 'User',
          email: userData.email,
          avatar_url: userData.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Failed to create user profile:', error)
      }
    }
  },

  // Migrate existing plaintext messages to encrypted format
  async migrateMessagesToEncrypted() {
    try {
      console.log('Starting message encryption migration...')
      
      // Get all messages that have plaintext but no encrypted content
      const { data: messages, error } = await supabase
        .from('mira_messages')
        .select('id, content_plaintext')
        .not('content_plaintext', 'is', null)
        .is('content_encrypted', null)
      
      if (error) {
        console.error('Failed to fetch messages for migration:', error)
        return { success: false, error }
      }

      if (!messages || messages.length === 0) {
        console.log('No messages need migration')
        return { success: true, migrated: 0 }
      }

      console.log(`Found ${messages.length} messages to migrate`)

      // Migrate each message
      let migratedCount = 0
      for (const message of messages) {
        try {
          const { encrypted, iv } = await encryptText(message.content_plaintext)
          
          const { error: updateError } = await supabase
            .from('mira_messages')
            .update({
              content_encrypted: encrypted,
              content_iv: iv,
              content_plaintext: null // Remove plaintext after encryption
            })
            .eq('id', message.id)
          
          if (updateError) {
            console.error(`Failed to migrate message ${message.id}:`, updateError)
          } else {
            migratedCount++
          }
        } catch (encryptError) {
          console.error(`Failed to encrypt message ${message.id}:`, encryptError)
        }
      }

      console.log(`Successfully migrated ${migratedCount} out of ${messages.length} messages`)
      return { success: true, migrated: migratedCount, total: messages.length }
    } catch (error) {
      console.error('Migration failed:', error)
      return { success: false, error }
    }
  }
}

export default supabase
