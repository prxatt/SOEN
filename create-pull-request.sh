#!/bin/bash
# create-pull-request.sh
# Script to create a pull request with all our security fixes and AI enhancements

echo "🚀 Creating Pull Request for Security Fixes & AI Enhancements"
echo "=============================================================="

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "feature/security-fixes-v2" ]; then
    echo "❌ Please switch to feature/security-fixes-v2 branch first"
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Push the branch to remote
echo "📤 Pushing branch to remote..."
git push origin feature/security-fixes-v2

if [ $? -eq 0 ]; then
    echo "✅ Branch pushed successfully!"
else
    echo "❌ Failed to push branch"
    exit 1
fi

# Get the repository URL
REPO_URL=$(git remote get-url origin)
echo "Repository: $REPO_URL"

# Extract owner and repo name
if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/]+)\.git ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    echo "Owner: $OWNER"
    echo "Repo: $REPO"
else
    echo "❌ Could not parse repository URL"
    exit 1
fi

# Create the pull request URL
PR_URL="https://github.com/$OWNER/$REPO/compare/main...feature/security-fixes-v2"

echo ""
echo "🎯 Pull Request Ready!"
echo "====================="
echo ""
echo "📋 Pull Request Details:"
echo "   Title: 🚀 Critical Security Fixes & AI Enhancement Updates"
echo "   Base Branch: main"
echo "   Head Branch: feature/security-fixes-v2"
echo ""
echo "📝 Description:"
echo "   Use the content from PULL_REQUEST_DESCRIPTION.md"
echo ""
echo "🔗 Create Pull Request:"
echo "   $PR_URL"
echo ""
echo "📄 Description File:"
echo "   PULL_REQUEST_DESCRIPTION.md"
echo ""
echo "✨ Next Steps:"
echo "   1. Open the URL above in your browser"
echo "   2. Copy the content from PULL_REQUEST_DESCRIPTION.md"
echo "   3. Paste it as the pull request description"
echo "   4. Review and submit the pull request"
echo ""
echo "🎉 All done! Your pull request is ready to be created."
