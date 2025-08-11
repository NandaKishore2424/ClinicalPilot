require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const chatRoutes = require('./routes/chat');
const historyRoutes = require('./routes/history');

// Check if environment variables are loaded correctly
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Available' : 'Not available');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Available (ending with ' + process.env.GEMINI_API_KEY.slice(-4) + ')' : 'Not available');
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinicalPilot')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check route
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState, // 1 = connected
    env: {
      mock: process.env.USE_MOCK_LLM,
      provider: process.env.LLM_PROVIDER
    }
  });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;