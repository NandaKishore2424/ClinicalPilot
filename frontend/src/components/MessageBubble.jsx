import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Link, Divider, IconButton, Tooltip, Fade, Menu, MenuItem } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import DiagnosisCard from './DiagnosisCard';

const MessageBubble = ({ message }) => {
  const { role, content, imageUrl, data } = message;
  const [copied, setCopied] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const openMenu = Boolean(menuAnchorEl);
  
  const isUser = role === 'user';
  const isError = role === 'error';
  
  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleCopyAll = () => {
    let textToCopy = content;

    if (!isUser && data) {
      if (data.primaryDiagnosis) {
        textToCopy += `\n\nPrimary Diagnosis: ${data.primaryDiagnosis.name} (ICD-10: ${data.primaryDiagnosis.icd10Code || 'N/A'})`;
      }
      
      if (data.differentialDiagnoses?.length > 0) {
        textToCopy += '\n\nDifferential Diagnoses:';
        data.differentialDiagnoses.forEach(diag => {
          textToCopy += `\n- ${diag.name} (ICD-10: ${diag.icd10Code || 'N/A'})`;
        });
      }
      
      if (data.recommendedNextSteps?.length > 0) {
        textToCopy += '\n\nRecommended Next Steps:';
        data.recommendedNextSteps.forEach(step => {
          textToCopy += `\n- ${step.step}`;
        });
      }
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleMenuClose();
  };
  
  return (
    <Box 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      data-testid="message-bubble"
    >
      <Box className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1, 
          justifyContent: isUser ? 'flex-end' : 'flex-start' 
        }}>
          <Chip 
            label={isUser ? 'You' : isError ? 'Error' : 'Clinical Assistant'} 
            size="small" 
            color={isUser ? 'primary' : isError ? 'error' : 'secondary'}
            sx={{ fontWeight: 500, height: 24 }}
          />
          
          <Box sx={{ display: 'flex', ml: 1 }}>
            <Tooltip title={copied ? "Copied!" : "Copy message"}>
              <IconButton 
                size="small" 
                onClick={handleCopyContent} 
                color={copied ? "success" : "default"}
                sx={{ 
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }
                }}
              >
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            {!isUser && data && (
              <>
                <Tooltip title="More options">
                  <IconButton 
                    size="small" 
                    onClick={handleMenuOpen}
                    sx={{ 
                      ml: 0.5,
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      '&:hover': {
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      }
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={menuAnchorEl}
                  open={openMenu}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 200 }
                  }}
                >
                  <MenuItem onClick={handleCopyAll}>
                    <ContentCopyIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Copy full response
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Box>
        
        <Paper 
          elevation={2}
          sx={{ 
            p: 2.5, 
            borderRadius: 2.5,
            bgcolor: isUser 
              ? theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #6a42c1 30%, #8263d9 90%)' 
                : 'linear-gradient(45deg, #5c35b5 30%, #7e55e2 90%)'
              : isError 
                ? '#ffebee' 
                : theme => theme.palette.mode === 'dark' ? '#1c1c1c' : '#ffffff',
            color: isUser ? 'white' : isError ? '#d32f2f' : 'text.primary',
            border: !isUser && !isError ? 1 : 0,
            borderColor: 'divider',
            boxShadow: isUser 
              ? '0 2px 10px rgba(106, 66, 193, 0.3)' 
              : isError 
                ? '0 2px 10px rgba(244, 67, 54, 0.2)' 
                : theme => theme.palette.mode === 'dark' 
                  ? 'none' 
                  : '0 1px 8px rgba(0, 0, 0, 0.07)',
          }}
        >
          {/* Display uploaded image if available */}
          {imageUrl && (
            <Box sx={{ mb: 2 }}>
              <Box
                component="img"
                src={imageUrl} 
                alt="Uploaded content" 
                sx={{
                  maxWidth: '100%',
                  borderRadius: 2,
                  maxHeight: 240,
                  objectFit: 'contain',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Box>
          )}
          
          {/* Text content */}
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontWeight: isUser ? 400 : 400,
              letterSpacing: 0.2,
            }}
          >
            {content}
          </Typography>
          
          {/* Structured clinical data (if assistant response) */}
          {!isUser && data && (
            <Fade in={true} timeout={500}>
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 2 }} />
                
                {/* Primary Diagnosis */}
                {data.primaryDiagnosis && (
                  <DiagnosisCard 
                    title="Primary Diagnosis"
                    diagnosis={data.primaryDiagnosis}
                  />
                )}
                
                {/* Differential Diagnoses */}
                {data.differentialDiagnoses && data.differentialDiagnoses.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      Differential Diagnoses:
                    </Typography>
                    {data.differentialDiagnoses.map((diagnosis, idx) => (
                      <DiagnosisCard 
                        key={idx}
                        diagnosis={diagnosis}
                        compact
                      />
                    ))}
                  </Box>
                )}
                
                {/* Recommended Next Steps */}
                {data.recommendedNextSteps && data.recommendedNextSteps.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      Recommended Next Steps:
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                      {data.recommendedNextSteps.map((step, idx) => (
                        <Box component="li" key={idx} sx={{ mb: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{step.step}</Typography>
                          {step.citations && step.citations.length > 0 && (
                            <Box sx={{ ml: 0, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                Source: 
                                <Link 
                                  href={step.citations[0].link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  sx={{ ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
                                >
                                  {step.citations[0].title}
                                </Link>
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble;