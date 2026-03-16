# Todo Before Deployment

## 1. Commit All Changes

20 modified + 7 new files uncommitted. Includes:
- Release Coordinator (archetype classification, seasonal intelligence)
- YouTube conviction scoring (pre-publish quality gating)
- ConvictionLoopService YouTube extension (post-publish analytics)
- Notification system

## 2. Google OAuth — Switch to Business Account

Currently using personal bomac1193 credentials. To allow public users:

### Google Cloud Console (new project under business Gmail)

- [ ] Create new GCP project
- [ ] Enable YouTube Data API v3
- [ ] Enable YouTube Analytics API
- [ ] Create OAuth 2.0 credentials (Web application)
- [ ] Add authorized redirect URI: `https://<your-vercel-domain>/api/auth/youtube/callback`

### OAuth Consent Screen

- [ ] Set user type to External
- [ ] Add required scopes:
  - `youtube.upload`
  - `youtube`
  - `youtube.force-ssl`
  - `yt-analytics.readonly`
- [ ] Add privacy policy URL
- [ ] Add homepage URL
- [ ] Submit for Google verification review (1-4 weeks)
- [ ] Until verified: add test users manually (max 100)

### Vercel Env Vars to Swap

- [ ] `YOUTUBE_CLIENT_ID` → new project client ID
- [ ] `YOUTUBE_CLIENT_SECRET` → new project secret
- [ ] `YOUTUBE_REDIRECT_URI` → `https://<your-vercel-domain>/api/auth/youtube/callback`

## 3. Vercel Env Vars — Optional Features

Already required (should be set):
- `MONGODB_URI`
- `SESSION_SECRET`
- `SLAYT_API_KEY`

Optional for Release Coordinator:
- [ ] `SUBTASTE_API_URL` — Subtaste server URL (archetype enrichment, works without it)
- [ ] `SUBTASTE_API_KEY` — Bearer token for Subtaste external API
- [ ] `STARFORGE_API_URL` — Twin OS context for archetype classification (falls back to safe defaults)

## 4. Verify After Deploy

- [ ] `GET /api/rollout/release-archetype` returns archetype classification
- [ ] `GET /api/rollout/seasonal-windows` returns timing windows
- [ ] `POST /api/youtube/videos/:id/conviction` scores a video
- [ ] YouTube OAuth connect flow works with new credentials
- [ ] Vite frontend loads without console errors
