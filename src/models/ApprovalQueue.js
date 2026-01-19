const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerName: {
    type: String
  },
  status: {
    type: String,
    enum: ['approved', 'rejected', 'revision_requested'],
    required: true
  },
  feedback: {
    type: String
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
});

const approvalQueueSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  contentType: {
    type: String,
    enum: ['post', 'story', 'reel', 'carousel'],
    default: 'post'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterName: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'revision_requested', 'published'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  caption: {
    type: String
  },
  hashtags: [{
    type: String
  }],
  scheduledFor: {
    type: Date
  },
  platforms: [{
    type: String,
    enum: ['instagram', 'tiktok', 'twitter', 'youtube', 'pinterest']
  }],
  reviews: [reviewSchema],
  currentReviewLevel: {
    type: Number,
    default: 1
  },
  requiredApprovalLevels: {
    type: Number,
    default: 1
  },
  notes: {
    type: String
  },
  metadata: {
    thumbnailUrl: { type: String },
    mediaType: { type: String },
    duration: { type: Number }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  publishedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
approvalQueueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
approvalQueueSchema.index({ workspaceId: 1, status: 1 });
approvalQueueSchema.index({ workspaceId: 1, submittedBy: 1 });
approvalQueueSchema.index({ workspaceId: 1, submittedAt: -1 });

// Method to add a review
approvalQueueSchema.methods.addReview = function(reviewerId, reviewerName, status, feedback) {
  this.reviews.push({
    reviewerId,
    reviewerName,
    status,
    feedback,
    reviewedAt: new Date()
  });

  this.reviewedAt = new Date();

  if (status === 'approved') {
    if (this.currentReviewLevel >= this.requiredApprovalLevels) {
      this.status = 'approved';
    } else {
      this.currentReviewLevel += 1;
      this.status = 'in_review';
    }
  } else if (status === 'rejected') {
    this.status = 'rejected';
  } else if (status === 'revision_requested') {
    this.status = 'revision_requested';
    this.currentReviewLevel = 1;
  }

  return this;
};

// Method to resubmit after revision
approvalQueueSchema.methods.resubmit = function(caption, notes) {
  if (caption) this.caption = caption;
  if (notes) this.notes = notes;
  this.status = 'pending';
  this.currentReviewLevel = 1;
  this.submittedAt = new Date();
  return this;
};

// Static method to get pending count for a workspace
approvalQueueSchema.statics.getPendingCount = async function(workspaceId) {
  return this.countDocuments({
    workspaceId,
    status: { $in: ['pending', 'in_review'] }
  });
};

// Static method to get submissions by user
approvalQueueSchema.statics.getBySubmitter = async function(workspaceId, userId) {
  return this.find({ workspaceId, submittedBy: userId })
    .sort({ submittedAt: -1 })
    .populate('contentId');
};

module.exports = mongoose.model('ApprovalQueue', approvalQueueSchema);
