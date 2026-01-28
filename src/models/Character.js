/**
 * Character Model
 * AI characters that can be assigned to grid posts.
 * Each character has a distinct personality, voice, and content style.
 * Adapted from Boveda's Living Character OS.
 */

const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Identity
  name: {
    type: String,
    required: true,
    trim: true
  },
  aliases: [{ type: String }],
  avatar: { type: String }, // Cloudinary URL
  avatarPosition: {
    type: Object,
    default: { x: 0, y: 0 }
  },
  avatarZoom: { type: Number, default: 1 },
  bio: { type: String, default: '' },
  color: { type: String, default: '#8b5cf6' },

  // Personality (drives content generation)
  personaTags: [{ type: String }], // e.g. ["bold", "mysterious", "witty"]
  toneAllowed: [{ type: String }], // e.g. ["sarcastic", "confident", "playful"]
  toneForbidden: [{ type: String }], // e.g. ["aggressive", "vulgar"]
  systemPrompt: { type: String, default: '' }, // Custom LLM prompt for this character

  // Voice / content style
  voice: {
    type: String,
    enum: ['conversational', 'authoritative', 'playful', 'vulnerable', 'provocateur', 'mentor', 'poetic', 'raw'],
    default: 'conversational'
  },
  captionStyle: {
    type: String,
    enum: ['short-punchy', 'storyteller', 'educational', 'provocative', 'poetic', 'listicle', 'conversational'],
    default: 'conversational'
  },
  hookPreferences: [{ type: String }], // preferred hook types for this character

  // Platform preferences
  platforms: [{
    type: String,
    enum: ['instagram', 'tiktok', 'youtube', 'linkedin']
  }],

  // Performance tracking (what works for this character)
  performanceData: {
    totalPosts: { type: Number, default: 0 },
    avgEngagement: { type: Number, default: 0 },
    bestHookTypes: [{ type: String }],
    bestTones: [{ type: String }],
    bestPostTimes: [{ type: String }],
    topKeywords: [{ type: String }]
  },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

characterSchema.index({ userId: 1, isActive: 1 });

characterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Build a generation prompt context from this character's personality
 */
characterSchema.methods.buildPromptContext = function() {
  const parts = [];

  if (this.name) parts.push(`You are ${this.name}.`);
  if (this.bio) parts.push(this.bio);
  if (this.personaTags?.length) parts.push(`Personality: ${this.personaTags.join(', ')}.`);
  if (this.toneAllowed?.length) parts.push(`Use these tones: ${this.toneAllowed.join(', ')}.`);
  if (this.toneForbidden?.length) parts.push(`NEVER use these tones: ${this.toneForbidden.join(', ')}.`);
  if (this.voice) parts.push(`Voice style: ${this.voice}.`);
  if (this.captionStyle) parts.push(`Caption style: ${this.captionStyle}.`);
  if (this.systemPrompt) parts.push(this.systemPrompt);

  return parts.join(' ');
};

module.exports = mongoose.model('Character', characterSchema);
