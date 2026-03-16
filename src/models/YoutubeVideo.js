const mongoose = require('mongoose');

/**
 * YouTube Video Model
 * Represents a planned YouTube video with scheduling and metadata
 */
const youtubeVideoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YoutubeCollection',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String // base64 or URL (1920x1080 compressed)
  },
  thumbnailOriginalUrl: {
    type: String // Cloudinary URL of uncompressed original
  },
  thumbnailMode: {
    type: String,
    enum: ['custom', 'auto'],
    default: 'custom'
  },
  thumbnailStatus: {
    type: String,
    enum: ['missing', 'auto', 'custom', 'needs_custom'],
    default: 'missing'
  },
  videoUrl: {
    type: String
  },
  storageProvider: {
    type: String,
    enum: ['legacy', 'mux'],
    default: 'legacy'
  },
  videoFileName: {
    type: String
  },
  videoFileSize: {
    type: Number
  },
  videoMimeType: {
    type: String
  },
  durationSeconds: {
    type: Number
  },
  muxUploadId: {
    type: String,
    index: true
  },
  muxUploadStatus: {
    type: String
  },
  muxAssetId: {
    type: String,
    index: true
  },
  muxAssetStatus: {
    type: String
  },
  muxMasterStatus: {
    type: String
  },
  muxMasterAccessExpiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  privacyStatus: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'public'
  },
  endScreenTemplate: {
    type: String,
    enum: ['video_subscribe', 'playlist_subscribe', 'series_push', 'none'],
    default: 'video_subscribe'
  },
  scheduledDate: {
    type: Date
  },
  publishedAt: {
    type: Date
  },
  youtubeVideoId: {
    type: String
  },
  youtubeVideoUrl: {
    type: String
  },
  lastError: {
    type: String
  },
  originalFilename: {
    type: String,
    trim: true
  },
  thumbnailSourceFilename: {
    type: String,
    trim: true
  },
  artistName: {
    type: String,
    trim: true,
    default: ''
  },
  featuringArtists: [{
    type: String,
    trim: true
  }],
  position: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Conviction scoring (pre-publish quality gating)
  aiScores: {
    thumbnailScore: { type: Number, min: 0, max: 100, default: 0 },
    titleScore: { type: Number, min: 0, max: 100, default: 0 },
    descriptionScore: { type: Number, min: 0, max: 100, default: 0 },
    convictionScore: { type: Number, min: 0, max: 100, default: 0 }
  },
  conviction: {
    score: { type: Number, min: 0, max: 100 },
    tier: {
      type: String,
      enum: ['low', 'medium', 'high', 'exceptional']
    },
    gatingStatus: {
      type: String,
      enum: ['approved', 'warning', 'blocked', 'override']
    },
    gatingReason: { type: String },
    userOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
    calculatedAt: { type: Date }
  },

  // Post-publish analytics (populated by conviction loop)
  postPublishMetrics: {
    views: { type: Number },
    likes: { type: Number },
    comments: { type: Number },
    shares: { type: Number },
    avgViewDuration: { type: Number },
    avgViewPercentage: { type: Number },
    subscribersGained: { type: Number },
    estimatedMinutesWatched: { type: Number },
    lastFetchedAt: { type: Date }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
youtubeVideoSchema.index({ userId: 1, collectionId: 1 });
youtubeVideoSchema.index({ userId: 1, status: 1 });

// Update the updatedAt timestamp before saving
youtubeVideoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to update position
youtubeVideoSchema.methods.setPosition = function(newPosition) {
  this.position = newPosition;
  return this.save();
};

// Static method to find videos by collection
youtubeVideoSchema.statics.findByCollection = function(collectionId, userId) {
  return this.find({
    collectionId,
    userId
  }).sort({ position: 1 });
};

// Static method to find scheduled videos
youtubeVideoSchema.statics.findScheduled = function(userId) {
  return this.find({
    userId,
    status: 'scheduled',
    scheduledDate: { $gte: new Date() }
  }).sort({ scheduledDate: 1 });
};

// Enable virtuals in JSON
youtubeVideoSchema.set('toJSON', { virtuals: true });
youtubeVideoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('YoutubeVideo', youtubeVideoSchema);
