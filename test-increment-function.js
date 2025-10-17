// test-increment-function.js
// Test script to verify the increment_ai_requests RPC function works

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://afowfefzjonwbqtthacq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIncrementFunction() {
  console.log('🧪 Testing increment_ai_requests RPC function...\n');

  try {
    // First, get a test user (or create one if needed)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to get users:', usersError);
      return;
    }

    if (!users.users || users.users.length === 0) {
      console.log('⚠️  No users found. Creating a test user...');
      
      // Create a test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'testpassword123',
        email_confirm: true
      });

      if (createError) {
        console.error('❌ Failed to create test user:', createError);
        return;
      }

      console.log('✅ Test user created:', newUser.user.id);
      var testUserId = newUser.user.id;
    } else {
      testUserId = users.users[0].id;
      console.log('✅ Using existing user:', testUserId);
    }

    // Get current AI request count
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_ai_requests, monthly_ai_requests')
      .eq('user_id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Failed to get user profile:', profileError);
      return;
    }

    console.log('📊 Current counts:');
    console.log(`   Daily AI requests: ${profile.daily_ai_requests}`);
    console.log(`   Monthly AI requests: ${profile.monthly_ai_requests}\n`);

    // Test the increment function
    console.log('🔄 Calling increment_ai_requests RPC function...');
    const { error: incrementError } = await supabase.rpc('increment_ai_requests', {
      p_user_id: testUserId
    });

    if (incrementError) {
      console.error('❌ RPC function failed:', incrementError);
      return;
    }

    console.log('✅ RPC function executed successfully!\n');

    // Check updated counts
    const { data: updatedProfile, error: updatedError } = await supabase
      .from('profiles')
      .select('daily_ai_requests, monthly_ai_requests')
      .eq('user_id', testUserId)
      .single();

    if (updatedError) {
      console.error('❌ Failed to get updated profile:', updatedError);
      return;
    }

    console.log('📊 Updated counts:');
    console.log(`   Daily AI requests: ${updatedProfile.daily_ai_requests} (was ${profile.daily_ai_requests})`);
    console.log(`   Monthly AI requests: ${updatedProfile.monthly_ai_requests} (was ${profile.monthly_ai_requests})`);

    // Verify the increment worked
    if (updatedProfile.daily_ai_requests === profile.daily_ai_requests + 1 &&
        updatedProfile.monthly_ai_requests === profile.monthly_ai_requests + 1) {
      console.log('\n🎉 SUCCESS: increment_ai_requests function is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Counts did not increment as expected');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testIncrementFunction();
