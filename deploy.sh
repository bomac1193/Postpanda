#!/bin/bash
#
# SLAYT Quick Deploy Script
# Deploys SLAYT to a free hosting service in under 2 minutes
#

set -e

echo "
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🚀 SLAYT Quick Deployment Script              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
"

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."

    # Try to install to user local bin
    mkdir -p ~/.local/bin
    cd /tmp

    # Detect architecture
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ]; then
        ARCH="arm64"
    fi

    # Download and install
    curl -fsSL "https://github.com/railwayapp/cli/releases/download/v3.5.0/railway_linux_${ARCH}.tar.gz" -o railway.tar.gz 2>/dev/null || {
        echo "❌ Failed to download Railway CLI"
        echo ""
        echo "🌐 Please deploy manually:"
        echo "   1. Go to: https://railway.app/new/template"
        echo "   2. Connect your GitHub account"
        echo "   3. Select repository: bomac1193/Slayt"
        echo "   4. Click 'Deploy'"
        echo ""
        exit 1
    }

    tar -xzf railway.tar.gz
    mv railway ~/.local/bin/
    export PATH="$HOME/.local/bin:$PATH"
    cd - > /dev/null

    echo "✅ Railway CLI installed"
fi

echo ""
echo "🔐 Authentication required..."
echo ""
echo "This will open your browser to authenticate with Railway."
echo "If you don't have an account, you can sign up for free (no credit card required)."
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

# Authenticate
railway login || {
    echo ""
    echo "❌ Authentication failed"
    echo ""
    echo "🌐 Alternative: Deploy via web browser"
    echo "   https://railway.app/new/template?template=https://github.com/bomac1193/Slayt"
    echo ""
    exit 1
}

echo ""
echo "✅ Authenticated successfully"
echo ""
echo "📦 Creating Railway project..."
echo ""

# Initialize project
cd "$(dirname "$0")"
railway init || {
    echo "❌ Failed to create project"
    exit 1
}

echo ""
echo "🔧 Setting environment variables..."
echo ""

# Generate secure keys
SLAYT_API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3002
railway variables set SLAYT_API_KEY="$SLAYT_API_KEY"
railway variables set SESSION_SECRET="$SESSION_SECRET"

echo ""
echo "⚠️  MongoDB required for full functionality"
echo "   After deployment, add MongoDB:"
echo "   1. Go to Railway dashboard"
echo "   2. Click 'New' → 'Database' → 'MongoDB'"
echo "   3. Copy connection string"
echo "   4. Add as MONGODB_URI environment variable"
echo ""

echo "🚀 Deploying to Railway..."
echo ""

# Deploy
railway up || {
    echo ""
    echo "❌ Deployment failed"
    echo "   Check Railway dashboard for details"
    exit 1
}

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🌐 Getting your deployment URL..."
sleep 3

# Get deployment URL
DEPLOYMENT_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -n "$DEPLOYMENT_URL" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║                                                       ║"
    echo "║  ✅ SLAYT Deployed Successfully!                     ║"
    echo "║                                                       ║"
    echo "║  📍 URL: $DEPLOYMENT_URL"
    echo "║  🔑 API Key: $SLAYT_API_KEY"
    echo "║                                                       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Test health check: curl $DEPLOYMENT_URL/health"
    echo "   2. Add MongoDB (see instructions above)"
    echo "   3. Update Boveda .env.local:"
    echo "      SLAYT_API_URL=$DEPLOYMENT_URL"
    echo "      SLAYT_API_KEY=$SLAYT_API_KEY"
    echo ""
else
    echo ""
    echo "⚠️  Deployment started but URL not available yet"
    echo "   Check Railway dashboard: https://railway.app/dashboard"
    echo "   Your API Key: $SLAYT_API_KEY"
    echo ""
fi

echo "🎉 Done!"
echo ""
