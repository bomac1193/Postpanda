# Instagram API Setup Guide

This guide explains how to set up Instagram API credentials to enable real posting functionality in Slayt.

## Quick Start (Test Mode - No App Review)

**Want to test posting immediately?** Follow these steps:

1. **Create Meta App** (5 mins)
   - Go to https://developers.facebook.com → My Apps → Create App
   - Choose "Business" type
   - Name: "Slayt Content Publisher"

2. **Get Credentials** (2 mins)
   - Settings → Basic
   - Copy **App ID** and **App Secret**

3. **Add Instagram API** (2 mins)
   - Add Product → Instagram Graph API → Set Up

4. **Configure OAuth** (2 mins)
   - Instagram Graph API → Settings
   - Add redirect: `http://localhost:3030/api/auth/instagram/callback`

5. **Add Yourself as Tester** (3 mins)
   - Roles → Testers → Add
   - Enter your Instagram username
   - Accept invitation in Instagram app settings

6. **Update Slayt** (2 mins)
   ```bash
   # Edit /home/sphinxy/Slayt/.env
   INSTAGRAM_CLIENT_ID=your_app_id_here
   INSTAGRAM_CLIENT_SECRET=your_app_secret_here

   # Restart backend
   pkill -f "node.*server.js"
   cd /home/sphinxy/Slayt
   npm run dev
   ```

7. **Test It!** (1 min)
   - Open http://localhost:5173
   - Connect Instagram account
   - Post content → It works! 🎉

**Total time**: ~15-20 minutes

---

## Full Setup Guide

For production deployment with multiple users, follow the detailed steps below.

## Prerequisites

- A Facebook/Meta account
- An Instagram Business or Creator account
- A Facebook Page connected to your Instagram account

## Step 1: Create a Meta Developer App

1. Go to [Meta Developers](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in:
   - App Name: "Slayt Content Publisher" (or your preferred name)
   - App Contact Email: Your email
   - Business Account: Select or create one
5. Click **Create App**

## Step 2: Add Instagram Graph API

1. In your app dashboard, find **Add Products**
2. Locate **Instagram Graph API** and click **Set Up**
3. This will add Instagram API capabilities to your app

## Step 3: Configure Instagram Business Account

### Connect Facebook Page to Instagram

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Navigate to **Business Settings** → **Instagram Accounts**
3. Click **Add** → **Connect Instagram Account**
4. Log in with your Instagram Business/Creator account
5. Connect it to a Facebook Page (required for API access)

### Get Instagram Business Account ID

1. Go to your app dashboard
2. Navigate to **Instagram Graph API** → **Tools**
3. Use the **Access Token Tool** or **Graph API Explorer**
4. Make a request to `/me/accounts` to get your Facebook Page ID
5. Then request `/PAGE_ID?fields=instagram_business_account` to get your Instagram Business Account ID

## Step 4: Get API Credentials

1. In your Meta app dashboard, go to **Settings** → **Basic**
2. Copy the **App ID** (this is your `INSTAGRAM_CLIENT_ID`)
3. Copy the **App Secret** (this is your `INSTAGRAM_CLIENT_SECRET`)

## Step 5: Configure OAuth Settings

1. In your app dashboard, go to **Instagram Graph API** → **Settings**
2. Add OAuth Redirect URI:
   ```
   http://localhost:3030/api/auth/instagram/callback
   ```
3. For production, also add:
   ```
   https://yourdomain.com/api/auth/instagram/callback
   ```

## Step 6: Request Permissions

Your app needs these Instagram permissions:

### Standard Permissions (automatically granted for test users)
- `instagram_basic` - Basic account info
- `pages_show_list` - List Facebook Pages
- `pages_read_engagement` - Read Page engagement data

### Advanced Permissions (require App Review)
- `instagram_content_publish` - **Required for posting**
- `pages_manage_posts` - Manage posts on Facebook Pages
- `pages_read_user_content` - Read user-generated content

### For Performance Tracking (optional)
- `instagram_manage_insights` - Read account insights
- `instagram_manage_comments` - Manage comments

## Step 7: App Review Process

Before your app can post to accounts other than test users:

1. Go to **App Review** → **Permissions and Features**
2. Request **Advanced Access** for:
   - `instagram_content_publish`
   - `pages_manage_posts`
3. Fill out the review form:
   - Explain your use case: "Content planning and scheduling tool for creators"
   - Provide demo video showing the posting flow
   - Include privacy policy and terms of service URLs
4. Submit for review (typically takes 3-7 days)

## Step 8: Update Slayt Configuration

Add your credentials to `/home/sphinxy/Slayt/.env`:

```env
# Instagram API Credentials
INSTAGRAM_CLIENT_ID=your_app_id_here
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3030/api/auth/instagram/callback
```

Restart the backend:
```bash
pkill -f "node.*server.js"
npm run dev
```

## Step 9: Test Mode (No App Review Required)

While waiting for App Review, you can test with Development Mode:

1. In your Meta app, go to **Roles** → **Roles**
2. Add Instagram testers:
   - Click **Add Testers**
   - Enter Instagram username
   - They need to accept the invite in their Instagram settings
3. Test users can post without App Review approval

## Testing the Integration

1. Start Slayt backend and frontend
2. Log in with your Google account (or demo mode)
3. Go to Settings → Connected Accounts
4. Click "Connect Instagram"
5. Authorize the app
6. Create content in Grid Planner
7. Click "Post Now" and select Instagram

## Troubleshooting

### "Invalid OAuth access token"
- Check that your App Secret is correct
- Ensure the token hasn't expired (they expire after 60 days)
- Use token refresh endpoint: `/api/post/instagram/refresh-token`

### "Insufficient permissions"
- Verify you have `instagram_content_publish` permission
- Check if app is in Development Mode (only works for testers)
- Submit for App Review if needed

### "Instagram account is not a Business account"
- Convert to Business or Creator account in Instagram app
- Link to a Facebook Page in Facebook Business Manager

### "Image must be publicly accessible"
- Instagram requires publicly accessible image URLs
- Slayt uses Cloudinary for cloud storage
- Ensure Cloudinary credentials are configured in `.env`

## API Limits

Instagram Graph API has these limits:

- **Rate Limits**: 200 calls per hour per user
- **Video Limits**: Max 100MB, up to 60 seconds for feed, 90 seconds for reels
- **Image Limits**: Min 320px, max 8MB for feed posts
- **Carousel Limits**: 2-10 images per post

## Additional Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Instagram Platform Policy](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/overview)
- [App Review Process](https://developers.facebook.com/docs/app-review)

## Next Steps

Once Instagram is configured:

1. Set up TikTok posting (credentials already configured)
2. Implement performance tracking to fetch real metrics
3. Connect Folio integration for taste signals
4. Build conviction feedback loop

---

**Need Help?**
- Check the backend logs: `/tmp/slayt-backend.log`
- Review Meta app dashboard for error details
- Test OAuth flow in Graph API Explorer
