const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  }
});

const diagnosisSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  icd10Code: String,
  citations: [citationSchema]
});

const recommendedStepSchema = new mongoose.Schema({
  step: {
    type: String,
    required: true
  },
  citations: [citationSchema]
});

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'error'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    primaryDiagnosis: diagnosisSchema,
    differentialDiagnoses: [diagnosisSchema],
    recommendedNextSteps: [recommendedStepSchema]
  }
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before save
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);