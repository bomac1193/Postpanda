const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['schedule_reminder', 'published', 'failed', 'info'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  platform: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
