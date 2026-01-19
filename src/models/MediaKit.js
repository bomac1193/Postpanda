const mongoose = require('mongoose');

const mediaKitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'My Media Kit'
  },
  template: {
    type: String,
    enum: ['minimal', 'professional', 'creative', 'bold'],
    default: 'professional'
  },
  sections: {
    about: {
      enabled: { type: Boolean, default: true },
      headline: { type: String, default: '' },
      bio: { type: String, default: '' },
      location: { type: String, default: '' },
      categories: [{ type: String }],
      profileImage: { type: String }
    },
    stats: {
      enabled: { type: Boolean, default: true },
      platforms: [{
        name: { type: String },
        followers: { type: Number },
        engagementRate: { type: Number },
        avgLikes: { type: Number },
        avgComments: { type: Number },
        avgViews: { type: Number },
        username: { type: String }
      }],
      totalReach: { type: Number },
      avgEngagement: { type: Number }
    },
    services: {
      enabled: { type: Boolean, default: true },
      items: [{
        id: { type: String },
        name: { type: String },
        description: { type: String },
        price: { type: String },
        deliverables: [{ type: String }]
      }]
    },
    portfolio: {
      enabled: { type: Boolean, default: true },
      items: [{
        id: { type: String },
        title: { type: String },
        imageUrl: { type: String },
        brandName: { type: String },
        description: { type: String },
        metrics: {
          reach: { type: Number },
          engagement: { type: Number },
          clicks: { type: Number }
        }
      }]
    },
    testimonials: {
      enabled: { type: Boolean, default: false },
      items: [{
        id: { type: String },
        quote: { type: String },
        author: { type: String },
        company: { type: String },
        logo: { type: String }
      }]
    },
    contact: {
      enabled: { type: Boolean, default: true },
      email: { type: String },
      phone: { type: String },
      website: { type: String },
      socialLinks: {
        instagram: { type: String },
        tiktok: { type: String },
        youtube: { type: String },
        twitter: { type: String }
      }
    }
  },
  customization: {
    primaryColor: { type: String, default: '#000000' },
    secondaryColor: { type: String, default: '#666666' },
    accentColor: { type: String, default: '#b29674' },
    backgroundColor: { type: String, default: '#ffffff' },
    headerImage: { type: String },
    fontFamily: { type: String, default: 'Inter' },
    showRates: { type: Boolean, default: false },
    showContactForm: { type: Boolean, default: true }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    lastViewed: { type: Date }
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

// Update timestamp on save
mediaKitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate slug from name
mediaKitSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  next();
});

module.exports = mongoose.model('MediaKit', mediaKitSchema);
