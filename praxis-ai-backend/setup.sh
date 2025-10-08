#!/bin/bash

# Praxis-AI Backend Development Setup Script
# This script helps set up the local development environment

set -e

echo "🚀 Setting up Praxis-AI Backend Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

echo "✅ Supabase CLI $(supabase --version) detected"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    echo "   Required keys: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
    echo "   AI keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GROK_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY"
    echo ""
    echo "Press Enter when you've configured your .env file..."
    read
fi

echo "✅ Environment configuration found"

# Start Supabase (if not already running)
echo "🗄️  Starting Supabase..."
if ! supabase status &> /dev/null; then
    echo "Starting Supabase local development..."
    supabase start
else
    echo "✅ Supabase is already running"
fi

# Run database migrations
echo "🔄 Running database migrations..."
supabase db reset

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
npm run db:generate-types

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."
npm test

echo ""
echo "🎉 Setup complete! Your Praxis-AI backend is ready for development."
echo ""
echo "📋 Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. The API will be available at: http://localhost:3000"
echo "   3. tRPC endpoint: http://localhost:3000/trpc"
echo "   4. Supabase Studio: http://localhost:54323"
echo ""
echo "🔧 Available commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm test             - Run tests"
echo "   npm run db:reset     - Reset database"
echo "   npm run db:generate-types - Generate TypeScript types"
echo ""
echo "📚 Documentation:"
echo "   - AI Orchestrator: ./AI_ORCHESTRATOR_GUIDE.md"
echo "   - Enhanced AI Services: ./ENHANCED_AI_SERVICES_GUIDE.md"
echo "   - tRPC Setup: ./TRPC_SETUP_GUIDE.md"
echo ""
echo "Happy coding! 🚀"
