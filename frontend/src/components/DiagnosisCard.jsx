import React from 'react';
import { Paper, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

const DiagnosisCard = ({ title, diagnosis, compact = false, onShowReference }) => {
  const handleCopyDiagnosis = () => {
    const textToCopy = `${diagnosis.name}${diagnosis.icd10Code ? ` (ICD-10: ${diagnosis.icd10Code})` : ''}`;
    navigator.clipboard.writeText(textToCopy);
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
      {title && !compact && (
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant={compact ? "body2" : "body1"} 
            sx={{ fontWeight: compact ? 500 : 600 }}
          >
            {diagnosis.name}
          </Typography>
          
          {diagnosis.icd10Code && (
            <Chip 
              label={`ICD-10: ${diagnosis.icd10Code}`} 
              size="small"
              sx={{ 
                mt: 0.5, 
                height: 22,
                fontSize: '0.7rem',
                bgcolor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(106, 66, 193, 0.2)' 
                  : 'rgba(106, 66, 193, 0.1)',
                color: theme => theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'
              }} 
            />
          )}
        </Box>
        
        <Box>
          {diagnosis.icd10Code && (
            <Tooltip title="View medical reference">
              <IconButton 
                size="small" 
                onClick={() => onShowReference(diagnosis)}
                sx={{ 
                  ml: 0.5,
                  color: 'primary.main',
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  '&:hover': {
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }
                }}
              >
                <MedicalInformationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Copy diagnosis">
            <IconButton 
              size="small" 
              onClick={handleCopyDiagnosis}
              sx={{ 
                ml: 0.5,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default DiagnosisCard;