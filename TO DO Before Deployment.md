# Before Deploy

## CRITICAL — Do First

### 1. Rotate All Exposed API Keys
The `.env` file with real secrets was committed to git history. Even though `.gitignore` now excludes it, the keys are visible in repo history.

**Rotate these immediately:**
- [ ] OpenAI API key (`OPENAI_API_KEY`)
- [ ] Anthropic API key (`ANTHROPIC_API_KEY`)
- [ ] Google OAuth client secret (`GOOGLE_CLIENT_SECRET`)
- [ ] YouTube client secret (`YOUTUBE_CLIENT_SECRET`)
- [ ] TikTok client secret (`TIKTOK_CLIENT_SECRET`)
- [ ] Cloudinary API secret (`CLOUDINARY_API_SECRET`)
- [ ] Instagram app secret (`INSTAGRAM_APP_SECRET`)

### 2. Scrub `.env` From Git History
After rotating keys, remove the old `.env` from all commits:
```bash
# Install git-filter-repo (pip install git-filter-repo)
git filter-repo --path .env --invert-paths
git push origin --force --all
```
Or use BFG Repo-Cleaner:
```bash
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

### 3. Set Production Environment Variables
On your hosting platform (Railway recommended), set ALL of these:

**Required:**
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` — Atlas connection string (not localhost)
- [ ] `JWT_SECRET` — random 64-char string (NOT the default `postpilot-jwt-secret-change-in-production`)
- [ ] `SESSION_SECRET` — random 64-char string
- [ ] `OPENAI_API_KEY` — new rotated key
- [ ] `ANTHROPIC_API_KEY` — new rotated key

**OAuth (required for social features):**
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- [ ] `INSTAGRAM_APP_ID` + `INSTAGRAM_APP_SECRET`
- [ ] `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET`
- [ ] `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET`

**Media storage:**
- [ ] `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`

**Optional:**
- [ ] `GROK_API_KEY` — only if using Grok AI
- [ ] `ECOSYSTEM_API_SECRET` — for cross-app communication

### 4. Fix Client Production API URL
`client/.env.local` hardcodes `VITE_API_URL=http://localhost:3035`. Vite bakes this in at build time.

**Fix:** Set `VITE_API_URL` to your production domain when building:
```bash
VITE_API_URL=https://your-domain.com npm run build
```
Or on Railway/Render, add `VITE_API_URL` as a build-time environment variable.

---

## SHOULD FIX — Before Going Live to Users

### 5. Increase MongoDB Connection Timeout
**File:** `src/config/database.js`
```
serverSelectionTimeoutMS: 5000  →  15000
```
Atlas connections can exceed 5s under cold start or load.

### 6. Enable Content Security Policy
**File:** `src/server.js`
```javascript
// Current: contentSecurityPolicy: false
// Change to: remove the override (let Helmet set defaults)
```

### 7. Disable Production Sourcemaps
**File:** `client/vite.config.js`
```javascript
// Current: sourcemap: true
// Change to: sourcemap: false
```
Prevents exposing source code via browser devtools.

### 8. Add Node Engine Constraint
**File:** `package.json`
```json
"engines": {
  "node": ">=18.0.0"
}
```

### 9. OAuth App Approval
Platform developer apps may be in "development mode" with user caps:
- [ ] Instagram: Submit for App Review (required for `instagram_manage_insights` scope on non-test users)
- [ ] TikTok: Submit for production access
- [ ] YouTube: Verify OAuth consent screen for production
- [ ] Update all OAuth callback URLs to production domain

### 10. Update CORS Origins
**File:** `src/server.js` — ensure `CORS_ORIGIN` env var is set to your production frontend domain.

---

## NICE TO HAVE — Post-Launch

- [ ] Set up error monitoring (Sentry or LogRocket)
- [ ] Enable MongoDB Atlas backups
- [ ] Make scheduling/conviction loop services start on DB-ready event instead of setTimeout
- [ ] Add startup validation for required env vars
- [ ] Set up SSL certificate (handled by Railway/Render automatically)
- [ ] Configure custom domain
- [ ] Review rate limiting thresholds for production traffic

---

## Deployment Platform

**Recommended: Railway**
- Server process + MongoDB built in
- Config already exists (`railway.json`)
- Easy env var management
- Free tier sufficient for launch

**Alternatives:**
| Platform | Readiness | Notes |
|----------|-----------|-------|
| Railway | High | Best fit — persistent server + DB |
| Render | High | Free tier spins down after 15min inactivity |
| Vercel | Medium | Serverless — scheduling service needs adaptation |
| VPS/Docker | High | No Dockerfile yet but `npm start` works anywhere |

---

## Verification After Deploy

- [ ] `curl https://your-domain/health` returns 200
- [ ] Login flow works (register → login → JWT stored)
- [ ] Grid loads and displays posts
- [ ] Platform previews show layout without fake engagement numbers
- [ ] Conviction breakdown shows AI estimate disclaimer with calibration badge
- [ ] OAuth connect flow works for at least one platform (Instagram)
- [ ] Image upload to Cloudinary works
- [ ] Schedule a test post → verify it appears in scheduled queue
- [ ] Publish a test post → verify ADS view shows "Metrics collecting..."
