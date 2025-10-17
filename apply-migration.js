#!/usr/bin/env node
// apply-migration.js
// Simple script to help apply the increment_ai_requests migration

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Soen Database Migration Helper');
console.log('=====================================\n');

console.log('📋 Migration to apply: increment_ai_requests RPC function\n');

try {
  // Read the migration file
  const migrationPath = join(__dirname, 'migrations', 'add_increment_ai_requests_function.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  
  console.log('✅ Migration file found:', migrationPath);
  console.log('\n📝 Migration SQL:');
  console.log('==================');
  console.log(migrationSQL);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase Dashboard → SQL Editor');
  console.log('3. Paste the SQL and click "Run"');
  console.log('4. Verify with: npm run test:rpc');
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}
