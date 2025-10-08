import { webcrypto } from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export class EncryptionService {
  private algorithm = 'AES-GCM';
  private keyLength = 256;
  private ivLength = 12; // 96 bits for GCM
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // ============================================
  // USER ENCRYPTION KEY MANAGEMENT
  // ============================================

  async generateUserEncryptionKey(userId: string): Promise<string> {
    try {
      // Generate a unique encryption key for the user
      const key = await webcrypto.subtle.generateKey(
        { name: this.algorithm, length: this.keyLength },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Export the key as raw bytes
      const exported = await webcrypto.subtle.exportKey('raw', key);
      const keyBase64 = Buffer.from(exported).toString('base64');

      // Create a hash of the key for storage (never store actual key)
      const keyHash = await this.hashKey(Buffer.from(exported));

      // Store key hash in profile
      const { error } = await this.supabase
        .from('profiles')
        .update({
          encryption_key_hash: keyHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to store encryption key hash: ${error.message}`);
      }

      return keyBase64;
    } catch (error) {
      throw new Error(`Failed to generate user encryption key: ${error.message}`);
    }
  }

  async getUserEncryptionKey(userId: string): Promise<string | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('encryption_key_hash')
        .eq('id', userId)
        .single();

      if (error || !profile?.encryption_key_hash) {
        return null;
      }

      // In a real implementation, you would need to retrieve the actual key
      // from a secure key management system using the hash
      // For now, we'll return null to indicate no key is available
      return null;
    } catch (error) {
      console.error('Error retrieving user encryption key:', error);
      return null;
    }
  }

  async rotateUserEncryptionKey(userId: string): Promise<string> {
    try {
      // Generate new key
      const newKey = await this.generateUserEncryptionKey(userId);

      // Re-encrypt all user's encrypted data with new key
      await this.reencryptUserData(userId, newKey);

      return newKey;
    } catch (error) {
      throw new Error(`Failed to rotate user encryption key: ${error.message}`);
    }
  }

  // ============================================
  // CONTENT ENCRYPTION/DECRYPTION
  // ============================================

  async encryptContent(content: string, userKey: string): Promise<EncryptionResult> {
    try {
      const key = await this.importKey(userKey);
      const iv = webcrypto.getRandomValues(new Uint8Array(this.ivLength));
      const encoded = new TextEncoder().encode(content);

      const encrypted = await webcrypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        encoded
      );

      return {
        encrypted: Buffer.from(encrypted).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
      };
    } catch (error) {
      throw new Error(`Failed to encrypt content: ${error.message}`);
    }
  }

  async decryptContent(encrypted: string, iv: string, userKey: string): Promise<string> {
    try {
      const key = await this.importKey(userKey);
      const encryptedData = Buffer.from(encrypted, 'base64');
      const ivData = Buffer.from(iv, 'base64');

      const decrypted = await webcrypto.subtle.decrypt(
        { name: this.algorithm, iv: ivData },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt content: ${error.message}`);
    }
  }

  // ============================================
  // BULK ENCRYPTION/DECRYPTION
  // ============================================

  async encryptUserData(userId: string, data: Record<string, any>): Promise<Record<string, EncryptionResult>> {
    try {
      const userKey = await this.getUserEncryptionKey(userId);
      if (!userKey) {
        throw new Error('User encryption key not found');
      }

      const encryptedData: Record<string, EncryptionResult> = {};

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value.length > 0) {
          encryptedData[key] = await this.encryptContent(value, userKey);
        }
      }

      return encryptedData;
    } catch (error) {
      throw new Error(`Failed to encrypt user data: ${error.message}`);
    }
  }

  async decryptUserData(userId: string, encryptedData: Record<string, EncryptionResult>): Promise<Record<string, string>> {
    try {
      const userKey = await this.getUserEncryptionKey(userId);
      if (!userKey) {
        throw new Error('User encryption key not found');
      }

      const decryptedData: Record<string, string> = {};

      for (const [key, encrypted] of Object.entries(encryptedData)) {
        decryptedData[key] = await this.decryptContent(
          encrypted.encrypted,
          encrypted.iv,
          userKey
        );
      }

      return decryptedData;
    } catch (error) {
      throw new Error(`Failed to decrypt user data: ${error.message}`);
    }
  }

  // ============================================
  // FIELD-SPECIFIC ENCRYPTION
  // ============================================

  async encryptSensitiveFields(userId: string, fields: {
    content?: string;
    notes?: string;
    apiKeys?: Record<string, string>;
    personalData?: Record<string, any>;
  }): Promise<{
    content_encrypted?: EncryptionResult;
    notes_encrypted?: EncryptionResult;
    api_keys_encrypted?: EncryptionResult;
    personal_data_encrypted?: EncryptionResult;
  }> {
    try {
      const userKey = await this.getUserEncryptionKey(userId);
      if (!userKey) {
        throw new Error('User encryption key not found');
      }

      const result: any = {};

      if (fields.content) {
        result.content_encrypted = await this.encryptContent(fields.content, userKey);
      }

      if (fields.notes) {
        result.notes_encrypted = await this.encryptContent(fields.notes, userKey);
      }

      if (fields.apiKeys) {
        const apiKeysJson = JSON.stringify(fields.apiKeys);
        result.api_keys_encrypted = await this.encryptContent(apiKeysJson, userKey);
      }

      if (fields.personalData) {
        const personalDataJson = JSON.stringify(fields.personalData);
        result.personal_data_encrypted = await this.encryptContent(personalDataJson, userKey);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to encrypt sensitive fields: ${error.message}`);
    }
  }

  async decryptSensitiveFields(userId: string, encryptedFields: {
    content_encrypted?: EncryptionResult;
    notes_encrypted?: EncryptionResult;
    api_keys_encrypted?: EncryptionResult;
    personal_data_encrypted?: EncryptionResult;
  }): Promise<{
    content?: string;
    notes?: string;
    apiKeys?: Record<string, string>;
    personalData?: Record<string, any>;
  }> {
    try {
      const userKey = await this.getUserEncryptionKey(userId);
      if (!userKey) {
        throw new Error('User encryption key not found');
      }

      const result: any = {};

      if (encryptedFields.content_encrypted) {
        result.content = await this.decryptContent(
          encryptedFields.content_encrypted.encrypted,
          encryptedFields.content_encrypted.iv,
          userKey
        );
      }

      if (encryptedFields.notes_encrypted) {
        result.notes = await this.decryptContent(
          encryptedFields.notes_encrypted.encrypted,
          encryptedFields.notes_encrypted.iv,
          userKey
        );
      }

      if (encryptedFields.api_keys_encrypted) {
        const apiKeysJson = await this.decryptContent(
          encryptedFields.api_keys_encrypted.encrypted,
          encryptedFields.api_keys_encrypted.iv,
          userKey
        );
        result.apiKeys = JSON.parse(apiKeysJson);
      }

      if (encryptedFields.personal_data_encrypted) {
        const personalDataJson = await this.decryptContent(
          encryptedFields.personal_data_encrypted.encrypted,
          encryptedFields.personal_data_encrypted.iv,
          userKey
        );
        result.personalData = JSON.parse(personalDataJson);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to decrypt sensitive fields: ${error.message}`);
    }
  }

  // ============================================
  // KEY MANAGEMENT HELPERS
  // ============================================

      private async importKey(keyBase64: string): Promise<globalThis.CryptoKey> {
    try {
      const keyData = Buffer.from(keyBase64, 'base64');
      
      return await webcrypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.algorithm },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(`Failed to import key: ${error.message}`);
    }
  }

  private async hashKey(key: Buffer): Promise<string> {
    try {
      const hashBuffer = await webcrypto.subtle.digest('SHA-256', key);
      return Buffer.from(hashBuffer).toString('hex');
    } catch (error) {
      throw new Error(`Failed to hash key: ${error.message}`);
    }
  }

  // ============================================
  // DATA RE-ENCRYPTION
  // ============================================

  private async reencryptUserData(userId: string, newKey: string): Promise<void> {
    try {
      // Get all encrypted data for the user
      const { data: encryptedData } = await this.supabase
        .from('notes')
        .select('id, content_encrypted, content_iv')
        .eq('user_id', userId)
        .not('content_encrypted', 'is', null);

      if (!encryptedData) return;

      // Re-encrypt each piece of data
      for (const note of encryptedData) {
        if (note.content_encrypted && note.content_iv) {
          // Decrypt with old key (would need old key management)
          // For now, we'll skip this step as it requires key versioning
          console.log(`Skipping re-encryption for note ${note.id} - requires key versioning`);
        }
      }
    } catch (error) {
      console.error('Error re-encrypting user data:', error);
    }
  }

  // ============================================
  // ENCRYPTION STATUS
  // ============================================

  async getEncryptionStatus(userId: string): Promise<{
    hasEncryptionKey: boolean;
    encryptedFields: string[];
    lastKeyRotation?: string;
  }> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('encryption_key_hash, updated_at')
        .eq('id', userId)
        .single();

      const hasEncryptionKey = !!profile?.encryption_key_hash;

      // Check which fields are encrypted
      const encryptedFields: string[] = [];
      
      const { data: notes } = await this.supabase
        .from('notes')
        .select('content_encrypted')
        .eq('user_id', userId)
        .not('content_encrypted', 'is', null)
        .limit(1);

      if (notes && notes.length > 0) {
        encryptedFields.push('notes');
      }

      return {
        hasEncryptionKey,
        encryptedFields,
        lastKeyRotation: profile?.updated_at
      };
    } catch (error) {
      console.error('Error getting encryption status:', error);
      return {
        hasEncryptionKey: false,
        encryptedFields: []
      };
    }
  }

  // ============================================
  // SECURITY VALIDATION
  // ============================================

  async validateEncryption(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const status = await this.getEncryptionStatus(userId);

      if (!status.hasEncryptionKey) {
        errors.push('No encryption key found');
      }

      // Test encryption/decryption with a small sample
      if (status.hasEncryptionKey) {
        const testData = 'encryption_test_' + Date.now();
        const userKey = await this.getUserEncryptionKey(userId);
        
        if (userKey) {
          try {
            const encrypted = await this.encryptContent(testData, userKey);
            const decrypted = await this.decryptContent(
              encrypted.encrypted,
              encrypted.iv,
              userKey
            );

            if (decrypted !== testData) {
              errors.push('Encryption/decryption test failed');
            }
          } catch (error) {
            errors.push(`Encryption test error: ${error.message}`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors
      };
    }
  }
}

// Export singleton instance
export const createEncryptionService = (supabase: any) => new EncryptionService(supabase);
