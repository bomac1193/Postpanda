# 🚀 Deploy SLAYT in Under 2 Minutes

## Fastest Way (1-Click)

```bash
cd /home/sphinxy/Slayt && ./deploy.sh
```

This script will:
1. Install Railway CLI if needed
2. Authenticate with Railway (opens browser)
3. Create project
4. Set environment variables (auto-generated secure keys)
5. Deploy SLAYT
6. Give you the deployment URL and API key

---

## Alternative: Web Dashboard (No CLI)

1. **Go to**: https://railway.app/new/template
2. **Sign in** with GitHub (free, no credit card)
3. **Import** this repository: `https://github.com/bomac1193/Slayt`
4. **Click "Deploy"**
5. **Done!** Copy your deployment URL

---

## After Deployment

### 1. Test Your Deployment

```bash
# Replace with your actual URL
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 2. Add MongoDB (Optional but Recommended)

In Railway dashboard:
1. Click "New" → "Database" → "MongoDB"
2. Copy connection string
3. Add as `MONGODB_URI` environment variable to SLAYT service

### 3. Update Boveda Configuration

Edit `/home/sphinxy/boveda/apps/studio/.env.local`:

```bash
# Add these lines (replace with your actual values)
SLAYT_API_URL=https://your-slayt-app.railway.app
SLAYT_API_KEY=your-generated-api-key
```

### 4. Restart Boveda Studio

```bash
cd /home/sphinxy/boveda
pnpm --filter @lcos/studio dev
```

### 5. Test Integration

Go to any character in Boveda Studio and publish to social media!

---

## Troubleshooting

### Deploy Script Fails
- Run manually via Railway dashboard (link above)
- Check `/home/sphinxy/Slayt/QUICK_DEPLOY.md` for detailed steps

### Health Check Returns 404
- Wait 30-60 seconds for initial deployment
- Check Railway dashboard logs for errors

### Boveda Can't Connect to SLAYT
- Verify `SLAYT_API_URL` is correct
- Verify `SLAYT_API_KEY` matches on both sides
- Check SLAYT service is running (green status in Railway)

---

## Cost

**Railway Free Tier:**
- $5 credit/month (~500 hours)
- No credit card required initially
- Perfect for development/testing

**Upgrade when needed:**
- $5/month for hobby plan
- $20/month for production

---

## Support

- Railway Docs: https://docs.railway.com
- SLAYT Issues: https://github.com/bomac1193/Slayt/issues
- Boveda Integration: See `/home/sphinxy/boveda/SLAYT-INTEGRATION.md`
