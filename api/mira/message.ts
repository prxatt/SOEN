// api/mira/message.ts
// Server-side encrypted message handling

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { encryptText, decryptText, validateEncryptionConfig } from '../lib/encryption';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required for database connection');
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side operations');
}

export default async function handler(req: Request, res: Response) {
  try {
    if (req.method === 'POST') {
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
          content_plaintext: null,
          ...metadata
        })
        .select();

      if (error) {
        console.error('Failed to create message:', error);
        return res.status(500).json({ error: 'Failed to create message' });
      }

      return res.status(200).json({ data, error: null });
    }

    if (req.method === 'GET') {
      const { conversation_id } = req.query;
      if (!conversation_id) {
        return res.status(400).json({ error: 'Missing conversation_id' });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey!);
      const { data, error } = await supabase
        .from('mira_messages')
        .select('id, role, created_at, content_encrypted, content_iv, metadata')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      const decrypted = await Promise.all((data || []).map(async (msg: any) => {
        let plaintext = '[Decryption failed]';
        try {
          plaintext = await decryptText(msg.content_encrypted, msg.content_iv);
        } catch (e) {
          console.error('Failed to decrypt message', msg.id, e);
        }
        return {
          id: msg.id,
          role: msg.role,
          created_at: msg.created_at,
          content_plaintext: plaintext,
          metadata: msg.metadata || null
        };
      }));

      return res.status(200).json({ data: decrypted, error: null });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Message API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
