import OpenAI from 'openai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createClient } from 'deepgram';
import { MiraAnimationState, TranscriptionLine, VoiceSession } from '../types';

// Mock Supabase client - replace with actual implementation
const supabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    })
  })
};

class VoiceConversationService {
  private sessions: Map<string, VoiceSession> = new Map();
  private realtimeClient: any; // OpenAI Realtime API client
  private elevenLabs: ElevenLabsClient;
  private deepgram: any;

  constructor() {
    // Initialize OpenAI Realtime API client
    this.realtimeClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowAPIKeyInBrowser: false
    });
    
    // Initialize ElevenLabs client
    this.elevenLabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    
    // Initialize Deepgram client
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }

  async startVoiceSession(userId: string, personalityMode: string): Promise<VoiceSession> {
    const sessionId = crypto.randomUUID();
    
    // Get user's Mira personality settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('mira_voice_preference, mira_personality_mode')
      .eq('id', userId)
      .single();

    const session: VoiceSession = {
      id: sessionId,
      userId,
      isActive: true,
      miraAnimationState: {
        current: 'idle',
        emotion: this.mapPersonalityToEmotion(profile?.mira_personality_mode || 'supportive')
      },
      transcription: [],
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);

    // Initialize WebSocket connection for real-time communication
    await this.initializeRealtimeConnection(session, profile);

    // Save session to database
    await supabase.from('voice_sessions').insert({
      id: sessionId,
      user_id: userId,
      voice_service_provider: 'openai_realtime',
      created_at: new Date().toISOString()
    });

    return session;
  }

  private async initializeRealtimeConnection(session: VoiceSession, profile: any) {
    try {
      // Configure OpenAI Realtime API
      // Note: This is a simplified implementation. In production, you'd use the actual Realtime API
      console.log('Initializing realtime connection for session:', session.id);

      // Set voice and instructions based on user preference
      const voiceMap = {
        'neutral': 'alloy',
        'energetic': 'shimmer',
        'calm': 'echo',
        'professional': 'onyx'
      };

      // Configure session parameters
      const sessionConfig = {
        modalities: ['text', 'audio'],
        voice: voiceMap[profile?.mira_voice_preference || 'neutral'],
        instructions: this.buildVoiceInstructions(profile?.mira_personality_mode),
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad', // Voice Activity Detection
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      };

      // Set up event handlers
      this.setupRealtimeEventHandlers(session);
    } catch (error) {
      console.error('Error initializing realtime connection:', error);
      throw error;
    }
  }

  private setupRealtimeEventHandlers(session: VoiceSession) {
    // User starts speaking
    this.onUserSpeechStart(session.id);
    
    // Real-time transcription of user speech (word by word)
    this.onUserTranscriptionComplete(session);
    
    // Mira starts responding (audio delta streaming)
    this.onMiraResponseStart(session);
    
    // Real-time transcription of Mira's speech (word by word)
    this.onMiraTranscriptionDelta(session);
    
    // Mira finishes response
    this.onMiraResponseComplete(session);
    
    // Handle errors
    this.onError(session);
  }

  private onUserSpeechStart(sessionId: string) {
    this.updateMiraAnimation(sessionId, {
      current: 'listening',
      emotion: 'focused'
    });
    
    this.broadcastToClient(sessionId, {
      type: 'animation_update',
      state: { current: 'listening', emotion: 'focused' }
    });
  }

  private onUserTranscriptionComplete(session: VoiceSession) {
    // Simulate transcription completion
    const transcriptionLine: TranscriptionLine = {
      role: 'user',
      text: 'User speech transcribed',
      timestamp: Date.now(),
      confidence: 0.9,
      isPartial: false
    };

    session.transcription.push(transcriptionLine);
    
    this.broadcastToClient(session.id, {
      type: 'transcription_update',
      line: transcriptionLine
    });

    // Mira transitions to thinking
    this.updateMiraAnimation(session.id, {
      current: 'thinking',
      emotion: 'focused'
    });
  }

  private onMiraResponseStart(session: VoiceSession) {
    // Calculate mouth movement from audio amplitude
    const mockAudioBuffer = new ArrayBuffer(1024);
    const mouthMovement = this.calculateMouthMovement(mockAudioBuffer);
    
    this.updateMiraAnimation(session.id, {
      current: 'speaking',
      emotion: this.detectEmotionFromAudio(mockAudioBuffer),
      mouthMovement
    });

    // Stream audio to client
    this.broadcastToClient(session.id, {
      type: 'audio_delta',
      delta: 'mock_audio_delta'
    });
  }

  private onMiraTranscriptionDelta(session: VoiceSession) {
    const partialLine: TranscriptionLine = {
      role: 'mira',
      text: 'Mira response delta',
      timestamp: Date.now(),
      confidence: 0.95,
      isPartial: true
    };

    this.broadcastToClient(session.id, {
      type: 'transcription_update',
      line: partialLine
    });
  }

  private onMiraResponseComplete(session: VoiceSession) {
    const fullTranscript = 'Mira response complete';
    
    // Save complete transcription
    const completeLine: TranscriptionLine = {
      role: 'mira',
      text: fullTranscript,
      timestamp: Date.now(),
      confidence: 0.95,
      isPartial: false
    };

    session.transcription.push(completeLine);

    // Save to database (encrypted)
    this.saveVoiceTranscription(session.id, session.transcription);

    // Mira returns to idle
    this.updateMiraAnimation(session.id, {
      current: 'idle',
      emotion: 'neutral'
    });

    this.broadcastToClient(session.id, {
      type: 'response_complete',
      transcription: completeLine,
      animation: { current: 'idle', emotion: 'neutral' }
    });
  }

  private onError(session: VoiceSession) {
    console.error('Realtime API error for session:', session.id);
    
    this.updateMiraAnimation(session.id, {
      current: 'error',
      emotion: 'neutral'
    });

    this.broadcastToClient(session.id, {
      type: 'error',
      message: 'Sorry, I encountered an issue. Let me try again.'
    });
  }

  private buildVoiceInstructions(personalityMode: string): string {
    const baseInstructions = `You are Mira, an AI assistant for Soen. You help users with productivity, task management, and strategic planning.`;

    const personalityInstructions = {
      supportive: "Be warm, encouraging, and empathetic. Celebrate their progress and offer gentle guidance.",
      tough_love: "Be direct and challenging. Push them to their potential and hold them accountable.",
      analytical: "Be logical and data-driven. Provide structured analysis and optimization strategies.",
      motivational: "Be energetic and inspiring. Use motivational language and action-oriented suggestions."
    };

    const voiceSpecificInstructions = `

IMPORTANT VOICE GUIDELINES:
- Keep responses concise (2-3 sentences max unless explaining something complex)
- Speak naturally as if in conversation
- Use contractions and casual language
- Pause naturally between thoughts
- Express emotion through tone, not just words
- Ask follow-up questions to keep conversation flowing
`;

    return baseInstructions + '\n\n' + (personalityInstructions[personalityMode] || personalityInstructions.supportive) + voiceSpecificInstructions;
  }

  private calculateMouthMovement(audioBuffer: ArrayBuffer): any {
    // Analyze audio amplitude for lip-sync
    const dataView = new DataView(audioBuffer);
    let sum = 0;
    
    for (let i = 0; i < dataView.byteLength; i += 2) {
      sum += Math.abs(dataView.getInt16(i, true));
    }
    
    const amplitude = sum / (dataView.byteLength / 2);
    const normalized = Math.min(amplitude / 32768, 1);

    // Determine mouth shape based on amplitude patterns
    let shape: 'o' | 'a' | 'ee' | 'closed' = 'closed';
    if (normalized > 0.7) shape = 'o';
    else if (normalized > 0.4) shape = 'a';
    else if (normalized > 0.2) shape = 'ee';

    return {
      openness: normalized,
      shape
    };
  }

  private detectEmotionFromAudio(audioBuffer: ArrayBuffer): string {
    // Simple emotion detection based on audio characteristics
    // In production, use a more sophisticated model
    const amplitude = this.getAudioAmplitude(audioBuffer);
    
    if (amplitude > 0.8) return 'happy';
    if (amplitude > 0.6) return 'encouraging';
    if (amplitude < 0.3) return 'serious';
    return 'neutral';
  }

  private getAudioAmplitude(audioBuffer: ArrayBuffer): number {
    const dataView = new DataView(audioBuffer);
    let sum = 0;
    
    for (let i = 0; i < dataView.byteLength; i += 2) {
      sum += Math.abs(dataView.getInt16(i, true));
    }
    
    return (sum / (dataView.byteLength / 2)) / 32768;
  }

  private updateMiraAnimation(sessionId: string, state: Partial<MiraAnimationState>) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.miraAnimationState = {
      ...session.miraAnimationState,
      ...state
    };
  }

  private mapPersonalityToEmotion(personality: string): string {
    const mapping = {
      supportive: 'encouraging',
      tough_love: 'serious',
      analytical: 'focused',
      motivational: 'happy'
    };
    return mapping[personality] || 'neutral';
  }

  private async saveVoiceTranscription(sessionId: string, transcription: TranscriptionLine[]) {
    try {
      // Encrypt transcription before saving
      const transcriptText = transcription
        .filter(t => !t.isPartial)
        .map(t => `${t.role}: ${t.text}`)
        .join('\n');

      const { encrypted, iv } = await this.encryptData(transcriptText);

      await supabase
        .from('voice_sessions')
        .update({
          transcript_encrypted: encrypted,
          transcript_iv: iv,
          realtime_transcription: transcription,
          duration_seconds: Math.round((Date.now() - transcription[0].timestamp) / 1000)
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error saving voice transcription:', error);
    }
  }

  private async encryptData(data: string): Promise<{encrypted: string; iv: string}> {
    try {
      // Use AES-256-GCM encryption
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(data);

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
      console.error('Error encrypting data:', error);
      return {
        encrypted: '',
        iv: ''
      };
    }
  }

  private broadcastToClient(sessionId: string, message: any) {
    // Send via WebSocket to connected client
    // Implementation depends on your WebSocket setup
    // Could use Socket.io, ws, or Supabase Realtime
    console.log(`Broadcasting to session ${sessionId}:`, message);
  }

  async endVoiceSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.endedAt = new Date();
    
    // Save final state
    await supabase
      .from('voice_sessions')
      .update({ 
        audio_url: null, // Could upload recorded audio if needed
        mira_animation_states: session.miraAnimationState,
        ended_at: session.endedAt.toISOString()
      })
      .eq('id', sessionId);

    this.sessions.delete(sessionId);
  }

  // Additional utility methods
  async getActiveSessions(userId: string): Promise<VoiceSession[]> {
    const userSessions: VoiceSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  async getSessionTranscription(sessionId: string): Promise<TranscriptionLine[]> {
    const session = this.sessions.get(sessionId);
    return session ? session.transcription : [];
  }

  async updatePersonalityMode(sessionId: string, personalityMode: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.miraAnimationState.emotion = this.mapPersonalityToEmotion(personalityMode);
    
    // Update instructions for the session
    // This would require reinitializing the realtime connection
    console.log(`Updated personality mode to ${personalityMode} for session ${sessionId}`);
  }
}

export const voiceConversationService = new VoiceConversationService();
