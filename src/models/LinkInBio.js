const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'link'
  },
  clicks: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const linkInBioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9_-]+$/
  },
  title: {
    type: String,
    default: 'My Links'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String
  },
  theme: {
    backgroundColor: {
      type: String,
      default: '#f4f0ea'
    },
    textColor: {
      type: String,
      default: '#110f0e'
    },
    buttonStyle: {
      type: String,
      enum: ['filled', 'outlined', 'soft', 'rounded'],
      default: 'filled'
    },
    buttonColor: {
      type: String,
      default: '#111111'
    },
    buttonTextColor: {
      type: String,
      default: '#ffffff'
    },
    fontFamily: {
      type: String,
      default: 'Space Grotesk'
    }
  },
  links: [linkSchema],
  socialLinks: {
    instagram: String,
    tiktok: String,
    twitter: String,
    youtube: String,
    pinterest: String,
    linkedin: String,
    facebook: String,
    website: String
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  seoTitle: String,
  seoDescription: String
}, {
  timestamps: true
});

// Index for fast slug lookups
linkInBioSchema.index({ slug: 1 });
linkInBioSchema.index({ userId: 1 });

// Generate unique slug
linkInBioSchema.statics.generateUniqueSlug = async function(baseSlug) {
  let slug = baseSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  let counter = 0;
  let uniqueSlug = slug;

  while (await this.findOne({ slug: uniqueSlug })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
};

// Track page view
linkInBioSchema.methods.trackView = async function(visitorId) {
  this.analytics.totalViews += 1;
  this.analytics.lastViewedAt = new Date();
  // Could implement unique visitor tracking with visitorId
  await this.save();
};

// Track link click
linkInBioSchema.methods.trackLinkClick = async function(linkId) {
  const link = this.links.id(linkId);
  if (link) {
    link.clicks += 1;
    await this.save();
  }
};

// Get active links sorted by order
linkInBioSchema.methods.getActiveLinks = function() {
  return this.links
    .filter(link => link.isActive)
    .sort((a, b) => a.order - b.order);
};

module.exports = mongoose.model('LinkInBio', linkInBioSchema);
