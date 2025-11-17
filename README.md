# ✈️ PostPilot - AI-Powered Social Media Content Planner

PostPilot is a comprehensive social media content planning and scheduling application with advanced AI-powered features for Instagram and TikTok. Plan your grid, analyze content performance, and get AI-driven suggestions to maximize engagement.

## 🚀 Features

### Core Features
- **Visual Grid Planner**: Plan and preview your Instagram feed layout before posting
- **Multiple Grid Support**: Create and manage multiple grid layouts for different campaigns
- **Content Library**: Organize and manage all your social media content in one place
- **Social Media Integration**: Connect Instagram and TikTok accounts (OAuth2)

### AI-Powered Features
- **Virality Score**: AI predicts how likely your content is to go viral (0-100)
- **Engagement Prediction**: Estimates engagement potential based on content analysis
- **Aesthetic Scoring**: Evaluates visual quality, composition, and appeal
- **Trend Alignment**: Analyzes how well content aligns with current trends
- **Content Type Suggestions**: AI recommends whether content should be a post, carousel, or reel
- **Best Shot Selection**: Compare multiple versions and let AI choose the best one
- **Smart Hashtag Generation**: AI generates relevant, trending hashtags
- **Caption Generator**: Create engaging captions with AI assistance
- **Optimal Posting Times**: Get recommendations for when to post for maximum reach

### Technical Features
- **Real-time Preview**: See exactly how your grid will look
- **Drag & Drop**: Easy content arrangement (planned)
- **Version Comparison**: Upload multiple versions and compare AI scores
- **Performance Analytics**: Track and analyze content performance
- **Responsive Design**: Works on desktop, tablet, and mobile

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher) - running locally or cloud instance
- **npm** or **yarn**

### API Keys Required

1. **Instagram API** (Meta/Facebook Developer):
   - Go to: https://developers.facebook.com/apps/
   - Create a new app
   - Add Instagram Basic Display product
   - Get Client ID and Client Secret

2. **TikTok API**:
   - Go to: https://developers.tiktok.com/
   - Register as a developer
   - Create an app
   - Get Client Key and Client Secret

3. **OpenAI API** (for AI features):
   - Go to: https://platform.openai.com/api-keys
   - Create an API key
   - Note: AI features will use heuristic fallbacks if not configured

## 🛠️ Installation

### 1. Clone or Navigate to Project

```bash
cd postpilot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

**Required Configuration:**
```env
# Minimum required for basic functionality
PORT=3000
MONGODB_URI=mongodb://localhost:27017/postpilot
SESSION_SECRET=your-random-secret-here
JWT_SECRET=your-jwt-secret-here

# For AI features (optional but recommended)
OPENAI_API_KEY=sk-your-key-here

# For social media integration (optional)
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage Guide

### Getting Started

1. **Sign Up**: Create an account on the login page
2. **Upload Content**: Click "Upload Content" and select your images/videos
3. **AI Analysis**: After upload, AI automatically analyzes your content
4. **Create Grid**: Go to "Grid Planner" and create your first grid
5. **Add to Grid**: Click on content items to add them to your grid
6. **Preview**: See exactly how your Instagram feed will look
7. **Schedule**: (Coming soon) Schedule posts directly to Instagram/TikTok

### Understanding AI Scores

- **Virality Score (0-100)**: Predicts viral potential based on visual appeal, emotional resonance, and shareability
- **Engagement Score (0-100)**: Estimates likes, comments, and shares based on caption, hashtags, and content quality
- **Aesthetic Score (0-100)**: Evaluates composition, colors, lighting, and professional appearance
- **Trend Score (0-100)**: Analyzes alignment with current trends and optimal posting times
- **Overall Score**: Average of all scores

### Content Type Recommendations

PostPilot AI suggests the best format for your content:
- **Post**: Standard Instagram square/portrait post
- **Carousel**: Multi-image storytelling (suggested for detailed content)
- **Reel**: Short-form vertical video (suggested for 9:16 videos)
- **Story**: Temporary 24-hour content

### Version Comparison

1. Upload multiple versions of the same content
2. Click "Compare Versions" in the AI Analytics tab
3. AI scores each version and recommends the best one
4. Select the winning version for your grid

## 🏗️ Project Structure

```
postpilot/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── contentController.js
│   │   ├── gridController.js
│   │   └── aiController.js
│   ├── models/          # Database schemas
│   │   ├── User.js
│   │   ├── Content.js
│   │   └── Grid.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── content.js
│   │   ├── grid.js
│   │   └── ai.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── services/        # Business logic
│   │   └── aiService.js
│   └── server.js        # Express app entry point
├── public/              # Frontend files
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── uploads/             # User uploaded files
├── config/              # Configuration files
├── .env.example         # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/instagram` - Instagram OAuth
- `GET /api/auth/tiktok` - TikTok OAuth

### Content
- `POST /api/content` - Upload content (multipart/form-data)
- `GET /api/content` - Get all content
- `GET /api/content/:id` - Get content by ID
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `POST /api/content/:id/versions` - Add version

### Grid
- `POST /api/grid` - Create grid
- `GET /api/grid` - Get all grids
- `GET /api/grid/:id` - Get grid by ID
- `PUT /api/grid/:id` - Update grid
- `POST /api/grid/:id/add-row` - Add row to grid
- `POST /api/grid/:id/add-content` - Add content to grid

### AI Analysis
- `POST /api/ai/analyze` - Analyze content with AI
- `POST /api/ai/suggest-type` - Get content type suggestion
- `POST /api/ai/generate-hashtags` - Generate hashtags
- `POST /api/ai/generate-caption` - Generate caption
- `POST /api/ai/compare-versions` - Compare content versions

## 🎨 Customization

### Changing Grid Layout

Edit `public/css/styles.css`:
```css
.instagram-grid {
  grid-template-columns: repeat(3, 1fr); /* Change to 4, 5, etc. */
  gap: 0.5rem; /* Adjust spacing */
}
```

### Adding More AI Models

Extend `src/services/aiService.js`:
```javascript
async customAnalysis(content) {
  // Add your custom AI analysis logic
  // Integrate with other AI services
}
```

## 🚧 Roadmap

- [ ] Direct posting to Instagram and TikTok
- [ ] Drag & drop grid rearrangement
- [ ] Calendar view for scheduled posts
- [ ] Collaboration features (team accounts)
- [ ] Analytics dashboard with real post performance
- [ ] Instagram Stories planning
- [ ] Video editing capabilities
- [ ] Bulk upload and scheduling
- [ ] AI caption variations A/B testing
- [ ] Integration with more platforms (Twitter, LinkedIn)

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

### Upload Errors
- Check `uploads/` directory exists and is writable
- Verify file size limits in `src/middleware/upload.js`

### AI Features Not Working
- Ensure `OPENAI_API_KEY` is set in `.env`
- Check API key validity at platform.openai.com
- Verify you have credits in your OpenAI account
- Fallback heuristic scoring will be used if API fails

## 🔒 Security Notes

- Change all default secrets in production
- Never commit `.env` file to version control
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Regularly update dependencies
- Validate and sanitize all user inputs

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using Node.js, Express, MongoDB, and OpenAI**

*Happy Planning! ✈️*
