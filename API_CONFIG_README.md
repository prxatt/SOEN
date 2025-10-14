# Soen API Configuration

This comprehensive API configuration provides real backend integration for Soen with Mira AI, replacing all mock API calls with production-ready endpoints.

## 🎯 **API Overview**

The API configuration includes:
- **Real Backend Integration** with Cloudflare Workers
- **Mira AI Service** integration for all AI-powered features
- **Comprehensive API Client** with error handling and authentication
- **All Service APIs** (Notes, Tasks, Projects, Goals, Voice, Vision, Integrations)
- **WebSocket Support** for real-time features

## 🚀 **Key Features**

### **API Client**
- ✅ **Authentication**: JWT token management
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Request Helpers**: GET, POST, PUT, DELETE, PATCH methods
- ✅ **Headers**: Automatic versioning and client type headers
- ✅ **Interceptors**: Request/response interceptors for common functionality

### **Mira AI Integration**
- ✅ **Real AI Processing**: Direct integration with Mira AI backend
- ✅ **Context Support**: Full context and file support
- ✅ **Priority Handling**: Request priority management
- ✅ **User Association**: Automatic user ID association

### **Service APIs**
- ✅ **Authentication**: Login, register, logout, refresh token
- ✅ **Profile Management**: User profile and Mira AI settings
- ✅ **Notes**: CRUD operations with Notion sync
- ✅ **Tasks**: Task management with Mira AI insights
- ✅ **Projects**: Project management with status reports
- ✅ **Goals**: Goal tracking and management
- ✅ **Voice**: Real-time voice conversation sessions
- ✅ **Vision**: Image processing and analysis
- ✅ **Integrations**: Gmail and Notion integration APIs

## 📋 **API Endpoints**

### **Authentication Endpoints**
```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }

// Register
POST /api/auth/register
Body: { email: string, password: string, fullName: string }

// Logout
POST /api/auth/logout

// Get Current User
GET /api/auth/me

// Refresh Token
POST /api/auth/refresh
```

### **Mira AI Endpoints**
```typescript
// Process AI Request
POST /api/mira/process
Body: {
  featureType: string,
  message: string,
  context: object,
  priority: string,
  userId: string,
  files: array
}
```

### **Notes Endpoints**
```typescript
// Get Notes
GET /api/notes?notebookId=number

// Get Single Note
GET /api/notes/:id

// Create Note
POST /api/notes
Body: { title: string, content: string, notebookId: number, tags: string[] }

// Update Note
PUT /api/notes/:id

// Delete Note
DELETE /api/notes/:id

// Search Notes
GET /api/notes/search?q=string

// Sync to Notion
POST /api/notes/:id/sync/notion
```

### **Tasks Endpoints**
```typescript
// Get Tasks
GET /api/tasks?status=string&category=string&date=string

// Get Single Task
GET /api/tasks/:id

// Create Task
POST /api/tasks
Body: { title: string, category: string, startTime: string, plannedDuration: number }

// Update Task
PUT /api/tasks/:id

// Delete Task
DELETE /api/tasks/:id

// Complete Task
PATCH /api/tasks/:id/complete
Body: { actualDuration: number, notes: string, completionImageUrl: string }

// Get Task Insights
GET /api/tasks/:id/insights
```

### **Voice Conversation Endpoints**
```typescript
// Start Voice Session
POST /api/voice/sessions
Body: { personalityMode: string }

// End Voice Session
DELETE /api/voice/sessions/:id

// Get Voice Session
GET /api/voice/sessions/:id

// Update Personality Mode
PATCH /api/voice/sessions/:id/personality
Body: { personalityMode: string }

// WebSocket Connection
WS /api/voice/sessions/:id/ws?token=string
```

### **Vision AI Endpoints**
```typescript
// Process Handwritten Note
POST /api/vision/handwritten-note
Body: { imageBase64: string, mimeType: string }

// Detect Event from Image
POST /api/vision/detect-event
Body: { imageBase64: string, mimeType: string }

// Extract Text from Document
POST /api/vision/extract-text
Body: { imageBase64: string, mimeType: string }

// Analyze Image Content
POST /api/vision/analyze
Body: { imageBase64: string, mimeType: string, analysisType: string }
```

### **Integration Endpoints**
```typescript
// Gmail Integration
POST /api/gmail/setup
GET /api/gmail/status
GET /api/gmail/events
POST /api/gmail/events/:id/confirm
POST /api/gmail/events/:id/reject
DELETE /api/gmail/watch

// Notion Integration
POST /api/notion/setup
GET /api/notion/status
POST /api/notion/sync/note/:id
GET /api/notion/sync/status
```

## 🔧 **Usage Examples**

### **Basic API Usage**
```typescript
import { soenAPI } from './config/api';

// Authentication
const user = await soenAPI.auth.login('user@example.com', 'password');
const profile = await soenAPI.profile.getProfile();

// Notes
const notes = await soenAPI.notes.getNotes();
const newNote = await soenAPI.notes.createNote({
  title: 'My Note',
  content: 'Note content',
  notebookId: 1
});

// Tasks
const tasks = await soenAPI.tasks.getTasks();
const newTask = await soenAPI.tasks.createTask({
  title: 'My Task',
  category: 'Work',
  startTime: '2024-01-01T09:00:00Z',
  plannedDuration: 60
});
```

