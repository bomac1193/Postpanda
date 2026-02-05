# Taste API - COMPLETE ✅

## Monetizable Partner API Powered by Subtaste

The Taste API exposes Slayt's taste intelligence to external partners. Built on Subtaste (internal), ready for standalone integration.

**This completes the ERRC "CREATE" column.** All revolutionary features shipped.

---

## What We Built

### Backend (100% Complete ✅)

**1. API Key Management**
- ApiKey model with partner metadata, usage tracking, billing
- Tiered access (free, starter, professional, enterprise)
- Rate limiting (100-20,000 req/hour)
- Admin routes for key creation/management

**2. Authentication & Security**
- API key authentication middleware (`X-API-Key` header)
- Rate limiting (per partner, per hour)
- Endpoint-level access control
- Usage tracking (hourly/monthly)

**3. Taste API Service (Subtaste Adapter)**
- **Current**: Uses internal Subtaste/genome
- **Future-Ready**: Swap for standalone Subtaste API
- Same interface, different backend
- Zero breaking changes for partners

**4. Public API Endpoints (8 Total)**
- Content scoring
- Archetype matching
- Content analysis
- Recommendations
- Genome queries
- Batch operations
- Usage stats
- Health check

**5. Admin Endpoints (6 Total)**
- Create/manage API keys
- Update tier/limits
- Revoke/regenerate keys
- Usage statistics

---

## API Endpoints

### Public Taste API

**Authentication**: Include `X-API-Key` header in all requests

**Base URL**: `https://api.slayt.com/api/taste`

#### 1. Score Content
```http
POST /api/taste/score
Content-Type: application/json
X-API-Key: sk_abc123...

{
  "content": {
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Summer vibes 🌞",
    "hashtags": ["summer", "beach"]
  },
  "tasteProfileId": "profile123"
}

Response:
{
  "success": true,
  "data": {
    "score": 85,
    "tier": "high",
    "breakdown": {
      "performance": 82,
      "taste": 88,
      "brand": 84
    },
    "archetypeMatch": {
      "designation": "Artisan",
      "glyph": "🎨",
      "confidence": 0.92
    },
    "confidence": 0.89,
    "provider": "subtaste-internal"
  },
  "meta": {
    "partner": "Your Company",
    "requestId": "req_xyz",
    "timestamp": "2026-02-05T10:30:00Z"
  }
}
```

#### 2. Match Archetype
```http
POST /api/taste/archetype
X-API-Key: sk_abc123...

{
  "content": {
    "imageUrl": "https://example.com/image.jpg",
    "caption": "..."
  }
}

Response:
{
  "success": true,
  "data": {
    "archetype": {
      "designation": "Maverick",
      "glyph": "⚡",
      "confidence": 0.87,
      "description": "Bold, unconventional, trend-setting"
    },
    "attributes": ["bold", "edgy", "innovative"],
    "provider": "subtaste-internal"
  }
}
```

#### 3. Analyze Content
```http
POST /api/taste/analyze
X-API-Key: sk_abc123...

{
  "content": {
    "imageUrl": "https://example.com/image.jpg"
  }
}

Response:
{
  "success": true,
  "data": {
    "features": {
      "composition": "rule-of-thirds",
      "lighting": "natural",
      "subject": "person"
    },
    "aesthetics": {
      "style": "minimalist",
      "mood": "warm",
      "energy": "calm"
    },
    "colorPalette": ["#FF8A65", "#FFD180", "#BCAAA4"],
    "provider": "subtaste-internal"
  }
}
```

#### 4. Get Recommendations
```http
GET /api/taste/recommendations/profile123
X-API-Key: sk_abc123...

Response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "archetype": "Artisan",
        "glyph": "🎨",
        "confidence": 0.92,
        "suggestedThemes": ["handcrafted", "authentic", "detailed"],
        "suggestedColors": ["#8D6E63", "#BCAAA4"],
        "suggestedMoods": ["warm", "nostalgic"]
      }
    ],
    "tasteProfile": {
      "dominantArchetype": "Artisan",
      "diversity": 0.65,
      "consistency": 0.88
    }
  }
}
```

#### 5. Batch Score (up to 100 items)
```http
POST /api/taste/batch-score
X-API-Key: sk_abc123...

{
  "items": [
    { "content": {...}, "tasteProfileId": "profile123" },
    { "content": {...}, "tasteProfileId": "profile123" },
    ...
  ]
}

Response:
{
  "success": true,
  "data": {
    "results": [
      { "success": true, "data": {...} },
      { "success": true, "data": {...} }
    ],
    "total": 100,
    "successful": 98,
    "failed": 2
  }
}
```

