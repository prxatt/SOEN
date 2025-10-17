// api/lib/encryption.ts
// Shared encryption utilities for server-side API endpoints

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Encryption configuration constants
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
export const SALT_LENGTH = 32;
export const IV_LENGTH = 16;
export const TAG_LENGTH = 16;
export const KEY_LENGTH = 32;

/**
 * Derives encryption key from environment variables using scrypt
 * @returns Promise<Buffer> - The derived encryption key
 * @throws Error if ENCRYPTION_KEY or ENCRYPTION_SALT are not configured
 */
export const getEncryptionKey = async (): Promise<Buffer> => {
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

/**
 * Encrypts text using AES-256-GCM with authentication
 * @param text - The plaintext to encrypt
 * @returns Promise<{encrypted: string, iv: string}> - Encrypted data and IV
 * @throws Error if encryption fails
 */
export const encryptText = async (text: string): Promise<{ encrypted: string; iv: string }> => {
  try {
    const key = await getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Add authenticated data for additional security
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

/**
 * Decrypts text using AES-256-GCM with authentication verification
 * @param encryptedData - The encrypted data (including auth tag)
 * @param ivHex - The initialization vector as hex string
 * @returns Promise<string> - The decrypted plaintext
 * @throws Error if decryption fails or authentication fails
 */
export const decryptText = async (encryptedData: string, ivHex: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    
    // Split encrypted data and auth tag
    const encrypted = encryptedData.slice(0, -TAG_LENGTH * 2); // Remove tag (32 hex chars)
    const tag = Buffer.from(encryptedData.slice(-TAG_LENGTH * 2), 'hex');
    
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('mira-message', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message content');
  }
};

/**
 * Validates that encryption environment variables are properly configured
 * @returns boolean - True if encryption is properly configured
 */
export const validateEncryptionConfig = (): boolean => {
  try {
    const keyString = process.env.ENCRYPTION_KEY;
    const saltString = process.env.ENCRYPTION_SALT;
    
    if (!keyString || !saltString) {
      return false;
    }
    
    // Basic validation - keys should be reasonably long
    if (keyString.length < 32 || saltString.length < 32) {
      console.warn('Encryption keys should be at least 32 characters long for security');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Encryption config validation error:', error);
    return false;
  }
};
