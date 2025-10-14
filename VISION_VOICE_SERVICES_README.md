# Vision AI & Voice Conversation Services

This implementation provides advanced AI-powered vision processing and real-time voice conversation capabilities for Soen, featuring Mira as the AI assistant.

## 🎯 **Services Overview**

### 1. Vision AI Service (`services/visionAIService.ts`)
Handles image processing and analysis using Mira's AI capabilities:

- **Handwritten Note OCR**: Extract text from handwritten notes with formatting preservation
- **Event Detection**: Automatically detect and extract event information from images
- **Document OCR**: Extract text from documents while preserving structure
- **Image Analysis**: Analyze images for productivity, creative, or general insights

### 2. Voice Conversation Service (`services/voiceConversationService.ts`)
Provides real-time voice interaction with Mira:

- **Real-time Voice Processing**: Live transcription and response generation
- **Mira Animation States**: Dynamic visual feedback during conversations
- **Personality Modes**: Supportive, tough love, analytical, and motivational personalities
- **Encrypted Storage**: Secure storage of voice session data
- **Lip-sync Animation**: Mouth movement calculation for realistic avatar animation

## 🚀 **Key Features**

### Vision AI Capabilities
- ✅ **Handwritten Text Extraction** with confidence scoring
- ✅ **Event Information Detection** (titles, dates, locations, contacts)
- ✅ **Document Structure Preservation** for forms and tables
- ✅ **Multi-purpose Image Analysis** (general, productivity, creative)
- ✅ **Automatic Tag Extraction** from image content
- ✅ **Insight Generation** from visual content

### Voice Conversation Features
- ✅ **Real-time Transcription** with word-by-word updates
- ✅ **Dynamic Personality System** with emotion mapping
- ✅ **Voice Activity Detection** for natural conversation flow
- ✅ **Audio Streaming** with delta updates
- ✅ **Mira Animation States** (idle, listening, thinking, speaking, success, error)
- ✅ **Encrypted Session Storage** for privacy
- ✅ **Lip-sync Animation** based on audio amplitude

## 📋 **Type Definitions**

### Mira Animation State
```typescript
interface MiraAnimationState {
  current: 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error';
  emotion: 'neutral' | 'happy' | 'focused' | 'encouraging' | 'serious' | 'playful';
  mouthMovement?: {
    openness: number; // 0-1
    shape: 'o' | 'a' | 'ee' | 'closed';
  };
}
```

### Voice Session
```typescript
interface VoiceSession {
  id: string;
  userId: string;
  isActive: boolean;
  miraAnimationState: MiraAnimationState;
  transcription: TranscriptionLine[];
  createdAt: Date;
  endedAt?: Date;
}
```

### Extracted Event Data
```typescript
interface ExtractedEventData {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  contactInfo?: string;
  links?: string[];
  confidence: number;
}
```

## 🔧 **Usage Examples**

### Vision AI Service

#### Process Handwritten Notes
```typescript
import { visionAIService } from '../services/visionAIService';

const result = await visionAIService.processHandwrittenNote(
  userId,
  imageBase64,
  'image/jpeg'
);

console.log('Extracted text:', result.text);
console.log('Confidence:', result.confidence);
```

#### Detect Events from Images
```typescript
const eventData = await visionAIService.detectEventFromImage(
  userId,
  imageBase64,
  'image/png'
);

if (eventData.confidence > 0.7) {
  console.log('Event found:', eventData.title);
  console.log('Date:', eventData.date);
  console.log('Location:', eventData.location);
}
```

#### Analyze Image Content
```typescript
const analysis = await visionAIService.analyzeImageContent(
  userId,
  imageBase64,
  'image/jpeg',
  'productivity' // or 'creative', 'general'
);

console.log('Description:', analysis.description);
console.log('Insights:', analysis.insights);
console.log('Tags:', analysis.tags);
```

### Voice Conversation Service

#### Start Voice Session
```typescript
import { voiceConversationService } from '../services/voiceConversationService';

const session = await voiceConversationService.startVoiceSession(
  userId,
  'supportive' // personality mode
);

console.log('Session started:', session.id);
console.log('Mira animation:', session.miraAnimationState);
```

#### Handle Real-time Events
```typescript
// Listen for animation updates
voiceConversationService.on('animation_update', (state) => {
  updateMiraAvatar(state);
});

// Listen for transcription updates
voiceConversationService.on('transcription_update', (line) => {
  displayTranscription(line);
});

// Listen for audio streaming
voiceConversationService.on('audio_delta', (delta) => {
  playAudioChunk(delta);
});
```

#### End Voice Session
```typescript
await voiceConversationService.endVoiceSession(sessionId);
```

## 🗄️ **Database Schema**

