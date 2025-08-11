const mongoose = require('mongoose');

const referenceCacheSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    unique: true
  },
  results: {
    type: [Object],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL
  }
});

module.exports = mongoose.model('ReferenceCache', referenceCacheSchema);