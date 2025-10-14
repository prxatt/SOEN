// Soen API Configuration
// Real backend API client for Soen with Mira AI integration

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://soen-backend.your-domain.workers.dev';

// API Client Configuration
export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('soen-auth-token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Soen-Version': '1.0.0',
        'X-Client-Type': 'web',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // GET request helper
  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return this.request(url.pathname + url.search, { method: 'GET' });
  },

  // POST request helper
  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  // PUT request helper
  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  // DELETE request helper
  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // PATCH request helper
  async patch(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }
};

// Mira AI Service Integration
export const miraRequest = async (taskType: string, payload: any) => {
  return await apiClient.request('/api/mira/process', {
    method: 'POST',
    body: JSON.stringify({
      featureType: taskType,
      message: payload.instruction || payload.prompt || payload.message,
      context: payload.context || {},
      priority: payload.priority || 'medium',
      userId: payload.userId || localStorage.getItem('soen-user-id'),
      files: payload.files || []
    })
  });
};

// Authentication API
export const authAPI = {
  // Login with email and password
  async login(email: string, password: string) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('soen-auth-token', response.token);
      localStorage.setItem('soen-user-id', response.user.id);
    }
    return response;
  },

  // Register new user
  async register(userData: { email: string; password: string; fullName: string }) {
    const response = await apiClient.post('/api/auth/register', userData);
    if (response.token) {
      localStorage.setItem('soen-auth-token', response.token);
      localStorage.setItem('soen-user-id', response.user.id);
    }
    return response;
  },

  // Logout user
  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('soen-auth-token');
      localStorage.removeItem('soen-user-id');
    }
  },

  // Get current user
  async getCurrentUser() {
    return await apiClient.get('/api/auth/me');
  },

  // Refresh token
  async refreshToken() {
    const response = await apiClient.post('/api/auth/refresh');
    if (response.token) {
      localStorage.setItem('soen-auth-token', response.token);
    }
    return response;
  }
};

// User Profile API
export const profileAPI = {
  // Get user profile
  async getProfile() {
    return await apiClient.get('/api/profile');
  },

  // Update user profile
  async updateProfile(profileData: any) {
    return await apiClient.put('/api/profile', profileData);
  },

  // Update Mira AI settings
  async updateMiraSettings(settings: {
    personalityMode?: string;
    voicePreference?: string;
  }) {
    return await apiClient.patch('/api/profile/mira-settings', settings);
  },

  // Get Mira AI settings
  async getMiraSettings() {
    return await apiClient.get('/api/profile/mira-settings');
  }
};

// Notes API
export const notesAPI = {
  // Get all notes
  async getNotes(notebookId?: number) {
    return await apiClient.get('/api/notes', { notebookId });
  },

  // Get single note
  async getNote(noteId: number) {
    return await apiClient.get(`/api/notes/${noteId}`);
  },

  // Create new note
  async createNote(noteData: {
    title: string;
    content: string;
    notebookId: number;
    tags?: string[];
  }) {
    return await apiClient.post('/api/notes', noteData);
  },

  // Update note
  async updateNote(noteId: number, noteData: any) {
    return await apiClient.put(`/api/notes/${noteId}`, noteData);
  },

  // Delete note
  async deleteNote(noteId: number) {
    return await apiClient.delete(`/api/notes/${noteId}`);
  },

  // Search notes
  async searchNotes(query: string) {
    return await apiClient.get('/api/notes/search', { q: query });
  },

  // Sync note to Notion
  async syncToNotion(noteId: number) {
    return await apiClient.post(`/api/notes/${noteId}/sync/notion`);
  }
};

// Tasks API
export const tasksAPI = {
  // Get all tasks
  async getTasks(filters?: {
    status?: string;
    category?: string;
    date?: string;
  }) {
    return await apiClient.get('/api/tasks', filters);
  },

  // Get single task
  async getTask(taskId: number) {
    return await apiClient.get(`/api/tasks/${taskId}`);
  },

  // Create new task
  async createTask(taskData: {
    title: string;
    category: string;
    startTime: string;
    plannedDuration: number;
    location?: string;
    notes?: string;
  }) {
    return await apiClient.post('/api/tasks', taskData);
  },

  // Update task
  async updateTask(taskId: number, taskData: any) {
    return await apiClient.put(`/api/tasks/${taskId}`, taskData);
  },

  // Delete task
  async deleteTask(taskId: number) {
    return await apiClient.delete(`/api/tasks/${taskId}`);
  },

  // Complete task
  async completeTask(taskId: number, completionData?: {
    actualDuration?: number;
    notes?: string;
    completionImageUrl?: string;
  }) {
    return await apiClient.patch(`/api/tasks/${taskId}/complete`, completionData);
  },

  // Get task insights from Mira
  async getTaskInsights(taskId: number) {
    return await apiClient.get(`/api/tasks/${taskId}/insights`);
  }
};

