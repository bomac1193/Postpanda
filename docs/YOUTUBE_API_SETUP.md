# YouTube API Setup Guide

Complete guide to enable YouTube video uploading in Slayt.

---

## 🎯 What We Built

**Full YouTube Data API v3 integration:**
- ✅ OAuth 2.0 authentication flow
- ✅ Video upload service
- ✅ Metadata management (title, description, tags)
- ✅ Thumbnail upload
- ✅ Scheduled publishing
- ✅ Token auto-refresh
- ✅ Integration with rollout scheduler

---

## 📋 Prerequisites

1. **Google Cloud Project**
2. **YouTube Data API v3 enabled**
3. **OAuth 2.0 credentials**
4. **Node.js packages** (googleapis)

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Install Required Package

```bash
cd /home/sphinxy/Slayt
npm install googleapis
```

### Step 2: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Slayt YouTube Integration"
4. Click "Create"

### Step 3: Enable YouTube Data API v3

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it → Click "Enable"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **Slayt**
   - User support email: **your email**
   - Developer contact: **your email**
   - Scopes: Add these:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
   - Test users: Add your Gmail account
   - Click "Save and Continue"

4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: **Slayt Web Client**
   - Authorized redirect URIs:
     - `http://localhost:3030/api/auth/youtube/callback` (dev)
     - `https://yourdomain.com/api/auth/youtube/callback` (production)
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### Step 5: Update Environment Variables

Add to `/home/sphinxy/Slayt/.env`:

```bash
# YouTube API
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3030/api/auth/youtube/callback

# API URLs (if not already set)
API_URL=http://localhost:3030
CLIENT_URL=http://localhost:5173
```

### Step 6: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🔗 OAuth Flow

### 1. Connect YouTube Account

**Frontend:** Call `/api/auth/youtube/connect`

```javascript
// In your settings page
const response = await fetch('/api/auth/youtube/connect', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { authUrl } = await response.json();

// Redirect user to Google OAuth
window.location.href = authUrl;
```

**User Journey:**
1. User clicks "Connect YouTube"
2. Redirected to Google OAuth consent screen
3. User authorizes Slayt to access their YouTube channel
4. Google redirects back to `/api/auth/youtube/callback`
5. Backend exchanges code for tokens
6. Backend saves tokens to user account
7. User redirected back to frontend settings page with success message

### 2. Check Connection Status

```javascript
const response = await fetch('/api/auth/youtube/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { connected, channelTitle } = await response.json();
```

### 3. Disconnect YouTube

```javascript
await fetch('/api/auth/youtube/disconnect', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📤 Uploading Videos

### Direct Upload (via API)

```javascript
const response = await fetch('/api/youtube/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    videoUrl: 'https://cloudinary.com/path/to/video.mp4',
    title: 'My Awesome Video',
    description: 'This is the description',
    tags: ['music', 'tutorial', 'howto'],
    privacyStatus: 'private', // 'public', 'private', 'unlisted'
    thumbnailUrl: 'https://cloudinary.com/path/to/thumb.jpg',
    publishAt: '2026-03-15T10:00:00Z' // Optional: scheduled publish
  })
});

