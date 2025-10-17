// test-orchestrator.js
// Simple test script to verify AI orchestrator integration

import { aiOrchestrator } from './services/aiOrchestrator.js';

async function testOrchestrator() {
  console.log('🧪 Testing AI Orchestrator...\n');

  try {
    // Test with a simple request
    const testRequest = {
      userId: 'test-user-123',
      message: 'Hello, can you help me create a task for buying groceries?',
      context: {
        conversationHistory: [],
        userGoals: [],
        recentTasks: [],
        recentNotes: [],
        userProfile: {
          id: 'test-user-123',
          mira_personality_mode: 'supportive',
          subscription_tier: 'free',
          daily_ai_requests: 0
        },
        currentTime: new Date(),
        location: 'San Francisco'
      },
      featureType: 'mira_chat',
      priority: 'medium'
    };

    console.log('📤 Sending test request...');
    const response = await aiOrchestrator.processRequest(testRequest);
    
    console.log('✅ Success! Response received:');
    console.log(`📝 Content: ${response.content.substring(0, 100)}...`);
    console.log(`🤖 Model Used: ${response.modelUsed}`);
    console.log(`💰 Cost: ${response.costCents} cents`);
    console.log(`⚡ Processing Time: ${response.processingTimeMs}ms`);
    console.log(`🎯 Confidence: ${response.confidence}`);
    console.log(`💾 Cache Hit: ${response.cacheHit}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your .env file has the required API keys');
    console.log('2. Check that your Supabase connection is working');
    console.log('3. Verify your API keys are valid');
  }
}

testOrchestrator();