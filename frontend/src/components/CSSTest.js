import React from 'react';
import { Box, Typography, Button, Paper, Avatar } from '@mui/material';

const CSSTest = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Prayuj Teams CSS Test
      </Typography>
      
      {/* Test enhanced buttons */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Enhanced Buttons</Typography>
        <Button variant="contained" color="primary" sx={{ mr: 2 }}>
          Primary Button
        </Button>
        <Button variant="outlined" color="primary">
          Outlined Button
        </Button>
      </Box>

      {/* Test message bubbles */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Message Bubbles</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Paper className="message-paper fade-in" sx={{ p: 2, maxWidth: '70%', ml: 'auto' }}>
            <Typography>This is my message with enhanced styling!</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
              2:30 PM
            </Typography>
          </Paper>
          <Paper className="message-paper other-message fade-in" sx={{ p: 2, maxWidth: '70%' }}>
            <Typography>This is a received message with different styling!</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
              2:31 PM
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Test typing indicator */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Typing Indicator</Typography>
        <div className="typing-indicator">
          <Typography variant="body2" color="text.secondary">
            John is typing
          </Typography>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </Box>

      {/* Test avatars */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Enhanced Avatars</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar>JD</Avatar>
          <Avatar>SM</Avatar>
          <Avatar>TT</Avatar>
        </Box>
      </Box>

      {/* Test file upload area */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>File Upload Area</Typography>
        <div className="file-upload-area">
          <Typography>Drag and drop files here or click to browse</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Supports images, videos, and documents
          </Typography>
        </div>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
        ✅ If you can see enhanced styling, gradients, and animations, the CSS is working correctly!
      </Typography>
    </Box>
  );
};

export default CSSTest;