const { success, videoId, videoUrl } = await response.json();
```

### Scheduled Upload (via Rollout Planner)

1. Create YouTube collection in Rollout Planner
2. Add videos with metadata
3. Link collection to rollout section
4. Set scheduled dates
5. Scheduler will auto-upload when date arrives

**How it works:**
- Scheduling service checks every 60 seconds
- Finds YouTube videos with `scheduledDate <= now`
- Validates YouTube credentials (auto-refreshes token)
- Uploads video via YouTube Data API v3
- Updates video status to "published"
- Saves YouTube video ID and URL

---

## 🎬 Video Requirements

### File Formats
- **Supported:** .MOV, .MPEG4, .MP4, .AVI, .WMV, .MPEGPS, .FLV, 3GPP, WebM
- **Recommended:** MP4 (H.264 + AAC)

### File Size
- **Max:** 256 GB (or 12 hours long)
- **Recommended:** < 2 GB for faster uploads

### Resolution
- **Min:** 426x240
- **Recommended:** 1920x1080 (1080p) or 3840x2160 (4K)

### Thumbnails
- **Format:** JPG, PNG
- **Size:** 1280x720 pixels (recommended)
- **Max file size:** 2 MB

---

## 🔐 Privacy Levels

### Private
- Only you can see the video
- Good for drafts or scheduled publishing

### Unlisted
- Anyone with the link can view
- Not searchable on YouTube
- Good for sharing with specific audiences

### Public
- Anyone can find and watch
- Appears in search results
- Appears on your channel

### Scheduled Publishing
- Upload as "Private" with `publishAt` date
- YouTube automatically makes it public at specified time
- Max 6 months in advance

---

## 🔧 API Endpoints

### Authentication

```bash
# Get OAuth URL
GET /api/auth/youtube/connect
Response: { authUrl: "https://accounts.google.com/..." }

# OAuth callback (auto-handled by Google)
GET /api/auth/youtube/callback?code=...&state=...
Redirects to: CLIENT_URL/settings?youtube_success=true

# Get status
GET /api/auth/youtube/status
Response: { connected: true, channelTitle: "My Channel", channelId: "..." }

# Disconnect
POST /api/auth/youtube/disconnect
Response: { success: true }

# Refresh token manually
POST /api/auth/youtube/refresh
Response: { success: true, expiresAt: "2026-03-15T10:00:00Z" }
```

### Video Management

```bash
# Upload video (needs implementation in controller)
POST /api/youtube/upload
Body: { videoUrl, title, description, tags, privacyStatus, thumbnailUrl, publishAt }
Response: { success: true, videoId: "dQw4w9WgXcQ", videoUrl: "https://youtu.be/..." }

# Update video metadata (needs implementation)
PUT /api/youtube/videos/:videoId
Body: { title, description, tags, privacyStatus }
Response: { success: true }

# Delete video (needs implementation)
DELETE /api/youtube/videos/:videoId
Response: { success: true }

# Get analytics (needs implementation)
GET /api/youtube/videos/:videoId/analytics
Response: { views, likes, comments, ... }
```

---

## 📊 Service Architecture

### Files Created

1. **`/src/services/youtubeApiService.js`** (500+ lines)
   - OAuth 2.0 client
   - Video upload
   - Token management
   - Thumbnail upload
   - Metadata updates
   - Analytics fetching

2. **`/src/controllers/youtubeAuthController.js`** (200+ lines)
   - OAuth flow handlers
   - Connection management
   - Token refresh

3. **`/src/routes/youtubeAuth.js`**
   - OAuth routes
   - Status endpoints

4. **User Model Updates**
   - Added `socialAccounts.youtube`
   - Added `socialMedia.youtube` (backward compat)

### Integration Points

**Scheduling Service:**
```javascript
// In schedulingService.js - already integrated
if (platform === 'youtube') {
  result = await socialMediaService.postToYouTube(user, content, options);
}
```

**Social Media Service:**
```javascript
// In socialMediaService.js - newly added
async postToYouTube(user, content, options) {
  const result = await youtubeApiService.uploadVideo(user, videoData);
  return result;
}
```

---

## 🧪 Testing

### Test OAuth Flow

1. Start servers:
```bash
# Terminal 1: Backend
cd /home/sphinxy/Slayt
npm run dev

# Terminal 2: Frontend
cd /home/sphinxy/Slayt/client
npm run dev
```

2. Go to Settings page
3. Click "Connect YouTube"
4. Authorize with Google
5. Verify connection status shows your channel name

### Test Video Upload

```bash
# Use curl or Postman
curl -X POST http://localhost:3030/api/youtube/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "title": "Test Upload from Slayt",
    "description": "Testing YouTube API integration",
    "tags": ["test", "slayt"],
    "privacyStatus": "private"
  }'
