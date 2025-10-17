// api/mira/message.ts
// Server-side encrypted message handling

import { createClient } from '@supabase/supabase-js';
import { encryptText, decryptText, validateEncryptionConfig } from '../lib/encryption';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
