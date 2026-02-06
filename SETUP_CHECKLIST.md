# 🚀 YouTube Integration - Setup Checklist

**Time Required:** 15 minutes
**Status:** Code Complete ✅ | Setup Required ⏳

---

## ✅ What's Already Done (No Action Needed)

- ✅ YouTube API service (video upload, OAuth, tokens)
- ✅ YouTube auth controller and routes
- ✅ Social media service integration
- ✅ Scheduling service integration
- ✅ Rollout intelligence engine
- ✅ User model updates
- ✅ Server configuration
- ✅ Documentation

**You can ship everything EXCEPT YouTube upload after this setup.**

---

## 📋 Setup Steps (Do These Now)

### 1. Install Package (1 minute)

```bash
cd /home/sphinxy/Slayt
npm install googleapis
```

### 2. Google Cloud Setup (10 minutes)

#### A. Create Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: **Slayt YouTube Integration**
4. Click "Create"

#### B. Enable YouTube API
1. Go to "APIs & Services" → "Library"
2. Search: **YouTube Data API v3**
3. Click it → Click "Enable"

#### C. Configure OAuth Consent
1. Go to "APIs & Services" → "OAuth consent screen"
2. User Type: **External**
3. App name: **Slayt**
4. User support email: **your email**
5. Developer contact: **your email**
6. Click "Save and Continue"
7. Scopes → Add these:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
8. Click "Save and Continue"
9. Test users → Add your Gmail
10. Click "Save and Continue"

#### D. Create Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: **Slayt Web Client**
5. Authorized redirect URIs:
   - Add: `http://localhost:3030/api/auth/youtube/callback`
6. Click "Create"
7. **Copy Client ID and Client Secret** (you'll need these next)

### 3. Update .env File (2 minutes)

Add these lines to `/home/sphinxy/Slayt/.env`:

```bash
# YouTube API
YOUTUBE_CLIENT_ID=paste_your_client_id_here
YOUTUBE_CLIENT_SECRET=paste_your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3030/api/auth/youtube/callback
```

### 4. Restart Server (1 minute)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 5. Test Connection (1 minute)

#### Option A: Via API
```bash
# Get auth URL
curl http://localhost:3030/api/auth/youtube/connect \
  -H "Authorization: Bearer YOUR_TOKEN"

# You'll get:
# { "authUrl": "https://accounts.google.com/..." }

# Open that URL in browser, authorize, and you're connected!
```

#### Option B: Via Frontend
- Go to Settings page
- Click "Connect YouTube" button
- Authorize with Google
- Done!

---

## 🧪 Verify It Works

### Test 1: Check Connection Status

```bash
curl http://localhost:3030/api/auth/youtube/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# { "connected": true, "channelTitle": "Your Channel Name" }
```

### Test 2: Upload a Video (Optional)

```bash
curl -X POST http://localhost:3030/api/youtube/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "title": "Test Upload from Slayt",
    "description": "Testing YouTube integration",
    "tags": ["test"],
    "privacyStatus": "private"
  }'

# Should return:
# { "success": true, "videoId": "...", "videoUrl": "https://youtu.be/..." }
```

---

## ✅ Success Criteria

You're done when:
- [ ] `npm install googleapis` completed
- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth credentials created
- [ ] `.env` updated with credentials
- [ ] Server restarted
- [ ] YouTube connection works (Test 1 passes)

---

## 🎉 What You Get

After setup, you can:

✅ **Auto-upload videos to YouTube** (scheduled or immediate)
✅ **Connect YouTube accounts** via OAuth
✅ **Upload with metadata** (title, description, tags)
✅ **Upload thumbnails** automatically
✅ **Schedule publishing** (set future publish dates)
✅ **Quality gating** (conviction blocks bad content)
✅ **Archetype pacing** (KETH = 3 days, VAULT = 7 days)
✅ **SCR prediction** (forecast stan conversion)
✅ **Rollout intelligence** (full AI analysis)

**No competitor can do this** - you have the full 5-system moat.

---

## 📚 Detailed Docs

- **Setup Guide:** `/docs/YOUTUBE_API_SETUP.md`
- **Complete Status:** `/docs/YOUTUBE_COMPLETE.md`
- **Intelligence Engine:** `/docs/ROLLOUT_INTELLIGENCE.md`

---

## 🆘 Troubleshooting

### Error: "googleapis module not found"
**Fix:** Run `npm install googleapis`

### Error: "Invalid client"
**Fix:** Check Client ID and Client Secret in `.env` match Google Cloud Console

### Error: "Redirect URI mismatch"
**Fix:** In Google Cloud Console, add exact redirect URI:
`http://localhost:3030/api/auth/youtube/callback`

### Error: "Insufficient permissions"
**Fix:** In OAuth consent screen, add all 3 YouTube scopes (upload, youtube, force-ssl)

### Error: "Quota exceeded"
**Fix:** YouTube API has 10,000 units/day limit (free tier)
- 1 upload = 1,600 units
- Max ~6 uploads/day
- Request quota increase in Google Cloud Console if needed

---

## ⏭️ After Setup

Once YouTube is working, you have **100% complete**:

✅ Rollout Planner (Phase 1 Intelligence)
✅ YouTube Integration (Full API)
✅ Scheduling Service
✅ Conviction Gating
✅ Archetype Pacing
✅ Stan Velocity Prediction

**Ready to ship!** 🚀

Or continue with:
🔲 Phase 2 Intelligence (Folio aesthetic checks, burnout AI)
🔲 Phase 3 Intelligence (competitive launch windows)
🔲 Other ecosystem integrations (Stanvault, Subtaste, Starforge)

---

**Current Status:** ✅ Code Complete | ⏳ 15-min Setup Required
**Next Action:** Run `npm install googleapis` and follow checklist
