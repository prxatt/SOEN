import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { appRouter } from './routers';
import { createTRPCHandler } from './trpc';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Praxis-AI Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      trpc: '/trpc',
      docs: '/docs'
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API documentation endpoint
app.get('/docs', (c) => {
  return c.json({
    title: 'Praxis-AI Backend API Documentation',
    version: '1.0.0',
    description: 'AI-powered productivity platform backend',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      },
      trpc: {
        method: 'POST',
        path: '/trpc/*',
        description: 'tRPC API endpoints'
      },
      ai: {
        description: 'AI Orchestrator endpoints',
        endpoints: [
          'ai.processRequest - Process any AI request',
          'ai.chatWithKiko - Chat with Kiko AI assistant',
          'ai.parseTask - Parse natural language to structured task',
          'ai.generateStrategicBriefing - Generate daily strategic briefing',
          'ai.generateMindMap - Generate mind map from goals/tasks/notes',
          'ai.researchWithSources - Research with web sources',
          'ai.analyzeImage - Analyze images with AI',
          'ai.getUsageStats - Get user AI usage statistics'
        ]
      }
    }
  });
});

// tRPC handler
app.all('/trpc/*', createTRPCHandler(appRouter));

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
