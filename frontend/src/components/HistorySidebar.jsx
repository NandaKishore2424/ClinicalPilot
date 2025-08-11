import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography, 
  Divider, 
  IconButton, 
  Drawer, 
  useTheme, 
  useMediaQuery,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  Avatar
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getAllConversations, renameConversation, deleteConversation } from '../services/api';
import { format } from 'date-fns';

const drawerWidth = 280;

const HistorySidebar = ({ 
  selectedConversationId, 
  setSelectedConversationId, 
  setConversationId 
}) => {
  const [open, setOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // On mobile, drawer is closed by default
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getAllConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Refresh conversations every 30 seconds
    const intervalId = setInterval(fetchConversations, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle conversation selection
  const handleConversationClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    setConversationId(conversationId);
    localStorage.setItem('conversationId', conversationId);
    
    // On mobile, close the drawer after selection
    if (isMobile) {
      setOpen(false);
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setConversationId(null);
    localStorage.removeItem('conversationId');
    
    // On mobile, close the drawer
    if (isMobile) {
      setOpen(false);
    }
  };

  // Handle opening the context menu
  const handleMenuOpen = (event, conversation) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveConversation(conversation);
  };

  // Handle closing the context menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle edit conversation dialog
  const handleEditClick = () => {
    handleMenuClose();
    setNewTitle(activeConversation.title || activeConversation.preview);
    setEditDialogOpen(true);
  };

  // Handle delete conversation dialog
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await renameConversation(activeConversation.id, newTitle);
      await fetchConversations();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error renaming conversation:', error);
      // Optional: Show error toast/notification
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteConversation(activeConversation.id);
      
      if (selectedConversationId === activeConversation.id) {
        setSelectedConversationId(null);
        setConversationId(null);
        localStorage.removeItem('conversationId');
      }
      
      await fetchConversations();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Optional: Show error toast/notification
    } finally {
      setLoading(false);
    }
  };

  // Format conversation preview
  const formatPreview = (text) => {
    return text.length > 36 ? text.substring(0, 36) + '...' : text;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch (e) {
      return '';
    }
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Generate avatar text from conversation preview
  const getAvatarText = (text) => {
    if (!text) return "C";
    const words = text.split(' ');
    if (words.length === 1) {
      return text.substring(0, 1).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <>
      {/* Toggle button that's always visible */}
      <IconButton
        color="primary"
        onClick={toggleDrawer}
        sx={{
          position: 'fixed',
          left: open ? drawerWidth - 22 : 16,
          top: 80,
          zIndex: 1200,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(106, 66, 193, 0.12)' : 'rgba(106, 66, 193, 0.06)',
          backdropFilter: 'blur(8px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 0 10px rgba(156, 100, 254, 0.15)' 
            : '0 2px 8px rgba(106, 66, 193, 0.15)',
          height: 38,
          width: 38,
          transition: theme.transitions.create(['left', 'transform', 'background-color'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(106, 66, 193, 0.18)' : 'rgba(106, 66, 193, 0.12)',
            transform: 'scale(1.08)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          }
        }}
      >
        {open 
          ? <ChevronLeftIcon sx={{ 
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateX(-2px)' }
            }} /> 
          : <ChevronRightIcon sx={{ 
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateX(2px)' }
            }} />
        }
      </IconButton>

      {/* Drawer for chat history */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: 64, // Leave space for AppBar
            height: 'calc(100% - 64px)',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'dark' ? '#141414' : '#ffffff',
            backgroundImage: theme => theme.palette.mode === 'dark' 
              ? 'linear-gradient(rgba(106, 66, 193, 0.03), rgba(0, 0, 0, 0))' 
              : 'none',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ 
              mr: 1.5, 
              color: theme.palette.primary.main,
              filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px rgba(156, 100, 254, 0.2))' : 'none'
            }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ 
              letterSpacing: '-0.02em',
              color: theme.palette.mode === 'dark' ? '#f0f0f0' : '#333333',
            }}>
              Conversations
            </Typography>
          </Box>
          <Tooltip title="New conversation">
            <IconButton 
              color="primary" 
              onClick={handleNewConversation}
              sx={{
                bgcolor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(106, 66, 193, 0.08)' 
                  : 'rgba(106, 66, 193, 0.05)',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(106, 66, 193, 0.15)' 
                    : 'rgba(106, 66, 193, 0.1)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <AddIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider />
        
        {loading && <Box sx={{ p: 2 }}>Loading...</Box>}
        
        <List sx={{ overflow: 'auto', py: 0 }}>
          {conversations.map((conversation) => (
            <ListItem 
              key={conversation.id} 
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={(e) => handleMenuOpen(e, conversation)}
                  size="small"
                  sx={{ 
                    opacity: 0.7, 
                    '&:hover': { 
                      opacity: 1,
                      bgcolor: theme => theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.03)',
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemButton 
                selected={selectedConversationId === conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                sx={{ 
                  borderLeft: selectedConversationId === conversation.id 
                    ? `3px solid ${theme.palette.primary.main}` 
                    : '3px solid transparent',
                  pr: 7, // Make room for the menu button
                  py: 1.5,
                  transition: 'all 0.2s ease',
                  background: selectedConversationId === conversation.id 
                    ? theme => theme.palette.mode === 'dark' 
                      ? 'rgba(106, 66, 193, 0.08)' 
                      : 'rgba(106, 66, 193, 0.05)'
                    : 'transparent',
                  '&:hover': {
                    background: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(106, 66, 193, 0.05)' 
                      : 'rgba(106, 66, 193, 0.03)',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: selectedConversationId === conversation.id 
                      ? 'primary.main' 
                      : theme.palette.mode === 'dark' 
                        ? 'rgba(156, 100, 254, 0.1)' 
                        : 'rgba(106, 66, 193, 0.08)',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    mr: 1.5,
                    border: selectedConversationId === conversation.id 
                      ? '1px solid rgba(156, 100, 254, 0.3)' 
                      : 'none',
                    boxShadow: selectedConversationId === conversation.id 
                      ? theme.palette.mode === 'dark' 
                        ? '0 0 6px rgba(156, 100, 254, 0.3)' 
                        : 'none'
                      : 'none',
                  }}
                >
                  {getAvatarText(conversation.preview)}
                </Avatar>
                
                <ListItemText 
                  primary={conversation.title || formatPreview(conversation.preview)}
                  secondary={formatDate(conversation.updatedAt)}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: { 
                      fontWeight: selectedConversationId === conversation.id ? 'bold' : 'normal'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { 
              minWidth: 180,
              border: theme => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1c1c1c' : '#ffffff',
              backdropFilter: 'blur(8px)',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0,0,0,0.4)' 
                : '0 4px 20px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                py: 1.2,
                px: 2,
                mx: 0.5,
                my: 0.3,
                borderRadius: 1,
                transition: 'background-color 0.2s',
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleEditClick} sx={{
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.03)',
            }
          }}>
            <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
            Rename
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ 
            color: 'error.main',
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255,82,82,0.1)' 
                : 'rgba(255,82,82,0.05)',
            }
          }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
            Delete
          </MenuItem>
        </Menu>
        
        {/* Edit Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
              backgroundImage: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(rgba(106, 66, 193, 0.03), rgba(0, 0, 0, 0))' 
                : 'none',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)' 
                : '0 8px 32px rgba(0,0,0,0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1, 
            color: theme => theme.palette.mode === 'dark' ? '#f0f0f0' : '#333333',
          }}>
            Rename Conversation
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
              Enter a new name for this conversation:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setEditDialogOpen(false)}
              sx={{ 
                color: theme => theme.palette.mode === 'dark' ? '#aaaaaa' : '#666666',
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained" 
              color="primary"
              sx={{
                boxShadow: 'none',
                px: 3,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(106, 66, 193, 0.3)',
                }
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)' 
                : '0 8px 32px rgba(0,0,0,0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1, 
            color: theme => theme.palette.mode === 'dark' ? '#f0f0f0' : '#333333',
          }}>
            Delete Conversation
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ 
                color: theme => theme.palette.mode === 'dark' ? '#aaaaaa' : '#666666',
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained" 
              color="error"
              sx={{
                boxShadow: 'none',
                px: 3,
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Drawer>
    </>
  );
};

export default HistorySidebar;