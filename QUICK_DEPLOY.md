# Quick Deploy SLAYT (2 Minutes)

## Option 1: Railway (Recommended - Easiest)

**1-Click Deploy:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/nodejs?referralCode=quick)

### Steps:
1. Click button above → Sign in with GitHub (free)
2. Click "Deploy Now"
3. **Set these environment variables:**
   - `SLAYT_API_KEY`: `slayt-dev-key-change-this-in-production`
   - `SESSION_SECRET`: `session-secret-change-this-in-production`
   - `NODE_ENV`: `production`
4. Click "Deploy"
5. Copy your Railway URL (e.g., `https://slayt-production.railway.app`)

**Add MongoDB (Free):**
1. In Railway dashboard → "New" → "Database" → "MongoDB"
2. Copy connection string from MongoDB service
3. Add to SLAYT service as `MONGODB_URI`

**Done!** Your SLAYT API is live at: `https://YOUR-APP.railway.app`

---

## Option 2: Render (More Configuration)

1. Go to https://dashboard.render.com
2. "New +" → "Web Service"
3. Connect GitHub → Select `bomac1193/Slayt`
4. Settings:
   - **Build**: `npm install`
   - **Start**: `npm start`
   - **Plan**: Free
5. Add environment variables (see .env.production.example)
6. Deploy

---

## Option 3: Manual (Any VPS)

```bash
# Clone repo
git clone https://github.com/bomac1193/Slayt.git
cd Slayt

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your settings

# Start server
npm start
```

---

## Update Boveda Configuration

After deploying, update `/home/sphinxy/boveda/apps/studio/.env.local`:

```bash
# Replace with your deployed URL
SLAYT_API_URL=https://your-slayt-app.railway.app
SLAYT_API_KEY=your-api-key-here
```

## Test Your Deployment

```bash
# Health check
curl https://your-slayt-app.railway.app/health

# Test publish endpoint
curl -X POST https://your-slayt-app.railway.app/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "character": {"id":"test","name":"Test"},
    "content": {"text":"Hello from SLAYT!"},
    "platforms": ["TWITTER"]
  }'
```

Expected response:
```json
{
  "publishId": "pub_...",
  "platforms": {
    "TWITTER": {
      "status": "success",
      "postId": "tw_...",
      "url": "https://twitter.com/..."
    }
  }
}
```

## Free Tier Limits

**Railway:**
- $5 free credit/month (~500 hours)
- 512MB RAM, 1GB disk
- No credit card required initially

**Render:**
- 750 hours/month
- Spins down after 15min inactivity
- 512MB RAM

Both are sufficient for development and testing!