#### 6. Get Usage Stats
```http
GET /api/taste/usage
X-API-Key: sk_abc123...

Response:
{
  "success": true,
  "data": {
    "partner": "Your Company",
    "tier": "professional",
    "usage": {
      "totalRequests": 145289,
      "requestsThisHour": 234,
      "requestsThisMonth": 89450,
      "lastRequest": "2026-02-05T10:30:00Z"
    },
    "limits": {
      "requestsPerHour": 5000,
      "remaining": 4766,
      "resetAt": "2026-02-05T11:00:00Z"
    }
  }
}
```

---

## Admin API (Key Management)

**Base**: `/api/admin/api-keys`
**Auth**: Requires user authentication (admin only)

### Create API Key
```http
POST /api/admin/api-keys/create
Authorization: Bearer <user-token>

{
  "partnerName": "Acme Corp",
  "partnerEmail": "dev@acme.com",
  "partnerType": "saas",
  "tier": "professional",
  "description": "Social media management tool",
  "website": "https://acme.com"
}

Response:
{
  "success": true,
  "message": "API key created successfully",
  "apiKey": {
    "partnerId": "partner_1738749000_x7k2m9",
    "partnerName": "Acme Corp",
    "apiKey": "sk_a1b2c3d4e5f6...",
    "apiSecret": "secret_x7y8z9...",  // ONLY SHOWN ONCE!
    "tier": "professional",
    "rateLimit": 5000,
    "allowedEndpoints": ["all"],
    "createdAt": "2026-02-05T10:30:00Z"
  },
  "warning": "Store the apiSecret securely - it will not be shown again"
}
```

### List All Keys
```http
GET /api/admin/api-keys
Authorization: Bearer <user-token>

Response:
{
  "success": true,
  "count": 42,
  "keys": [...]
}
```

### Update Key
```http
PUT /api/admin/api-keys/partner_123
Authorization: Bearer <user-token>

{
  "tier": "enterprise",
  "rateLimit": 20000,
  "isActive": true
}
```

### Revoke Key
```http
DELETE /api/admin/api-keys/partner_123
Authorization: Bearer <user-token>
```

---

## Pricing Tiers

| Tier | Requests/Hour | Requests/Month | Price/Month |
|------|--------------|----------------|-------------|
| **Free** | 100 | 10,000 | $0 |
| **Starter** | 1,000 | 100,000 | $49 |
| **Professional** | 5,000 | 500,000 | $199 |
| **Enterprise** | 20,000 | 2,000,000 | $999 |

**Overage Pricing**: $0.001 per request above monthly limit

---

## Rate Limiting

**Headers Included in Response:**
```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4766
X-RateLimit-Reset: 2026-02-05T11:00:00Z
```

**429 Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "limit": 5000,
  "remaining": 0,
  "resetAt": "2026-02-05T11:00:00Z",
  "message": "Rate limit: 5000 requests per hour"
}
```

---

## Integration with Standalone Subtaste

**Current State:**
- Uses internal Subtaste/genome system
- SubtasteAdapter wraps convictionService

**Future Integration:**
When standalone Subtaste is ready, swap adapter:

### 1. Create Subtaste Client

```javascript
// src/services/subtasteClient.js
class SubtasteClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async scoreContent(content, tasteProfileId) {
    const response = await fetch(`${this.apiUrl}/api/score`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, tasteProfileId })
    });

    const result = await response.json();
    return {
      score: result.score,
      tier: result.tier,
      breakdown: result.breakdown,
      archetypeMatch: result.archetypeMatch,
      confidence: result.confidence,
      provider: 'subtaste-standalone'
    };
  }

  // Implement other methods...
}

module.exports = new SubtasteClient(
  process.env.SUBTASTE_API_URL,
  process.env.SUBTASTE_API_KEY
);
```

### 2. Update tasteApiService.js

```javascript
// Change import from:
const subtaste = require('./tasteApiService'); // Adapter

// To:
const subtaste = require('./subtasteClient'); // Client
```

### 3. Add Environment Variables

```env
SUBTASTE_API_URL=https://subtaste-api.example.com
SUBTASTE_API_KEY=subtaste_key_abc123
```

**That's it!** Zero changes to API routes. Partners see no difference.

---

## Use Cases

### 1. Social Media Management Tools
```javascript
// Before posting, check taste alignment
const score = await fetch('https://api.slayt.com/api/taste/score', {
  headers: { 'X-API-Key': 'sk_...' },
  body: JSON.stringify({
    content: { imageUrl, caption },
    tasteProfileId: userId
  })
});

if (score.data.score < 60) {
  alert('This content may not perform well for your audience');
}
```

### 2. Content Generation Tools
```javascript
// Get archetype for AI-generated content
const archetype = await fetch('https://api.slayt.com/api/taste/archetype', {
  headers: { 'X-API-Key': 'sk_...' },
  body: JSON.stringify({ content: { imageUrl: generatedImage } })
});