// Notebooks API
export const notebooksAPI = {
  // Get all notebooks
  async getNotebooks() {
    return await apiClient.get('/api/notebooks');
  },

  // Get single notebook
  async getNotebook(notebookId: number) {
    return await apiClient.get(`/api/notebooks/${notebookId}`);
  },

  // Create new notebook
  async createNotebook(notebookData: {
    title: string;
    color: string;
  }) {
    return await apiClient.post('/api/notebooks', notebookData);
  },

  // Update notebook
  async updateNotebook(notebookId: number, notebookData: any) {
    return await apiClient.put(`/api/notebooks/${notebookId}`, notebookData);
  },

  // Delete notebook
  async deleteNotebook(notebookId: number) {
    return await apiClient.delete(`/api/notebooks/${notebookId}`);
  }
};

// Projects API
export const projectsAPI = {
  // Get all projects
  async getProjects() {
    return await apiClient.get('/api/projects');
  },

  // Get single project
  async getProject(projectId: number) {
    return await apiClient.get(`/api/projects/${projectId}`);
  },

  // Create new project
  async createProject(projectData: {
    title: string;
    description: string;
    noteIds?: number[];
  }) {
    return await apiClient.post('/api/projects', projectData);
  },

  // Update project
  async updateProject(projectId: number, projectData: any) {
    return await apiClient.put(`/api/projects/${projectId}`, projectData);
  },

  // Delete project
  async deleteProject(projectId: number) {
    return await apiClient.delete(`/api/projects/${projectId}`);
  },

  // Get project status report from Mira
  async getProjectStatusReport(projectId: number) {
    return await apiClient.get(`/api/projects/${projectId}/status-report`);
  }
};

// Goals API
export const goalsAPI = {
  // Get all goals
  async getGoals() {
    return await apiClient.get('/api/goals');
  },

  // Get single goal
  async getGoal(goalId: number) {
    return await apiClient.get(`/api/goals/${goalId}`);
  },

  // Create new goal
  async createGoal(goalData: {
    term: 'short' | 'mid' | 'long';
    text: string;
    status?: 'active' | 'completed' | 'archived';
  }) {
    return await apiClient.post('/api/goals', goalData);
  },

  // Update goal
  async updateGoal(goalId: number, goalData: any) {
    return await apiClient.put(`/api/goals/${goalId}`, goalData);
  },

  // Delete goal
  async deleteGoal(goalId: number) {
    return await apiClient.delete(`/api/goals/${goalId}`);
  }
};

// Voice Conversation API
export const voiceAPI = {
  // Start voice session
  async startVoiceSession(personalityMode?: string) {
    return await apiClient.post('/api/voice/sessions', { personalityMode });
  },

  // End voice session
  async endVoiceSession(sessionId: string) {
    return await apiClient.delete(`/api/voice/sessions/${sessionId}`);
  },

  // Get voice session
  async getVoiceSession(sessionId: string) {
    return await apiClient.get(`/api/voice/sessions/${sessionId}`);
  },

  // Update personality mode
  async updatePersonalityMode(sessionId: string, personalityMode: string) {
    return await apiClient.patch(`/api/voice/sessions/${sessionId}/personality`, {
      personalityMode
    });
  }
};

// Vision AI API
export const visionAPI = {
  // Process handwritten note
  async processHandwrittenNote(imageBase64: string, mimeType: string) {
    return await apiClient.post('/api/vision/handwritten-note', {
      imageBase64,
      mimeType
    });
  },

  // Detect event from image
  async detectEventFromImage(imageBase64: string, mimeType: string) {
    return await apiClient.post('/api/vision/detect-event', {
      imageBase64,
      mimeType
    });
  },

  // Extract text from document
  async extractTextFromDocument(imageBase64: string, mimeType: string) {
    return await apiClient.post('/api/vision/extract-text', {
      imageBase64,
      mimeType
    });
  },

  // Analyze image content
  async analyzeImageContent(
    imageBase64: string, 
    mimeType: string, 
    analysisType: 'general' | 'productivity' | 'creative' = 'general'
  ) {
    return await apiClient.post('/api/vision/analyze', {
      imageBase64,
      mimeType,
      analysisType
    });
  }
};

