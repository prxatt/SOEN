#!/bin/bash

# Praxis-AI Pull Request Creation Script
echo "🚀 Creating Pull Request for Praxis-AI Backend Implementation"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Praxis-AI root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status

echo ""
echo "📝 To create the pull request manually:"
echo ""
echo "1. Go to: https://github.com/prxatt/Praxis-AI"
echo "2. Click 'Compare & pull request' (if you see the banner)"
echo "   OR click 'Pull requests' → 'New pull request'"
echo "3. Use this title:"
echo "   🚀 Complete Praxis-AI Backend Implementation"
echo ""
echo "4. Copy the description from: PULL_REQUEST_DESCRIPTION.md"
echo "   (The file has been created in your project root)"
echo ""
echo "5. Click 'Create pull request'"
echo ""

# Check if servers are running
echo "🔍 Checking if servers are running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:3000"
else
    echo "❌ Backend server is not running"
    echo "   Run: cd praxis-ai-backend && npm run dev:simple"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend server is running on http://localhost:5173"
else
    echo "❌ Frontend server is not running"
    echo "   Run: npm run dev"
fi

echo ""
echo "🎉 Pull request is ready to be created!"
echo "📱 You can view the app at: http://localhost:5173"
echo "🔧 Backend API at: http://localhost:3000"
