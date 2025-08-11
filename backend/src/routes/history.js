const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.getAllConversations);

router.get('/:conversationId', historyController.getConversationHistory);

router.patch('/:conversationId/rename', historyController.renameConversation);

router.delete('/:conversationId', historyController.deleteConversation);

module.exports = router;