### Voice Sessions Table
```sql
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  voice_service_provider TEXT DEFAULT 'openai_realtime',
  transcript_encrypted TEXT,
  transcript_iv TEXT,
  realtime_transcription JSONB,
  mira_animation_states JSONB,
  duration_seconds INTEGER,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

### Profiles Table Updates
```sql
ALTER TABLE profiles ADD COLUMN mira_voice_preference TEXT DEFAULT 'neutral';
ALTER TABLE profiles ADD COLUMN mira_personality_mode TEXT DEFAULT 'supportive';
```

## 🔐 **Security Features**

### Encryption
- **AES-256-GCM Encryption** for voice transcriptions
- **Secure Key Generation** using Web Crypto API
- **IV (Initialization Vector)** for each encryption operation

### Privacy
- **No Audio Storage** by default (configurable)
- **Encrypted Transcription Storage** in database
- **Session Isolation** per user
- **Automatic Session Cleanup** after completion

## 🎨 **Mira Personality System**

### Personality Modes
1. **Supportive**: Warm, encouraging, empathetic
2. **Tough Love**: Direct, challenging, accountability-focused
3. **Analytical**: Logical, data-driven, structured
4. **Motivational**: Energetic, inspiring, action-oriented

### Emotion Mapping
- **Supportive** → Encouraging
- **Tough Love** → Serious
- **Analytical** → Focused
- **Motivational** → Happy

### Voice Preferences
- **Neutral**: Alloy voice
- **Energetic**: Shimmer voice
- **Calm**: Echo voice
- **Professional**: Onyx voice

## 🔧 **Configuration**

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Voice Activity Detection Settings
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,           // Sensitivity (0-1)
  prefix_padding_ms: 300,   // Pre-speech padding
  silence_duration_ms: 500 // Silence detection
}
```

## 🚀 **Integration Examples**

### React Component Integration
```tsx
import { VoiceConversationWidget } from '../components/VoiceConversationWidget';

<VoiceConversationWidget
  userId={currentUserId}
  personalityMode="supportive"
  onSessionStart={(session) => {
    console.log('Voice session started:', session.id);
  }}
  onTranscriptionUpdate={(line) => {
    updateChatDisplay(line);
  }}
  onAnimationUpdate={(state) => {
    updateMiraAvatar(state);
  }}
/>
```

### Vision Processing Integration
```tsx
import { VisionProcessingWidget } from '../components/VisionProcessingWidget';

<VisionProcessingWidget
  userId={currentUserId}
  onTextExtracted={(text, confidence) => {
    if (confidence > 0.8) {
      addToNotes(text);
    }
  }}
  onEventDetected={(eventData) => {
    if (eventData.confidence > 0.7) {
      createCalendarEvent(eventData);
    }
  }}
/>
```

## 🔮 **Future Enhancements**

### Vision AI
- **Multi-language OCR** support
- **Handwriting Style Recognition** for user identification
- **Document Classification** (invoices, contracts, etc.)
- **QR Code Detection** and processing
- **Face Recognition** for user authentication

### Voice Conversation
- **Custom Voice Cloning** using ElevenLabs
- **Emotion Detection** from user's voice
- **Multi-language Support** with automatic detection
- **Background Noise Filtering** for better accuracy
- **Voice Commands** for app navigation
- **Offline Mode** with local processing

### Integration
- **Real-time Collaboration** with multiple users
- **Voice Notes Integration** with existing note system
- **Calendar Integration** for event creation
- **Task Creation** from voice commands
- **Smart Reminders** based on conversation context

## 🧪 **Testing**

### Unit Tests
```typescript
// Test vision processing
describe('VisionAIService', () => {
  it('should extract text from handwritten notes', async () => {
    const result = await visionAIService.processHandwrittenNote(
      'test-user',
      mockImageBase64,
      'image/jpeg'
    );
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});

// Test voice session management
describe('VoiceConversationService', () => {
  it('should create voice session', async () => {
    const session = await voiceConversationService.startVoiceSession(
      'test-user',
      'supportive'
    );
    expect(session.id).toBeDefined();
    expect(session.isActive).toBe(true);
  });
});
```

### Integration Tests
- **End-to-end voice conversation** flow
- **Image processing** with various formats
- **Error handling** for API failures
- **Performance testing** for real-time processing

## 📊 **Performance Considerations**

### Optimization Strategies
- **Audio Chunking**: Process audio in small chunks for real-time response
- **Caching**: Cache frequently used voice models and configurations
- **Rate Limiting**: Implement rate limiting for API calls
- **Compression**: Compress audio data for efficient transmission
- **Background Processing**: Process non-critical operations asynchronously

### Monitoring
- **Session Duration** tracking
- **API Response Times** monitoring
- **Error Rate** tracking
- **User Engagement** metrics
- **Resource Usage** monitoring

This implementation provides a solid foundation for advanced AI-powered vision and voice capabilities in Soen, with Mira as the intelligent assistant guiding users through their productivity journey.
