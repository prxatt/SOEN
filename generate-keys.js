#!/usr/bin/env node

/**
 * Simple Encryption Key Generator
 * Run this script to generate secure encryption keys for your Soen app
 * 
 * Usage: node generate-keys.js
 */

import crypto from 'crypto';

console.log('🔐 Generating secure encryption keys for Soen...\n');

// Generate encryption key (64 characters)
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate encryption salt (64 characters)  
const encryptionSalt = crypto.randomBytes(32).toString('hex');

console.log('✅ Your encryption keys have been generated!\n');

console.log('📋 Copy these to your environment variables:\n');

console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('ENCRYPTION_SALT=' + encryptionSalt);

console.log('\n📝 Instructions:');
console.log('1. Copy the ENCRYPTION_KEY line above');
console.log('2. Copy the ENCRYPTION_SALT line above');
console.log('3. Add them to your Vercel environment variables');
console.log('4. Redeploy your application');

console.log('\n🚀 Vercel Setup Steps:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Click on your Soen project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add ENCRYPTION_KEY with the first value');
console.log('5. Add ENCRYPTION_SALT with the second value');
console.log('6. Click Save');
console.log('7. Go to Deployments and click "Redeploy"');

console.log('\n⚠️  IMPORTANT:');
console.log('- Keep these keys secret and secure');
console.log('- Don\'t share them with anyone');
console.log('- Don\'t commit them to version control');
console.log('- Use different keys for development and production');

console.log('\n🎉 Your app is now secure!');
