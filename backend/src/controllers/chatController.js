const Conversation = require('../models/Conversation');
const llmService = require('../services/llmService');
const referenceService = require('../services/referenceService');

exports.processChat = async (req, res, next) => {
  let conversation;
  try {
    console.log('[Chat] Incoming request fields:', Object.keys(req.body));
    const { message, conversationId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const imageFile = req.file;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`;
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        console.warn('[Chat] Provided conversationId not found, starting new conversation:', conversationId);
        conversation = new Conversation({ messages: [] }); 
      }
    } else {
      conversation = new Conversation({ messages: [] });
    }

    conversation.messages.push({
      role: 'user',
      content: message,
      imageUrl
    });

    try {
      await conversation.save();
      console.log('[Chat] Saved user message. ConversationId:', conversation._id.toString(), 'MessageCount:', conversation.messages.length);
    } catch (saveErr) {
      console.error('[Chat] Error saving user message:', saveErr.message);
      return res.status(500).json({ message: 'DB save error (user message)', detail: saveErr.message });
    }

    const conversationHistory = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const llmResponse = await llmService.processClinicalQuery(message, imageUrl, conversationHistory);

    if (llmResponse.error) {
      // Store error-style assistant message but continue
      conversation.messages.push({
        role: 'assistant',
        content: llmResponse.text,
        data: {
          primaryDiagnosis: null,
          differentialDiagnoses: [],
          recommendedNextSteps: []
        }
      });
      await conversation.save();
      return res.status(200).json({
        text: llmResponse.text,
        data: {
          primaryDiagnosis: null,
          differentialDiagnoses: [],
          recommendedNextSteps: []
        },
        conversationId: conversation._id
      });
    }

    // References enrichment
    if (llmResponse.primaryDiagnosis) {
      llmResponse.primaryDiagnosis.citations = await referenceService.findReferences(llmResponse.primaryDiagnosis.name);
    }
    if (Array.isArray(llmResponse.differentialDiagnoses)) {
      for (const d of llmResponse.differentialDiagnoses) {
        d.citations = await referenceService.findReferences(d.name);
      }
    }
    if (Array.isArray(llmResponse.recommendedNextSteps)) {
      for (const step of llmResponse.recommendedNextSteps) {
        step.citations = await referenceService.findReferences(step.step);
      }
    }

    // FINAL SANITIZATION (defensive)
    const normalizeDiagnosis = (d) => {
      if (!d || !d.name || !d.name.trim()) return null;
      return {
        name: d.name.trim(),
        icd10Code: d.icd10Code || '',
        citations: Array.isArray(d.citations) ? d.citations : []
      };
    };
    const primaryDiagnosis = normalizeDiagnosis(llmResponse.primaryDiagnosis);

    const differentialDiagnoses = Array.isArray(llmResponse.differentialDiagnoses)
      ? llmResponse.differentialDiagnoses
          .map(normalizeDiagnosis)
          .filter(Boolean)
      : [];

    const recommendedNextSteps = Array.isArray(llmResponse.recommendedNextSteps)
      ? llmResponse.recommendedNextSteps
          .filter(s => s && s.step && s.step.trim())
          .map(s => ({
            step: s.step.trim(),
            citations: Array.isArray(s.citations) ? s.citations : []
          }))
      : [];

    conversation.messages.push({
      role: 'assistant',
      content: llmResponse.text || 'Response generated.',
      data: {
        primaryDiagnosis,
        differentialDiagnoses,
        recommendedNextSteps
      }
    });

    await conversation.save();
    console.log('[Chat] Assistant response saved. ConversationId:', conversation._id.toString());

    res.status(200).json({
      text: llmResponse.text || 'Response generated.',
      data: {
        primaryDiagnosis,
        differentialDiagnoses,
        recommendedNextSteps
      },
      conversationId: conversation._id
    });

  } catch (error) {
    console.error('[Chat] Unhandled error:', error);
    if (conversation) {
      try {
        conversation.messages.push({
          role: 'error',
            content: `An error occurred: ${error.message}`
        });
        await conversation.save();
      } catch (inner) {
        console.error('[Chat] Failed to save error message:', inner.message);
      }
    }
    res.status(500).json({
      error: 'Error processing request',
      message: error.message,
      conversationId: conversation ? conversation._id : null
    });
  }
};