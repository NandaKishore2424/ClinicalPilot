const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const chatController = require('../controllers/chatController');

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/', upload.single('image'), chatController.processChat);

router.get('/test', async (req, res) => {
  try {
    const axios = require('axios');
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "API key not found" });
    }

    // Allow model override ?model=
    const model = req.query.model || process.env.GEMINI_TEST_MODEL || 'gemini-1.5-flash-latest';
    console.log(`[Test] Using model: ${model}`);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: "Respond only with: OK" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 10 }
      },
      { timeout: 15000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
    res.status(200).json({
      success: true,
      model,
      message: "Gemini API connection successful",
      response: text
    });
  } catch (error) {
    const status = error.response?.status;
    const retryInfo = error.response?.data?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
    res.status(500).json({
      success: false,
      message: "Gemini API connection failed",
      status,
      error: error.response?.data?.error?.message || error.message,
      retryDelay: retryInfo?.retryDelay
    });
  }
});

module.exports = router;