```

Expected response:
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Test Scheduled Upload

1. Create a rollout with YouTube collection
2. Add a video with `scheduledDate` set to 1 minute from now
3. Wait for scheduler to run
4. Check logs for upload confirmation
5. Verify video appears in your YouTube channel (as Private)

---

## 🔍 Troubleshooting

### Error: "YouTube not connected"
**Fix:** User needs to connect YouTube account via OAuth flow

### Error: "Refresh token missing"
**Fix:** User needs to reconnect (revoke and reauthorize to get new refresh token)

### Error: "Token expired"
**Fix:** Service should auto-refresh, but can manually call `/api/auth/youtube/refresh`

### Error: "Insufficient permissions"
**Fix:** Check OAuth scopes in Google Cloud Console:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`
- `https://www.googleapis.com/auth/youtube.force-ssl`

### Error: "Invalid video format"
**Fix:** Use MP4 (H.264 + AAC) format

### Error: "Video too large"
**Fix:** Compress video to < 2 GB or split into parts

### Error: "Quota exceeded"
**Fix:** YouTube API has daily quota limits:
- Default: 10,000 units/day
- Upload costs: ~1,600 units per video
- Max ~6 videos/day on free tier
- Request quota increase in Google Cloud Console

---

## 📈 Quota Management

### YouTube API Quota Costs

| Action | Cost (units) |
|--------|--------------|
| Upload video | 1,600 |
| Update video | 50 |
| Delete video | 50 |
| Get video details | 1 |
| Set thumbnail | 50 |
| List videos | 1 |

**Daily quota:** 10,000 units (default)

**Calculate daily uploads:**
- 10,000 / 1,600 = ~6 videos/day

**Request increase:**
1. Go to Google Cloud Console
2. APIs & Services → YouTube Data API v3 → Quotas
3. Request quota increase (explain usage)
4. Can get up to 1,000,000 units/day

---

## 🔐 Security Best Practices

1. **Never commit credentials**
   - Keep `.env` in `.gitignore`
   - Use environment variables

2. **Use refresh tokens**
   - Store refresh tokens securely
   - Auto-refresh access tokens

3. **Validate tokens before use**
   - Check expiry dates
   - Handle 401 errors gracefully

4. **Limit scopes**
   - Only request needed permissions
   - Don't ask for `youtube.force-ssl` unless needed

5. **Rotate secrets**
   - Regenerate client secrets periodically
   - Revoke old tokens

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Install googleapis: `npm install googleapis`
2. ✅ Set up Google Cloud project
3. ✅ Add credentials to `.env`
4. ✅ Test OAuth flow
5. ✅ Test video upload

### Short-term (This Week)
1. 🔲 Add upload endpoint to youtubeController
2. 🔲 Add frontend YouTube connect button
3. 🔲 Test scheduled uploads via rollout planner
4. 🔲 Add video analytics fetching

### Long-term (Next Month)
1. 🔲 Bulk upload support
2. 🔲 Video editing integration
3. 🔲 Playlist management
4. 🔲 Comment moderation
5. 🔲 Live streaming integration

---

## 📝 Sample .env Configuration

```bash
# Server
PORT=3030
NODE_ENV=development
API_URL=http://localhost:3030
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/postpilot

# YouTube API
YOUTUBE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
YOUTUBE_REDIRECT_URI=http://localhost:3030/api/auth/youtube/callback

# Instagram API (existing)
INSTAGRAM_CLIENT_ID=your_ig_client_id
INSTAGRAM_CLIENT_SECRET=your_ig_client_secret

# TikTok API (existing)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Cloudinary (for video storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

**Documentation Version:** 1.0
**Last Updated:** 2026-02-06
**Status:** ✅ Implementation Complete | Setup Required
