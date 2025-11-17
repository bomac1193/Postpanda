const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Content'
  },
  caption: {
    type: String,
    maxlength: 2200
  },
  mediaUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'carousel'],
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'tiktok'],
    required: true
  },
  // AI Scoring
  aiScores: {
    viralityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    aestheticScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    trendScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    analyzedAt: Date
  },
  // AI Suggestions
  aiSuggestions: {
    recommendedType: {
      type: String,
      enum: ['post', 'carousel', 'reel', 'story', 'video'],
    },
    reason: String,
    improvements: [String],
    bestTimeToPost: String,
    targetAudience: String,
    hashtagSuggestions: [String],
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  // Multiple versions for A/B testing
  versions: [{
    versionName: String,
    mediaUrl: String,
    thumbnailUrl: String,
    caption: String,
    aiScores: {
      viralityScore: Number,
      engagementScore: Number,
      aestheticScore: Number,
      trendScore: Number,
      overallScore: Number
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  metadata: {
    width: Number,
    height: Number,
    aspectRatio: String,
    fileSize: Number,
    duration: Number, // for videos
    format: String,
    dominantColors: [String]
  },
  // Scheduling
  scheduledFor: Date,
  publishedAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  hashtags: [String],
  mentions: [String],
  location: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate overall score from individual scores
contentSchema.methods.calculateOverallScore = function() {
  const scores = this.aiScores;
  const total = scores.viralityScore + scores.engagementScore +
                scores.aestheticScore + scores.trendScore;
  this.aiScores.overallScore = Math.round(total / 4);
  return this.aiScores.overallScore;
};

module.exports = mongoose.model('Content', contentSchema);
