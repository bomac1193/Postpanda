const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  url: String,
  originalName: String
}, { _id: false });

const scheduleEntrySchema = new mongoose.Schema({
  title: String,
  description: String,
  platform: String,
  deliverable: String,
  dayOffset: Number,
  dueDate: Date
}, { _id: false });

const haloSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['halo', 'rollout'],
    default: 'halo'
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
  niche: String,
  tags: [String],
  priceCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  promptText: {
    type: String,
    required: true
  },
  referenceImages: [assetSchema],
  lutFiles: [assetSchema],
  labelType: {
    type: String,
    enum: ['major', 'indie', 'agency', 'independent', 'brand'],
    default: 'independent'
  },
  projectName: String,
  launchDate: Date,
  schedule: [scheduleEntrySchema],
  scheduleFiles: [assetSchema],
  buyers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    downloads: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
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

haloSchema.index({ status: 1, createdAt: -1 });

haloSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

haloSchema.methods.hasAccess = function(userId) {
  if (!userId) return false;
  if (this.ownerId && this.ownerId.equals(userId)) return true;
  return this.buyers?.some(buyer => buyer.userId?.equals(userId));
};

module.exports = mongoose.model('Halo', haloSchema);
