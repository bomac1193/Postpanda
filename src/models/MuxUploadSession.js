const mongoose = require('mongoose');

const muxUploadSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  scope: {
    type: String,
    enum: ['youtube-planner'],
    default: 'youtube-planner',
  },
  uploadId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  assetId: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'asset_created', 'processing', 'ready', 'errored', 'cancelled', 'timed_out'],
    default: 'waiting',
  },
  originalFilename: {
    type: String,
    trim: true,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
  },
  errorMessage: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

muxUploadSessionSchema.index({ userId: 1, uploadId: 1 }, { unique: true });

module.exports = mongoose.model('MuxUploadSession', muxUploadSessionSchema);