// Adjust generation parameters based on archetype
if (archetype.data.archetype.designation === 'Artisan') {
  // Generate more handcrafted, detailed content
}
```

### 3. Creator Analytics Platforms
```javascript
// Analyze creator's content library
const recommendations = await fetch(
  `https://api.slayt.com/api/taste/recommendations/${creatorProfileId}`,
  { headers: { 'X-API-Key': 'sk_...' } }
);

// Show recommendations
console.log('Your top archetype:', recommendations.data.tasteProfile.dominantArchetype);
console.log('Suggested themes:', recommendations.data.recommendations[0].suggestedThemes);
```

### 4. Agency Tools
```javascript
// Batch score client's content queue
const scores = await fetch('https://api.slayt.com/api/taste/batch-score', {
  headers: { 'X-API-Key': 'sk_...' },
  body: JSON.stringify({
    items: contentQueue.map(item => ({
      content: item,
      tasteProfileId: clientProfileId
    }))
  })
});

// Prioritize high-scoring content
const prioritized = scores.data.results
  .filter(r => r.success && r.data.score >= 70)
  .sort((a, b) => b.data.score - a.data.score);
```

---

## Revenue Model

### API Monetization

**Tiered Subscriptions:**
- Free tier: 100 req/hour → Acquisition funnel
- Starter: $49/month → Small teams
- Professional: $199/month → Agencies
- Enterprise: $999/month → Large platforms

**Overage Charges:**
- $0.001 per request over monthly limit
- Automatically billed monthly

**Annual Discounts:**
- 20% off annual plans
- Starter: $470/year (save $118)
- Professional: $1,910/year (save $478)
- Enterprise: $9,590/year (save $2,398)

### Revenue Projections (Year 1)

**Conservative Estimates:**

| Partners | Tier | Monthly Revenue | Annual Revenue |
|----------|------|----------------|----------------|
| 100 | Free | $0 | $0 |
| 30 | Starter | $1,470 | $17,640 |
| 15 | Professional | $2,985 | $35,820 |
| 5 | Enterprise | $4,995 | $59,940 |
| **Total** | | **$9,450/mo** | **$113,400/yr** |

**Plus Overages**: ~$2,000/month = **$135,400/year**

**Year 2 (3x growth)**: $406,200/year
**Year 3 (5x)**: $677,000/year

---

## ERRC Completion

### CREATE Column (100% Complete ✅)

- ✅ **1193 Taste Schema** (JSON signals + archetypes)
- ✅ **Conviction Loop** (taste→confidence→ROAS feedback)
- ✅ **Designer Vault** (Folio→templates marketplace)
- ✅ **Taste API** (partner moat + revenue)

### Strategic Value

**Data Moat:**
- Partners integrate → can't easily switch
- API usage data → improves Subtaste
- Network effect: more partners = better taste intelligence

**Revenue Moat:**
- Recurring subscription revenue
- Usage-based pricing → scales with partner success
- Enterprise contracts → sticky revenue

**Platform Moat:**
- Partners build on Slayt's taste infrastructure
- Ecosystem lock-in
- Becomes industry standard for taste scoring

---

## Metrics to Track

**API Performance:**
- Total API requests (daily/monthly)
- Average response time (<200ms target)
- Error rate (<0.1% target)
- Uptime (99.9% target)

**Business Metrics:**
- Total partners (target: 100 in 6 months)
- Paid conversion rate (target: 30% free → paid)
- Monthly recurring revenue (MRR)
- Average revenue per partner
- Churn rate (<5% target)

**Usage Metrics:**
- Requests per partner
- Most used endpoints
- Batch vs single requests ratio
- Overage frequency

---

## Next Steps (Future Enhancements)

### 1. Webhooks
```javascript
// Partner receives webhook when analysis completes
POST https://partner.com/webhooks/taste
{
  "event": "analysis.completed",
  "contentId": "img123",
  "result": {...}
}
```

### 2. SDKs
```javascript
// JavaScript SDK
import { TasteAPI } from '@slayt/taste-api';

const taste = new TasteAPI('sk_...');
const score = await taste.scoreContent({...});
```

### 3. GraphQL API
```graphql
query {
  scoreContent(
    imageUrl: "https://...",
    tasteProfileId: "profile123"
  ) {
    score
    tier
    archetypeMatch {
      designation
      confidence
    }
  }
}
```

### 4. White-Label API
Enterprise tier gets custom domain:
- `https://taste-api.acme.com` → proxies to Slayt
- Partner's branding
- Additional revenue stream

---

**Committed & Pushed to GitHub** ✅
**Server Running with Taste API** ✅
**All ERRC "CREATE" Features Complete** ✅

**The revolutionary feature set is done.** Now it's about execution and growth.
