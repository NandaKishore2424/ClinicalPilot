import React from 'react';
import { Box, Typography, Paper, Chip, Link, Tooltip, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const DiagnosisCard = ({ title, diagnosis, compact = false }) => {
  const handleCopyDiagnosis = () => {
    const text = `${diagnosis.name}${diagnosis.icd10Code ? ` (ICD-10: ${diagnosis.icd10Code})` : ''}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <Paper 
      elevation={compact ? 0 : 1} 
      sx={{ 
        p: compact ? 1.5 : 2, 
        mb: 1.5, 
        bgcolor: compact 
          ? 'transparent' 
          : theme => theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.08)' 
          : 'rgba(0,0,0,0.06)',
        borderRadius: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(156, 100, 254, 0.2)' 
            : 'rgba(106, 66, 193, 0.2)',
          boxShadow: theme => theme.palette.mode === 'dark' 
            ? '0 0 10px rgba(156, 100, 254, 0.05)' 
            : '0 2px 8px rgba(106, 66, 193, 0.06)',
        }
      }}
    >
      {title && (
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          {title}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant={compact ? "body2" : "body1"} fontWeight="500">
            {diagnosis.name}
          </Typography>
          {diagnosis.icd10Code && (
            <Chip 
              label={`ICD-10: ${diagnosis.icd10Code}`} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 1, height: 24 }}
            />
          )}
        </Box>
        
        <Tooltip title="Copy diagnosis">
          <IconButton size="small" onClick={handleCopyDiagnosis} sx={{ ml: 1 }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {diagnosis.citations && diagnosis.citations.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            Source: 
            <Link 
              href={diagnosis.citations[0].link} 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ ml: 1, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            >
              {diagnosis.citations[0].title}
            </Link>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DiagnosisCard;