// Simple Local Development Server for Praxis-AI Backend
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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
      ai: {
        description: 'AI Orchestrator endpoints (coming soon)',
        note: 'Full tRPC integration will be available once environment is configured'
      }
    },
    setup: {
      step1: 'Configure .env file with API keys',
      step2: 'Run: npm run dev:full',
      step3: 'Access full tRPC API at /trpc/*'
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = process.env.PORT || 3000;

console.log('🚀 Starting Praxis-AI Backend Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Server will be available at: http://localhost:${port}`);
console.log(`📚 API Documentation: http://localhost:${port}/docs`);
console.log(`❤️  Health Check: http://localhost:${port}/health`);
console.log('');

serve({
  fetch: app.fetch,
  port: Number(port),
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  /              - API information`);
  console.log(`   GET  /health        - Health check`);
  console.log(`   GET  /docs          - API documentation`);
  console.log('');
  console.log('🔧 To enable full tRPC API:');
  console.log('   1. Configure .env file with API keys');
  console.log('   2. Run: npm run dev:full');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
