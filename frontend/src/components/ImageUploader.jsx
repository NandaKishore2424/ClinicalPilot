import React, { useState } from 'react';
import { Box, IconButton, Badge, Tooltip, CircularProgress, Modal } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CancelIcon from '@mui/icons-material/Cancel';

const ImageUploader = ({ setImage, setImagePreview, imagePreview }) => {
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const handleImageClick = () => {
    if (imagePreview) {
      setPreviewOpen(true);
    } else {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setImagePreview(null);
    fileInputRef.current.value = '';
  };
  
  return (
    <>
      <Box className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          data-testid="image-upload-input"
        />
        
        {uploading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : imagePreview ? (
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            badgeContent={
              <IconButton 
                size="small" 
                onClick={handleRemoveImage}
                sx={{ 
                  bgcolor: 'background.paper',
                  width: 22,
                  height: 22,
                  boxShadow: 1,
                  '&:hover': { bgcolor: '#e0e0e0' }
                }}
              >
                <CancelIcon fontSize="small" color="error" />
              </IconButton>
            }
            sx={{ mr: 2 }}
          >
            <Tooltip title="View image">
              <Box 
                component="img"
                src={imagePreview}
                alt="Upload preview"
                onClick={handleImageClick}
                sx={{ 
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
            </Tooltip>
          </Badge>
        ) : (
          <Tooltip title="Attach image">
            <IconButton 
              onClick={handleImageClick}
              color="primary"
              sx={{ 
                mr: 2,
                border: '1px dashed', 
                borderColor: 'primary.main',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)'
                }
              }}
              aria-label="upload image"
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        aria-labelledby="image-preview-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box 
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 24,
            '&:focus': {
              outline: 'none'
            }
          }}
        >
          <Box
            component="img"
            src={imagePreview}
            alt="Full size preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              backgroundColor: 'background.paper',
              borderRadius: 2,
            }}
            onClick={() => setPreviewOpen(false)}
          />
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <CancelIcon />
          </IconButton>
        </Box>
      </Modal>
    </>
  );
};

export default ImageUploader;