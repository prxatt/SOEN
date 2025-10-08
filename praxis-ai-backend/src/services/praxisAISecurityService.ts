import { 
  AIRequestSecurity, 
  EncryptionConfig, 
  AuditLog,
  PraxisAuthContext 
} from '../types/praxis-auth';
import crypto from 'crypto';
import { createEncryptionService } from './encryptionService';

export class PraxisAISecurityService {
  private supabase: any;
  private encryptionConfig: EncryptionConfig;
  private encryptionService: ReturnType<typeof createEncryptionService>;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.encryptionConfig = {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyRotationDays: 30,
      sensitiveFields: ['content_encrypted', 'transcript_encrypted', 'access_token_encrypted']
    };
    this.encryptionService = createEncryptionService(supabase);
  }

  // ============================================
  // PROMPT SANITIZATION
  // ============================================

  sanitizePrompt(prompt: string): string {
    // Remove potentially harmful content
    let sanitized = prompt;

    // Remove system prompts that could be used for prompt injection
    sanitized = sanitized.replace(/system\s*:\s*/gi, '');
    sanitized = sanitized.replace(/assistant\s*:\s*/gi, '');
    sanitized = sanitized.replace(/user\s*:\s*/gi, '');

    // Remove potential jailbreak attempts
    const jailbreakPatterns = [
      /ignore\s+previous\s+instructions/gi,
      /forget\s+everything/gi,
      /act\s+as\s+if/gi,
      /pretend\s+to\s+be/gi,
      /roleplay\s+as/gi,
      /you\s+are\s+now/gi
    ];

    jailbreakPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Limit length to prevent abuse
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '... [TRUNCATED]';
    }

    return sanitized;
  }

  // ============================================
  // REQUEST VALIDATION
  // ============================================

  validateAIRequest(request: {
    userId: string;
    prompt: string;
    feature: string;
    files?: any[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate user ID
    if (!request.userId || typeof request.userId !== 'string') {
      errors.push('Invalid user ID');
    }

    // Validate prompt
    if (!request.prompt || typeof request.prompt !== 'string') {
      errors.push('Prompt is required');
    } else if (request.prompt.length < 1) {
      errors.push('Prompt cannot be empty');
    } else if (request.prompt.length > 10000) {
      errors.push('Prompt too long (max 10,000 characters)');
    }

    // Validate feature
    const allowedFeatures = [
      'kiko_chat',
      'task_parsing',
      'note_generation',
      'note_summary',
      'mindmap_generation',
      'strategic_briefing',
      'vision_ocr',
      'research_with_sources'
    ];

    if (!allowedFeatures.includes(request.feature)) {
      errors.push(`Invalid feature: ${request.feature}`);
    }

    // Validate files if present
    if (request.files) {
      if (!Array.isArray(request.files)) {
        errors.push('Files must be an array');
      } else {
        request.files.forEach((file, index) => {
          if (!file.filename || !file.mimeType || !file.base64) {
            errors.push(`File ${index + 1} is missing required fields`);
          }
          
          // Check file size (max 10MB)
          const fileSize = (file.base64.length * 3) / 4; // Approximate size
          if (fileSize > 10 * 1024 * 1024) {
            errors.push(`File ${index + 1} is too large (max 10MB)`);
          }

          // Check file type
          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain'
          ];
          
          if (!allowedTypes.includes(file.mimeType)) {
            errors.push(`File ${index + 1} has unsupported type: ${file.mimeType}`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============================================
  // ENCRYPTION SERVICES
  // ============================================

  async generateEncryptionKey(userId: string): Promise<string> {
    return await this.encryptionService.generateUserEncryptionKey(userId);
  }

  async encryptSensitiveData(data: string, userId: string): Promise<{ encrypted: string; iv: string }> {
    const userKey = await this.encryptionService.getUserEncryptionKey(userId);
    if (!userKey) {
      throw new Error('User encryption key not found');
    }
    return await this.encryptionService.encryptContent(data, userKey);
  }

  async decryptSensitiveData(encryptedData: string, iv: string, userId: string): Promise<string> {
    const userKey = await this.encryptionService.getUserEncryptionKey(userId);
    if (!userKey) {
      throw new Error('User encryption key not found');
    }
    return await this.encryptionService.decryptContent(encryptedData, iv, userKey);
  }

  // ============================================
  // SECURE API KEY MANAGEMENT
  // ============================================

  async storeEncryptedAPIKey(userId: string, service: string, apiKey: string): Promise<void> {
    const { encrypted, iv } = await this.encryptSensitiveData(apiKey, userId);

    const { error } = await this.supabase
      .from('profiles')
      .update({
        [`${service}_api_key_encrypted`]: encrypted,
        [`${service}_api_key_iv`]: iv,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to store encrypted API key: ${error.message}`);
    }
  }

  async getDecryptedAPIKey(userId: string, service: string): Promise<string | null> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select(`${service}_api_key_encrypted, ${service}_api_key_iv`)
      .eq('id', userId)
      .single();

    if (!profile || !profile[`${service}_api_key_encrypted`]) {
      return null;
    }

    return await this.decryptSensitiveData(
      profile[`${service}_api_key_encrypted`],
      profile[`${service}_api_key_iv`],
      userId
    );
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  async logAIInteraction(security: AIRequestSecurity): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      userId: security.userId,
      action: 'ai_request',
      resource: security.feature,
      timestamp: security.timestamp,
      ipAddress: security.ipAddress,
      userAgent: security.userAgent,
      metadata: {
        requestId: security.requestId,
        tokens: security.tokens,
        cost: security.cost,
        model: security.model,
        promptLength: security.prompt.length,
        sanitizedPromptLength: security.sanitizedPrompt.length
      },
      securityLevel: this.determineSecurityLevel(security)
    };

    // Store in audit log table (if it exists)
    const { error } = await this.supabase
      .from('ai_usage_logs')
      .insert({
        user_id: security.userId,
        model_used: security.model,
        operation_type: 'ai_request',
        feature_used: security.feature,
        tokens_input: security.tokens,
        tokens_output: 0,
        cost_cents: Math.round(security.cost * 100),
        latency_ms: 0,
        cache_hit: false,
        fallback_used: false
      });

    if (error) {
      console.error('Failed to log AI interaction:', error);
    }
  }

  private determineSecurityLevel(security: AIRequestSecurity): 'low' | 'medium' | 'high' | 'critical' {
    // Determine security level based on request characteristics
    if (security.feature.includes('vision') || security.feature.includes('ocr')) {
      return 'high';
    }
    
    if (security.tokens > 5000 || security.cost > 1.0) {
      return 'medium';
    }
    
    if (security.prompt.length > 5000) {
      return 'medium';
    }
    
    return 'low';
  }

  // ============================================
  // SECURITY CONTEXT CREATION
  // ============================================

  createSecurityContext(authContext: PraxisAuthContext): {
    isEncryptionEnabled: boolean;
    canAccessSensitiveData: boolean;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
    allowedFeatures: string[];
    rateLimitInfo: {
      dailyLimit: number;
      remaining: number;
    };
  } {
    const subscription = authContext.subscription;
    const limits = subscription.limits;

    return {
      isEncryptionEnabled: authContext.security.isEncryptionEnabled,
      canAccessSensitiveData: authContext.security.canAccessSensitiveData,
      auditLevel: authContext.security.auditLevel,
      allowedFeatures: Array.isArray(limits.features) ? limits.features : 
                     limits.features === 'all' ? ['all'] : [],
      rateLimitInfo: {
        dailyLimit: limits.ai_requests_per_day,
        remaining: limits.ai_requests_per_day - subscription.usage.ai_requests_today
      }
    };
  }

  // ============================================
  // SECURITY VALIDATION HELPERS
  // ============================================

  async validateUserAccess(userId: string, resource: string): Promise<boolean> {
    // Check if user has access to specific resources
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('subscription_tier, data_retention_days')
      .eq('id', userId)
      .single();

    if (!profile) {
      return false;
    }

    // Additional security checks based on subscription tier
    const tier = profile.subscription_tier;
    
    if (tier === 'free' && resource.includes('premium')) {
      return false;
    }

    return true;
  }

  async checkDataRetention(userId: string): Promise<{
    canRetainData: boolean;
    retentionDays: number;
  }> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('data_retention_days, subscription_tier')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { canRetainData: false, retentionDays: 0 };
    }

    const retentionDays = profile.data_retention_days || 365;
    const canRetainData = profile.subscription_tier !== 'free' || retentionDays <= 30;

    return { canRetainData, retentionDays };
  }
}
