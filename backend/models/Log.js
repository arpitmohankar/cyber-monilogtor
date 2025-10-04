const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['keylog', 'screenshot', 'system', 'clipboard', 'webcam', 'audio', 'alert']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceInfo: {
    hostname: String,
    platform: String,
    ip: String,
    version: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  tags: [String]
});

// Indexes for better performance
LogSchema.index({ timestamp: -1 });
LogSchema.index({ type: 1 });
LogSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Log', LogSchema);
