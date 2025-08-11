const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Get all conversations
router.get('/', historyController.getAllConversations);

// Get a specific conversation
router.get('/:conversationId', historyController.getConversationHistory);

// Rename a conversation
router.patch('/:conversationId/rename', historyController.renameConversation);

// Delete a conversation
router.delete('/:conversationId', historyController.deleteConversation);

module.exports = router;