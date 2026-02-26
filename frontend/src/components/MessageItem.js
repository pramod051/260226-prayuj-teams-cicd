import React, { useState } from 'react';
import {
  ListItem,
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Reply,
  Forward,
  Delete,
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';

const MessageItem = ({ message, isOwn, isNew, onReply, onForward, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    onReply(message);
    handleMenuClose();
  };

  const handleForward = () => {
    onForward(message);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/chat/message/${message._id}`);
      onDelete(message._id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
    handleMenuClose();
  };

  const handleDownload = async () => {
    try {
      const filename = message.content.split('/').pop();
      const response = await axios.get(`${API_URL}/api/chat/download/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', message.fileName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded');
    } catch (error) {
      toast.error('Download failed');
    }
    handleMenuClose();
  };

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return (
        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
          This message was deleted
        </Typography>
      );
    }

    switch (message.messageType) {
      case 'image':
        return (
          <Box>
            <img
              src={`${API_URL}${message.content}`}
              alt="Shared content"
              style={{
                maxWidth: '300px',
                maxHeight: '200px',
                borderRadius: '8px',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
              onClick={() => window.open(`${API_URL}${message.content}`, '_blank')}
            />
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{ color: isOwn ? 'inherit' : 'primary.main' }}
              >
                Download
              </Button>
            </Box>
          </Box>
        );
      case 'video':
        return (
          <Box>
            <video
              src={`${API_URL}${message.content}`}
              controls
              style={{
                maxWidth: '300px',
                maxHeight: '200px',
                borderRadius: '8px',
              }}
            />
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{ color: isOwn ? 'inherit' : 'primary.main' }}
              >
                Download
              </Button>
            </Box>
          </Box>
        );
      case 'file':
        return (
          <Box>
            <Button
              startIcon={<Download />}
              onClick={handleDownload}
              sx={{ color: isOwn ? 'inherit' : 'primary.main' }}
            >
              📎 {message.fileName || 'File attachment'}
            </Button>
          </Box>
        );
      default:
        return (
          <Typography variant="body1">
            {message.content}
          </Typography>
        );
    }
  };

  const renderReplyInfo = () => {
    if (!message.replyTo) return null;
    
    return (
      <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1, borderLeft: '3px solid', borderColor: 'primary.main' }}>
        <Typography variant="caption" color="primary">
          Replying to {message.replyTo.sender?.username}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {message.replyTo.isDeleted ? 'This message was deleted' : message.replyTo.content}
        </Typography>
      </Box>
    );
  };

  const renderForwardInfo = () => {
    if (!message.forwardedFrom) return null;
    
    return (
      <Box sx={{ mb: 1 }}>
        <Chip 
          label={`Forwarded from ${message.forwardedFrom.sender?.username}`} 
          size="small" 
          variant="outlined"
        />
      </Box>
    );
  };

  return (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        py: 0.5,
        px: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '70%',
        }}
      >
        {!isOwn && (
          <Avatar
            src={message.sender.profilePicture ? `${API_URL}${message.sender.profilePicture}` : undefined}
            sx={{ width: 32, height: 32 }}
          >
            {message.sender.username[0].toUpperCase()}
          </Avatar>
        )}
        
        <Box>
          {!isOwn && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, mb: 0.5, display: 'block' }}
            >
              {message.sender.username}
            </Typography>
          )}
          
          <Paper
            elevation={1}
            className={`message-paper ${isOwn ? '' : 'other-message'} fade-in ${isNew ? 'new-message' : ''}`}
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderTopLeftRadius: !isOwn ? 0 : 2,
              borderTopRightRadius: isOwn ? 0 : 2,
              position: 'relative',
              ...(isNew && {
                backgroundColor: isOwn ? '#fff3e0' : '#e8f5e8',
                border: '2px solid',
                borderColor: isOwn ? '#4caf50' : '#4caf50',
                animation: 'highlight-fade 3s ease-out forwards',
              }),
            }}
          >
            {renderForwardInfo()}
            {renderReplyInfo()}
            {renderMessageContent()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.7,
                }}
              >
                {formatTime(message.timestamp)}
              </Typography>
              
              {!message.isDeleted && (
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ 
                    ml: 1, 
                    color: isOwn ? 'inherit' : 'text.secondary',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <Reply sx={{ mr: 1 }} fontSize="small" />
          Reply
        </MenuItem>
        <MenuItem onClick={handleForward}>
          <Forward sx={{ mr: 1 }} fontSize="small" />
          Forward
        </MenuItem>
        {isOwn && (
          <MenuItem onClick={handleDelete}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>
    </ListItem>
  );
};

export default MessageItem;
