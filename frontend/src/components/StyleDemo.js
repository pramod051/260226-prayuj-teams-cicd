import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const StyleDemo = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Prayuj Teams Style Demo
      </Typography>
      
      {/* Message bubbles demo */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Message Bubbles</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 400 }}>
          <div className="message-bubble own">
            <div>Hey there! How are you doing?</div>
            <div className="message-time">2:30 PM</div>
          </div>
          <div className="message-bubble other">
            <div>I'm doing great! Thanks for asking.</div>
            <div className="message-time">2:31 PM</div>
          </div>
        </Box>
      </Box>

      {/* Typing indicator demo */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Typing Indicator</Typography>
        <div className="typing-indicator">
          <span>John is typing</span>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </Box>

      {/* File upload area demo */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>File Upload Area</Typography>
        <div className="file-upload-area">
          <Typography>Drag and drop files here or click to browse</Typography>
        </div>
      </Box>

      {/* Chat list item demo */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Chat List Items</Typography>
        <Paper sx={{ maxWidth: 300 }}>
          <div className="chat-list-item active">
            <div className="chat-avatar">JD</div>
            <div className="chat-info">
              <div className="chat-name">John Doe</div>
              <div className="chat-preview">Hey, how's it going?</div>
            </div>
          </div>
          <div className="chat-list-item green-hover">
            <div className="chat-avatar">SM</div>
            <div className="chat-info">
              <div className="chat-name">Sarah Miller</div>
              <div className="chat-preview">See you tomorrow!</div>
            </div>
          </div>
        </Paper>
      </Box>
    </Box>
  );
};

export default StyleDemo;