// Gmail Integration API
export const gmailAPI = {
  // Setup Gmail integration
  async setupIntegration(authCode: string) {
    return await apiClient.post('/api/gmail/setup', { authCode });
  },

  // Get integration status
  async getIntegrationStatus() {
    return await apiClient.get('/api/gmail/status');
  },

  // Get parsed events
  async getParsedEvents(limit?: number) {
    return await apiClient.get('/api/gmail/events', { limit });
  },

  // Confirm event
  async confirmEvent(gmailEventId: string) {
    return await apiClient.post(`/api/gmail/events/${gmailEventId}/confirm`);
  },

  // Reject event
  async rejectEvent(gmailEventId: string) {
    return await apiClient.post(`/api/gmail/events/${gmailEventId}/reject`);
  },

  // Stop Gmail watch
  async stopWatch() {
    return await apiClient.delete('/api/gmail/watch');
  }
};

// Notion Integration API
export const notionAPI = {
  // Setup Notion integration
  async setupIntegration(apiKey: string, workspaceId: string) {
    return await apiClient.post('/api/notion/setup', { apiKey, workspaceId });
  },

  // Get integration status
  async getIntegrationStatus() {
    return await apiClient.get('/api/notion/status');
  },

  // Sync note to Notion
  async syncNoteToNotion(noteId: number) {
    return await apiClient.post(`/api/notion/sync/note/${noteId}`);
  },

  // Get sync status
  async getSyncStatus() {
    return await apiClient.get('/api/notion/sync/status');
  }
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  async getNotifications(limit?: number) {
    return await apiClient.get('/api/notifications', { limit });
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    return await apiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  async markAllAsRead() {
    return await apiClient.patch('/api/notifications/read-all');
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    return await apiClient.delete(`/api/notifications/${notificationId}`);
  }
};

// Analytics API
export const analyticsAPI = {
  // Get user analytics
  async getUserAnalytics(period?: 'day' | 'week' | 'month' | 'year') {
    return await apiClient.get('/api/analytics/user', { period });
  },

  // Get task analytics
  async getTaskAnalytics(period?: 'day' | 'week' | 'month' | 'year') {
    return await apiClient.get('/api/analytics/tasks', { period });
  },

  // Get productivity insights
  async getProductivityInsights() {
    return await apiClient.get('/api/analytics/productivity');
  }
};

// File Upload API
export const fileAPI = {
  // Upload file
  async uploadFile(file: File, type: 'image' | 'document' | 'audio') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem('soen-auth-token');
    
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Soen-Version': '1.0.0',
        'X-Client-Type': 'web'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete file
  async deleteFile(fileId: string) {
    return await apiClient.delete(`/api/files/${fileId}`);
  },

  // Get file URL
  async getFileUrl(fileId: string) {
    return await apiClient.get(`/api/files/${fileId}/url`);
  }
};

// WebSocket API for real-time features
export const websocketAPI = {
  // Connect to voice session WebSocket
  connectVoiceSession(sessionId: string): WebSocket {
    const token = localStorage.getItem('soen-auth-token');
    const wsUrl = `${API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/voice/sessions/${sessionId}/ws?token=${token}`;
    return new WebSocket(wsUrl);
  },

  // Connect to notifications WebSocket
  connectNotifications(): WebSocket {
    const token = localStorage.getItem('soen-auth-token');
    const wsUrl = `${API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/notifications/ws?token=${token}`;
    return new WebSocket(wsUrl);
  }
};

// Error handling utility
export const handleAPIError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('soen-auth-token');
    localStorage.removeItem('soen-user-id');
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Forbidden - show access denied message
    throw new Error('Access denied. Please check your permissions.');
  } else if (error.message.includes('429')) {
    // Rate limited - show rate limit message
    throw new Error('Rate limit exceeded. Please try again later.');
  } else if (error.message.includes('500')) {
    // Server error - show generic error message
    throw new Error('Server error. Please try again later.');
  } else {
    // Generic error
    throw new Error(error.message || 'An unexpected error occurred.');
  }
};

// Request interceptor for adding common headers and error handling
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    return await apiClient.request(endpoint, options);
  } catch (error) {
    handleAPIError(error);
  }
};

// Export all APIs
export const soenAPI = {
  auth: authAPI,
  profile: profileAPI,
  notes: notesAPI,
  tasks: tasksAPI,
  notebooks: notebooksAPI,
  projects: projectsAPI,
  goals: goalsAPI,
  voice: voiceAPI,
  vision: visionAPI,
  gmail: gmailAPI,
  notion: notionAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  files: fileAPI,
  websocket: websocketAPI,
  mira: miraRequest
};
