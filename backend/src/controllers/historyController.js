const Conversation = require('../models/Conversation');

exports.getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json({
      conversationId: conversation._id,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({})
      .select('_id messages.content updatedAt title')
      .sort({ updatedAt: -1 });
    
    // Format the response to include preview text from the first message
    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      title: conv.title || null,
      preview: conv.messages[0]?.content || 'New conversation',
      updatedAt: conv.updatedAt
    }));
    
    res.status(200).json(formattedConversations);
  } catch (error) {
    next(error);
  }
};

// New controller for renaming a conversation
exports.renameConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.title = title.trim();
    await conversation.save();
    
    res.status(200).json({ 
      message: 'Conversation renamed successfully',
      id: conversation._id,
      title: conversation.title
    });
  } catch (error) {
    console.error('[History] Error renaming conversation:', error);
    next(error);
  }
};

// New controller for deleting a conversation
exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const result = await Conversation.findByIdAndDelete(conversationId);
    if (!result) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json({ 
      message: 'Conversation deleted successfully',
      id: conversationId
    });
  } catch (error) {
    console.error('[History] Error deleting conversation:', error);
    next(error);
  }
};