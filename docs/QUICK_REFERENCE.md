# Slayt Quick Reference

## One-Minute Setup Commands

### Start Slayt
```bash
cd /home/sphinxy/Slayt

# Start backend
nohup npm run dev > /tmp/slayt-backend.log 2>&1 &

# Start frontend
cd client && nohup npm run dev > /tmp/slayt-frontend.log 2>&1 &

# Open in browser
# http://localhost:5173
```

### Stop Slayt
```bash
# Stop backend
pkill -f "node.*server.js"

# Stop frontend
pkill -f "vite"
```

### Check Status
```bash
# Backend health
curl http://localhost:3030/api/health

# View logs
tail -f /tmp/slayt-backend.log
tail -f /tmp/slayt-frontend.log
```

## Enable Instagram Posting (15 Minutes)

1. **Get Credentials** (10 mins)
   - Go to https://developers.facebook.com/apps
   - Create App → Business type
   - Add Instagram Graph API
   - Copy App ID & Secret

2. **Configure** (2 mins)
   ```bash
   # Edit .env
   INSTAGRAM_CLIENT_ID=your_app_id
   INSTAGRAM_CLIENT_SECRET=your_app_secret
   ```

3. **Add Test User** (3 mins)
   - App → Roles → Testers → Add yourself
   - Accept in Instagram app settings

4. **Restart**
   ```bash
   pkill -f "node.*server.js"
   npm run dev
   ```

5. **Test** - Open Slayt → Connect Instagram → Post!

## Common Tasks

### Upload Content
1. Open Grid Planner
2. Click "+" or drag & drop image/video
3. Edit caption and hashtags
4. Click "Add to Grid"

### Post to Instagram
1. Select content in grid
2. Click "Post Now" button
3. Select "Instagram"
4. Confirm caption
5. Click "Post"

### Schedule Post
1. Select content
2. Click "Schedule" button
3. Pick date and time
4. Select platform(s)
5. Click "Schedule"

### Generate Caption
1. Select content
2. Click "AI" button
3. Choose tone (casual/professional/funny)
4. Pick generated caption or edit

### Check Scheduled Posts
1. Go to Calendar page
2. View all scheduled posts
3. Drag to reschedule
4. Click to edit or cancel

## File Locations

```
Backend:     /home/sphinxy/Slayt
Frontend:    /home/sphinxy/Slayt/client
Config:      /home/sphinxy/Slayt/.env
Logs:        /tmp/slayt-backend.log
             /tmp/slayt-frontend.log
Docs:        /home/sphinxy/Slayt/docs
Database:    mongodb://localhost:27017/postpilot
```

## URLs

```
Frontend:    http://localhost:5173
Backend API: http://localhost:3030/api
Health:      http://localhost:3030/api/health
```

## Environment Variables (Quick Copy)

```bash
# Required
PORT=3030
MONGODB_URI=mongodb://localhost:27017/postpilot
JWT_SECRET=your-secret-here

# For Google Login
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# For Instagram Posting
INSTAGRAM_CLIENT_ID=your_instagram_id
INSTAGRAM_CLIENT_SECRET=your_instagram_secret

# For TikTok Posting
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret

# For AI Features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# For Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## API Quick Reference

### Post Now
```javascript
await postingApi.postNow(contentId, ['instagram'], {
  caption: 'My post caption',
  hashtags: ['art', 'design', 'creator']
});
```

### Schedule Post
```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await postingApi.schedulePost(
  contentId,
  ['instagram', 'tiktok'],
  tomorrow.toISOString(),
  { caption: 'Scheduled caption' }
);
```

### Get Scheduled Posts
```javascript
const scheduled = await postingApi.getScheduled();
```

### Generate Caption
```javascript
const captions = await aiApi.generateCaption(
  'Photo of sunset at beach',
  'casual',
  { length: 'short' }
);
```

### Calculate Conviction
```javascript
const result = await convictionApi.calculateSingle(
  contentId,
  profileId
);
// Returns: { score, tier, archetypeMatch }
```

## Troubleshooting One-Liners

```bash
# Backend not responding
pkill -f "node.*server.js" && npm run dev

# Frontend not loading
cd client && pkill -f "vite" && npm run dev

# MongoDB not running
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Check what's on port 3030
lsof -i :3030

# Check what's on port 5173
lsof -i :5173

# View real-time logs
tail -f /tmp/slayt-*.log

# Clear all logs
rm /tmp/slayt-*.log

# Restart everything
pkill -f "node.*server.js"; pkill -f "vite"; sleep 2; npm run dev > /tmp/slayt-backend.log 2>&1 & cd client && npm run dev > /tmp/slayt-frontend.log 2>&1 &
```

## MongoDB Quick Commands

```bash
# Connect to database
mongosh mongodb://localhost:27017/postpilot

# View collections
show collections

# Count documents
db.contents.countDocuments()
db.users.countDocuments()

# Find recent content
db.contents.find().sort({createdAt: -1}).limit(5)

# Find scheduled posts
db.contents.find({status: 'scheduled'})

# Find published posts
db.contents.find({status: 'published'})

# Delete all demo content (careful!)
db.contents.deleteMany({userId: null})

# Exit MongoDB shell
exit
```

## Git Workflow (If Using Git)

```bash
# See what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Add Instagram posting feature"

# Push to remote
git push origin main
```

## Performance Tips

```bash
# Check backend memory usage
ps aux | grep node

# Check MongoDB size
du -sh /data/db

# Monitor backend in real-time
watch -n 1 'curl -s http://localhost:3030/api/health'

# Optimize MongoDB indexes
mongosh postpilot --eval "db.contents.getIndexes()"
```

## Security Checklist

- [ ] Never commit `.env` file to git
- [ ] Use strong JWT_SECRET in production
- [ ] Enable HTTPS for production
- [ ] Set NODE_ENV=production in prod
- [ ] Use environment variables, not hardcoded secrets
- [ ] Restrict MongoDB access (not 0.0.0.0)
- [ ] Set up firewall rules
- [ ] Use OAuth securely (HTTPS callbacks)

## Key Keyboard Shortcuts (In UI)

```
Ctrl/Cmd + S     - Save current work
Esc              - Close modal
Arrow Keys       - Navigate grid
Shift + Click    - Multi-select
Delete           - Remove selected item
Ctrl/Cmd + Z     - Undo
Ctrl/Cmd + K     - Command palette (if implemented)
```

## Documentation Links

- [Full README](./README.md)
- [Posting Implementation Status](./POSTING_IMPLEMENTATION.md)
- [Instagram Setup Guide](./INSTAGRAM_SETUP.md)

## Support

```bash
# Check error logs
tail -100 /tmp/slayt-backend.log | grep -i error

# Test API endpoint
curl -X POST http://localhost:3030/api/post/now \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"contentId":"...","platforms":["instagram"]}'

# Verify MongoDB connection
mongosh mongodb://localhost:27017/postpilot --eval "db.serverStatus().ok"
```

---

**Pro Tip**: Bookmark this page for quick access to common commands!
