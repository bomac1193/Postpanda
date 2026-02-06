# Slayt Documentation

Welcome to Slayt's technical documentation.

## Quick Links

### Getting Started
- **[Posting Implementation Status](./POSTING_IMPLEMENTATION.md)** - Current status of social media posting features
- **[Instagram Setup Guide](./INSTAGRAM_SETUP.md)** - Step-by-step Instagram API configuration

## What is Slayt?

Slayt (formerly PostPanda) is an AI-powered content planning and social media publishing tool for creators. It combines:

- **Grid Planner** - Visual Instagram grid layout planning
- **AI Intelligence** - Content scoring and caption generation
- **Conviction System** - Taste-based content filtering
- **Social Publishing** - Direct posting to Instagram & TikTok
- **Taste Genome** - Personalized creator profile learning
- **Performance Tracking** - Post-publish metric analysis

## Current Implementation Status

### ✅ Fully Implemented
- Grid planning and visualization
- Content management (upload, edit, organize)
- AI caption and hashtag generation
- Scheduling system (UI and backend)
- **Complete posting code** for Instagram & TikTok
- Conviction scoring and gating
- Taste Genome profiling
- Character/voice management (Boveda)
- Template system (Designer Vault)
- YouTube collection planning
- Rollout planning

### ⚠️ Requires Configuration
- **Instagram posting** - Needs API credentials (see [Instagram Setup](./INSTAGRAM_SETUP.md))
- **TikTok posting** - Has credentials, needs validation
- **Performance tracking** - Code exists but needs platform API integration

### 🚧 Planned Features
- Real-time performance metrics fetching
- Conviction validation feedback loop
- Folio integration for taste signals
- Multi-account team management
- Advanced analytics dashboard

## Architecture Overview

```
slayt/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── stores/        # Zustand state management
│   │   └── lib/api.js     # API client
│   └── vite.config.js
│
├── src/                    # Node.js backend (Express)
│   ├── controllers/       # Request handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   └── socialMediaService.js  # Instagram/TikTok posting
│   └── server.js          # Entry point
│
├── docs/                   # Documentation
└── .env                    # Configuration
```

## Technology Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Router** - Routing

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Passport** - OAuth authentication
- **Axios** - HTTP client

### APIs & Services
- **Instagram Graph API v18.0** - Social posting
- **TikTok Open API v2** - Social posting
- **OpenAI API** - AI features
- **Anthropic Claude API** - AI features
- **Cloudinary** - Media storage

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally
- (Optional) Instagram API credentials
- (Optional) TikTok API credentials

### Installation

```bash
# Clone repository (if applicable)
cd /home/sphinxy/Slayt

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Configuration

Copy `.env.example` to `.env` (if it exists) or edit `.env` directly:

```bash
# Server
PORT=3030
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/postpilot

# OAuth (for user login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Instagram API (for posting - see docs/INSTAGRAM_SETUP.md)
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret

# TikTok API (for posting)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Running Locally

```bash
# Terminal 1: Start backend
npm run dev
# Backend runs on http://localhost:3030

# Terminal 2: Start frontend
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

### Using Screen/Tmux (Recommended)

```bash
# Start backend in background
nohup npm run dev > /tmp/slayt-backend.log 2>&1 &

# Start frontend in background
cd client
nohup npm run dev > /tmp/slayt-frontend.log 2>&1 &

# Check logs
tail -f /tmp/slayt-backend.log
tail -f /tmp/slayt-frontend.log
```

## API Documentation

### Base URL
```
Development: http://localhost:3030/api
Production: https://yourdomain.com/api
```

### Authentication
All API requests require authentication via JWT token or session cookie.

```javascript
// In browser/client
localStorage.setItem('token', 'your-jwt-token');

// API automatically includes token in headers
```

### Key Endpoints

#### Content Management
```
GET    /api/content              List all content
POST   /api/content              Upload new content
GET    /api/content/:id          Get content by ID
PUT    /api/content/:id          Update content
DELETE /api/content/:id          Delete content
```

#### Social Media Posting
```
POST   /api/post/now                     Post immediately
POST   /api/post/schedule                Schedule for later
GET    /api/post/scheduled               Get scheduled posts
DELETE /api/post/schedule/:id            Cancel scheduled post
GET    /api/post/history                 Get posting history
```

#### Grid Planning
```
GET    /api/grid                  List grids
POST   /api/grid                  Create grid
PUT    /api/grid/:id              Update grid
POST   /api/grid/:id/add-content  Add content to grid
```

#### AI Features
```
POST   /api/ai/generate-caption        Generate captions
POST   /api/ai/generate-hashtags       Generate hashtags
POST   /api/intelligence/analyze       Analyze content DNA
POST   /api/conviction/calculate       Calculate conviction score
```

## Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
systemctl status mongod  # Linux
brew services list       # macOS

# Check logs
tail -f /tmp/slayt-backend.log

# Check port conflicts
lsof -i :3030
```

### Frontend can't connect to backend
```bash
# Verify backend is running
curl http://localhost:3030/api/health

# Check CORS settings
# Ensure FRONTEND_URL in .env matches your frontend URL

# Check proxy in client/vite.config.js
```

### Instagram posting fails
```bash
# Check credentials are set
grep INSTAGRAM .env

# Verify OAuth callback URL in Meta app matches .env
# Check you're added as tester (if in Development mode)
# Review backend logs for API errors
tail -f /tmp/slayt-backend.log
```

### Database connection fails
```bash
# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Check connection string
grep MONGODB_URI .env

# Test connection
mongosh mongodb://localhost:27017/postpilot
```

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Frontend: Vite HMR (instant)
- Backend: Nodemon (auto-restart on file changes)

### Debug Mode
```bash
# Backend with detailed logs
DEBUG=* npm run dev

# Frontend with React DevTools
# Install React DevTools browser extension
```

### Database Inspection
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/postpilot

# View collections
show collections

# Query content
db.contents.find().pretty()

# Query users
db.users.find().pretty()
```

## Contributing

### Code Style
- Use async/await (not callbacks)
- Handle errors with try-catch
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable
- Keep first line under 72 characters

## Additional Documentation

- **[Posting Implementation Status](./POSTING_IMPLEMENTATION.md)** - Detailed breakdown of posting features
- **[Instagram Setup Guide](./INSTAGRAM_SETUP.md)** - Complete Instagram API configuration
- **[API Reference](./API.md)** *(coming soon)* - Full API documentation
- **[Deployment Guide](./DEPLOYMENT.md)** *(coming soon)* - Production deployment steps

## Support

- **Issues**: Check `/tmp/slayt-backend.log` and `/tmp/slayt-frontend.log`
- **API Errors**: Review Meta Developer Console for Instagram errors
- **Database**: Use `mongosh` to inspect data directly

## License

*(Add your license information here)*

---

**Last Updated**: 2026-02-05
**Version**: 2.0.0
