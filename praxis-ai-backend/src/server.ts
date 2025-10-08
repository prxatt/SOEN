// Local Development Server for Praxis-AI Backend
import { serve } from '@hono/node-server';
import app from './app';

const port = process.env.PORT || 3000;

console.log('🚀 Starting Praxis-AI Backend Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Server will be available at: http://localhost:${port}`);
console.log(`📚 API Documentation: http://localhost:${port}/docs`);
console.log(`❤️  Health Check: http://localhost:${port}/health`);
console.log(`🔗 tRPC Endpoint: http://localhost:${port}/trpc`);
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
  console.log(`   POST /trpc/*        - tRPC API endpoints`);
  console.log('');
  console.log('🤖 AI Orchestrator endpoints:');
  console.log(`   POST /trpc/ai.processRequest`);
  console.log(`   POST /trpc/ai.chatWithKiko`);
  console.log(`   POST /trpc/ai.parseTask`);
  console.log(`   POST /trpc/ai.generateStrategicBriefing`);
  console.log(`   POST /trpc/ai.generateMindMap`);
  console.log(`   POST /trpc/ai.researchWithSources`);
  console.log(`   POST /trpc/ai.analyzeImage`);
  console.log(`   GET  /trpc/ai.getUsageStats`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
