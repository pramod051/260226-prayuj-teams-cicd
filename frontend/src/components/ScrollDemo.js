import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ScrollContainer from './ScrollContainer';

const ScrollDemo = () => {
  const messages = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    text: `This is message ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    isOwn: i % 3 === 0
  }));

  return (
    <Box sx={{ height: '100vh', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Scroll Demo - Prayuj Teams
      </Typography>
      
      <Paper sx={{ height: '80%', p: 2 }}>
        <ScrollContainer autoScroll={false} showScrollButtons={true}>
          <Box sx={{ p: 2 }}>
            {messages.map((msg) => (
              <Paper
                key={msg.id}
                className={`message-paper ${msg.isOwn ? '' : 'other-message'} fade-in`}
                sx={{
                  p: 2,
                  mb: 1,
                  maxWidth: '70%',
                  ml: msg.isOwn ? 'auto' : 0,
                }}
              >
                <Typography>{msg.text}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                  {new Date().toLocaleTimeString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        </ScrollContainer>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        ✅ Scroll buttons appear when content overflows. Smooth scrolling enabled.
      </Typography>
    </Box>
  );
};

export default ScrollDemo;
