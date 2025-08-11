import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, CircularProgress, Divider, Typography, IconButton, InputAdornment, Fade, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MessageBubble from './MessageBubble';
import ImageUploader from './ImageUploader';
import { sendMessage, getConversationHistory } from '../services/api';

const ChatWindow = ({ conversationId, setConversationId, colorMode }) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation history if conversationId exists
  useEffect(() => {
    const loadHistory = async () => {
      if (conversationId) {
        try {
          setLoading(true);
          const history = await getConversationHistory(conversationId);
          setMessages(history.messages);
        } catch (error) {
          console.error('Error loading conversation history:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([]);
      }
    };
    
    loadHistory();
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 50;
      
      if (!isScrolledUp || messages.length <= 1) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
      } else {
        setHasNewMessages(true);
      }
    }
  }, [messages]); // No need for scrollToBottom in deps if we inline the function

  // Check if user has scrolled up and new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    
    const handleScroll = () => {
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
        setHasNewMessages(!isScrolledToBottom && messages.length > 0);
      }
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessages(false);
  };

  const handleSend = async () => {
    if (!message.trim() && !image) return;

    const attempt = async (allowRetry = true) => {
      try {
        const userMessage = { role: 'user', content: message, imageUrl: imagePreview };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        const response = await sendMessage(message, image, conversationId);

        if (!conversationId && response.conversationId) {
          setConversationId(response.conversationId);
          localStorage.setItem('conversationId', response.conversationId);
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.text,
          data: response.data
        }]);

        setMessage('');
        setImage(null);
        setImagePreview(null);
        
        // Focus input field after sending
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        
      } catch (error) {
        console.error('Error sending message:', error);

        // Auto-recover if stale conversation ID
        if (allowRetry && /Conversation not found/i.test(error.message)) {
          console.warn('[ChatWindow] Stale conversationId detected. Clearing and retrying.');
          localStorage.removeItem('conversationId');
          setConversationId(null);
          await attempt(false);
          return;
        }

        setMessages(prev => [...prev, {
          role: 'error',
          content: `Error: ${error.message || 'Unknown error'}`
        }]);
      } finally {
        setLoading(false);
      }
    };

    await attempt(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: colorMode === 'dark' ? 'background.paper' : 'inherit', 
    }}>
      {/* Messages Container */}
      <Box 
        ref={messagesContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: { xs: 2, md: 3 },
          bgcolor: colorMode === 'dark' ? 'background.default' : '#f9f9f9',
          position: 'relative',
        }}
      >
        {messages.length === 0 ? (
          <Fade in={true} timeout={800}>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              opacity: 0.8
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Clinical Pilot
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', maxWidth: 450 }}>
                Start a new conversation by describing symptoms, uploading relevant images, or asking clinical questions.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: 1, 
                maxWidth: 600 
              }}>
                {["I have chest pain", "Persistent headache with fever", "Skin rash with itching", "Joint pain in knees", "Fatigue and shortness of breath"].map((example, idx) => (
                  <Box 
                    key={idx}
                    onClick={() => setMessage(example)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      }
                    }}
                  >
                    <Typography variant="body2">{example}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress size={28} color="primary" />
          </Box>
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {hasNewMessages && (
          <Tooltip title="Scroll to bottom">
            <IconButton
              color="primary"
              size="small"
              onClick={handleScrollToBottom}
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                backgroundColor: 'background.paper',
                boxShadow: 3,
                '&:hover': {
                  backgroundColor: colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        bgcolor: theme => theme.palette.mode === 'dark' ? '#141414' : '#ffffff',
        display: 'flex', 
        alignItems: 'flex-end',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <ImageUploader 
          setImage={setImage} 
          setImagePreview={setImagePreview} 
          imagePreview={imagePreview} 
        />
        
        <TextField
          fullWidth
          multiline
          inputRef={inputRef}
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe symptoms or ask a clinical question..."
          variant="outlined"
          size="medium"
          disabled={loading}
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.95rem',
              py: 1,
              transition: 'all 0.3s',
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              },
              '&.Mui-focused': {
                boxShadow: theme => 
                  theme.palette.mode === 'dark' 
                  ? '0 0 0 2px rgba(106, 66, 193, 0.3)' 
                  : '0 0 0 2px rgba(106, 66, 193, 0.2)'
              }
            }
          }}
          InputProps={{
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} sx={{ color: 'primary.main' }} />
              </InputAdornment>
            )
          }}
        />
        
        <IconButton 
          color="primary" 
          onClick={handleSend} 
          disabled={loading || (!message.trim() && !image)}
          sx={{ 
            background: theme => theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #6a42c1 30%, #8e64fe 90%)' 
              : 'linear-gradient(45deg, #5c35b5 30%, #7e55e2 90%)',
            color: 'white',
            p: 1.5,
            borderRadius: 2,
            transition: 'all 0.2s',
            '&:hover': { 
              transform: 'scale(1.05)',
              boxShadow: '0 2px 8px rgba(106, 66, 193, 0.3)',
            },
            '&.Mui-disabled': { 
              background: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.08)' 
                : 'rgba(0,0,0,0.08)', 
              color: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.26)' 
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatWindow;