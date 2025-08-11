import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Paper, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ChatWindow from './components/ChatWindow';
import HistorySidebar from './components/HistorySidebar';
import './App.css';

function App() {
  const [conversationId, setConversationId] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme-mode');
    return savedMode || 'dark'; // Default to dark mode
  });

  // Toggle dark/light mode
  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  // Create theme with dynamic mode and new purple color scheme
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        light: mode === 'dark' ? '#9c64fe' : '#8e6be6',
        main: '#6a42c1', // Purple main color
        dark: mode === 'dark' ? '#4f2c9e' : '#5632a8',
        contrastText: '#ffffff',
      },
      secondary: {
        light: '#4f83cc',
        main: '#2c5494', // Deep blue secondary
        dark: '#1c3966',
      },
      background: {
        default: mode === 'light' ? '#f8f8f8' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#f0f0f0',
        secondary: mode === 'light' ? '#5f5f5f' : '#aaaaaa',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)',
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            background: mode === 'dark' 
              ? 'linear-gradient(45deg, #6a42c1 30%, #8e64fe 90%)' 
              : 'linear-gradient(45deg, #5c35b5 30%, #7e55e2 90%)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 0.2s, background-color 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
    },
  });

  // Initialize a new conversation or load existing one
  useEffect(() => {
    const storedConversationId = localStorage.getItem('conversationId');
    if (storedConversationId) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/history/${storedConversationId}`)
        .then(r => {
          if (r.status === 404) {
            console.warn('[App] Stored conversationId no longer exists, clearing.');
            localStorage.removeItem('conversationId');
          } else {
            setConversationId(storedConversationId);
            setSelectedConversationId(storedConversationId);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" elevation={0} sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: mode === 'dark' ? '#151515' : '#ffffff',
        }}>
          <Toolbar sx={{ minHeight: 64 }}>
            <MedicalServicesIcon sx={{ 
              mr: 1.5, 
              color: 'primary.main',
              filter: mode === 'dark' ? 'drop-shadow(0 0 2px rgba(156, 100, 254, 0.3))' : 'none'
            }} />
            <Typography variant="h5" component="div" sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              letterSpacing: '-0.02em',
              background: mode === 'dark' 
                ? 'linear-gradient(45deg, #9c64fe 30%, #6a42c1 90%)' 
                : 'none',
              color: mode === 'light' ? '#6a42c1' : 'inherit',
              WebkitBackgroundClip: mode === 'dark' ? 'text' : 'unset',
              WebkitTextFillColor: mode === 'dark' ? 'transparent' : 'unset',
            }}>
              Clinical Pilot
            </Typography>
            
            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton onClick={toggleColorMode} sx={{ 
                ml: 1, 
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                }
              }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* History Sidebar */}
          <HistorySidebar
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
            setConversationId={setConversationId}
          />

          {/* Main Chat Area */}
          <Box sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}>
            <Paper 
              elevation={mode === 'dark' ? 0 : 2} 
              sx={{ 
                borderRadius: 3, 
                height: '100%', 
                overflow: 'hidden',
                border: mode === 'dark' ? 1 : 0,
                borderColor: 'divider',
                backgroundImage: mode === 'dark' 
                  ? 'linear-gradient(rgba(106, 66, 193, 0.02), rgba(0, 0, 0, 0))' 
                  : 'none',
              }}
            >
              <ChatWindow 
                conversationId={conversationId} 
                setConversationId={setConversationId} 
                colorMode={mode}
              />
            </Paper>
          </Box>
        </Box>

        <Box sx={{ 
          p: 1.5, 
          textAlign: 'center', 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: mode === 'dark' ? '#151515' : '#fafafa',
        }}>
          <Typography variant="caption" color="text.secondary">
            Disclaimer: This system is intended for educational purposes only and should not be used for diagnostic decisions.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