### **Mira AI Integration**
```typescript
import { miraRequest } from './config/api';

// Process AI request
const response = await miraRequest('task_insights', {
  instruction: 'Analyze this task and provide insights',
  context: { taskId: 123, userId: 'user-123' },
  priority: 'high'
});

// Voice conversation
const voiceSession = await soenAPI.voice.startVoiceSession('supportive');
const ws = soenAPI.websocket.connectVoiceSession(voiceSession.id);
```

### **File Upload**
```typescript
import { soenAPI } from './config/api';

// Upload image
const file = document.getElementById('fileInput').files[0];
const uploadResult = await soenAPI.files.uploadFile(file, 'image');

// Process with vision AI
const analysis = await soenAPI.vision.analyzeImageContent(
  uploadResult.imageBase64,
  uploadResult.mimeType,
  'productivity'
);
```

### **Real-time Features**
```typescript
import { soenAPI } from './config/api';

// Connect to voice session WebSocket
const voiceWs = soenAPI.websocket.connectVoiceSession(sessionId);
voiceWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'transcription_update') {
    updateTranscriptionDisplay(data.line);
  }
};

// Connect to notifications WebSocket
const notificationWs = soenAPI.websocket.connectNotifications();
notificationWs.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
};
```

## 🔐 **Authentication**

### **Token Management**
```typescript
// Automatic token handling
const token = localStorage.getItem('soen-auth-token');

// Token refresh
const refreshed = await soenAPI.auth.refreshToken();

// Logout
await soenAPI.auth.logout();
```

### **Error Handling**
```typescript
// Automatic error handling
try {
  const data = await soenAPI.notes.getNotes();
} catch (error) {
  // Error is automatically handled by handleAPIError
  // 401 errors redirect to login
  // 403 errors show access denied
  // 429 errors show rate limit message
  // 500 errors show server error message
}
```

## 📊 **API Client Features**

### **Request Helpers**
```typescript
// GET request with query parameters
const data = await apiClient.get('/api/notes', { notebookId: 1 });

// POST request with body
const result = await apiClient.post('/api/tasks', taskData);

// PUT request with body
const updated = await apiClient.put('/api/notes/123', noteData);

// DELETE request
await apiClient.delete('/api/tasks/123');

// PATCH request with body
const patched = await apiClient.patch('/api/tasks/123/complete', completionData);
```

### **Headers and Configuration**
```typescript
// Automatic headers
'Content-Type': 'application/json'
'Authorization': 'Bearer token'
'X-Soen-Version': '1.0.0'
'X-Client-Type': 'web'
```

## 🌐 **WebSocket Integration**

### **Voice Session WebSocket**
```typescript
const ws = soenAPI.websocket.connectVoiceSession(sessionId);

ws.onopen = () => {
  console.log('Voice session connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'transcription_update':
      updateTranscription(data.line);
      break;
    case 'audio_delta':
      playAudioChunk(data.delta);
      break;
    case 'animation_update':
      updateMiraAnimation(data.state);
      break;
    case 'response_complete':
      handleResponseComplete(data);
      break;
  }
};
```

### **Notifications WebSocket**
```typescript
const ws = soenAPI.websocket.connectNotifications();

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
};
```

## 🔧 **Configuration**

### **Environment Variables**
```env
VITE_API_URL=https://soen-backend.your-domain.workers.dev
```

### **Base URL Configuration**
```typescript
// Default development URL
const API_BASE_URL = 'http://localhost:8787';

// Production URL
const API_BASE_URL = 'https://soen-backend.your-domain.workers.dev';
```

## 🚀 **Integration with Services**

### **Mira AI Service**
```typescript
// Direct Mira AI integration
const miraResponse = await miraRequest('task_insights', {
  instruction: 'Analyze this task',
  context: { taskId: 123 },
  priority: 'high',
  userId: 'user-123'
});
```

### **Voice Conversation Service**
```typescript
// Start voice session
const session = await soenAPI.voice.startVoiceSession('supportive');

// Connect WebSocket
const ws = soenAPI.websocket.connectVoiceSession(session.id);

// Update personality
await soenAPI.voice.updatePersonalityMode(session.id, 'analytical');
```

### **Vision AI Service**
```typescript
// Process handwritten note
const ocrResult = await soenAPI.vision.processHandwrittenNote(
  imageBase64,
  'image/jpeg'
);

// Detect event from image
const eventData = await soenAPI.vision.detectEventFromImage(
  imageBase64,
  'image/png'
);
```

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Request Caching**: Implement intelligent caching for API responses
- **Offline Support**: Cache responses for offline functionality
- **Batch Operations**: Support for batch API operations
- **Real-time Sync**: WebSocket-based real-time data synchronization

### **Performance Optimizations**
- **Request Deduplication**: Prevent duplicate requests
- **Pagination**: Efficient data pagination
- **Compression**: Request/response compression
- **Connection Pooling**: Optimize connection management

This comprehensive API configuration provides a production-ready foundation for Soen with Mira AI integration, supporting all the advanced features we've implemented while maintaining high performance, security, and reliability.
