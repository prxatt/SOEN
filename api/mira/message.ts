// api/mira/message.ts
// Server-side encrypted message handling

import { createClient } from '@supabase/supabase-js';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://afowfefzjonwbqtthacq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = async (): Promise<Buffer> => {
  const keyString = process.env.ENCRYPTION_KEY;
  const saltString = process.env.ENCRYPTION_SALT;
  
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is required for secure message encryption');
  }
  
  if (!saltString) {
    throw new Error('ENCRYPTION_SALT environment variable is required for secure key derivation');
  }
  
  const scryptAsync = promisify(scrypt);
  return scryptAsync(keyString, saltString, KEY_LENGTH) as Promise<Buffer>;
};

const encryptText = async (text: string): Promise<{ encrypted: string; iv: string }> => {
  try {
    const key = await getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('mira-message', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const encryptedWithTag = encrypted + tag.toString('hex');
    
    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message content');
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversation_id, role, content, ...metadata } = req.body;

    // Validate request
    if (!conversation_id || !role || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt the message content
    const { encrypted, iv } = await encryptText(content);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);
    
    // Insert encrypted message
    const { data, error } = await supabase
      .from('mira_messages')
      .insert({
        conversation_id,
        role,
        content_encrypted: encrypted,
        content_iv: iv,
        content_plaintext: null, // No longer store plaintext
        ...metadata
      })
      .select();

    if (error) {
      console.error('Failed to create message:', error);
      return res.status(500).json({ error: 'Failed to create message' });
    }

    res.status(200).json({ data, error: null });

  } catch (error) {
    console.error('Message API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
