import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Send,
  AttachFile,
  VideoCall,
  Call,
  EmojiEmotions,
  Close,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageItem from './MessageItem';
import ScrollContainer from './ScrollContainer';
import { scrollToBottom } from '../utils/scrollUtils';
import { toast } from 'react-toastify';

const ChatWindow = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useAuth();
  const { socket, joinRoom, sendMessage, startTyping, stopTyping } = useSocket();

  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  useEffect(() => {
    if (room && socket) {
      joinRoom(room._id);
      fetchMessages();

      socket.on('receive-message', handleNewMessage);

      socket.on('user-typing', (data) => {
        setTyping(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      });

      socket.on('user-stop-typing', (data) => {
        setTyping(prev => prev.filter(username => username !== data.username));
      });

      return () => {
        socket.off('receive-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
      };
    }
  }, [room, socket, user.id]);

  useEffect(() => {
    // Scroll to bottom when messages first load
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 200);
    }
  }, [room?._id]); // Only when room changes

  const fetchMessages = async () => {
    if (!room) return;
    
    setLoading(true);
    setNewMessageIds(new Set()); // Clear new message highlights when switching rooms
    try {
      const response = await axios.get(`${API_URL}/api/chat/messages/${room._id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderTypingIndicator = () => {
    if (typing.length === 0) return null;
    
    return (
      <div className="typing-indicator">
        <Typography variant="body2" color="text.secondary">
          {typing.length === 1 
            ? `${typing[0]} is typing` 
            : `${typing.slice(0, -1).join(', ')} and ${typing[typing.length - 1]} are typing`
          }
        </Typography>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    );
  };

  // Auto-scroll to bottom when new messages arrive, but only if user is near bottom
  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    
    // Mark message as new if it's from another user
    if (message.sender._id !== user.id) {
      setNewMessageIds(prev => new Set([...prev, message._id]));
      
      // Remove the new message highlight after 3 seconds
      setTimeout(() => {
        setNewMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(message._id);
          return newSet;
        });
      }, 3000);
    }
    
    // Always scroll for user's own messages, check position for others
    if (message.sender._id === user.id) {
      setTimeout(scrollToBottom, 100);
    } else {
      setTimeout(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          if (isNearBottom) {
            scrollToBottom();
          }
        }
      }, 100);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !forwardingMessage) return;

    let messageData = {
      sender: user.id,
      room: room._id,
      messageType: 'text',
    };

    if (forwardingMessage) {
      messageData = {
        ...messageData,
        content: forwardingMessage.content,
        messageType: forwardingMessage.messageType,
        forwardedFrom: forwardingMessage._id,
        fileName: forwardingMessage.fileName,
      };
      setForwardingMessage(null);
    } else {
      messageData.content = newMessage;
      if (replyingTo) {
        messageData.replyTo = replyingTo._id;
        setReplyingTo(null);
      }
    }

    sendMessage(messageData);
    setNewMessage('');
    stopTyping(room._id, user.username);
    
    // Always scroll to bottom when user sends a message
    setTimeout(scrollToBottom, 100);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      startTyping(room._id, user.username);
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(room._id, user.username);
      }, 1000);
    } else {
      stopTyping(room._id, user.username);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/chat/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const messageData = {
        sender: user.id,
        content: response.data.fileUrl,
        room: room._id,
        messageType: file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'file',
        fileName: response.data.fileName,
      };

      sendMessage(messageData);
      toast.success('File uploaded successfully!');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setForwardingMessage(null);
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
    setReplyingTo(null);
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId 
        ? { ...msg, isDeleted: true, content: 'This message was deleted' }
        : msg
    ));
  };

  const getRoomDisplayName = () => {
    if (room.type === 'group') {
      return room.name;
    }
    const otherUser = room.participants.find(p => p._id !== user.id);
    return otherUser?.username || 'Unknown User';
  };

  const getRoomAvatar = () => {
    if (room.type === 'group') {
      return <Avatar sx={{ bgcolor: 'primary.main' }}>G</Avatar>;
    }
    const otherUser = room.participants.find(p => p._id !== user.id);
    return (
      <Avatar
        src={otherUser?.profilePicture ? `${API_URL}${otherUser.profilePicture}` : undefined}
      >
        {otherUser?.username?.[0]?.toUpperCase()}
      </Avatar>
    );
  };

  if (!room) return null;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getRoomAvatar()}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {getRoomDisplayName()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {room.type === 'group' ? `${room.participants.length} members` : 'Private chat'}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <IconButton color="primary">
            <Call />
          </IconButton>
          <IconButton color="primary">
            <VideoCall />
          </IconButton>
        </Box>
      </Box>

      {/* Reply/Forward Info */}
      {(replyingTo || forwardingMessage) && (
        <Alert 
          severity="info" 
          action={
            <IconButton
              size="small"
              onClick={() => {
                setReplyingTo(null);
                setForwardingMessage(null);
              }}
            >
              <Close />
            </IconButton>
          }
        >
          {replyingTo && `Replying to: ${replyingTo.sender.username} - ${replyingTo.content}`}
          {forwardingMessage && `Forwarding message from: ${forwardingMessage.sender.username}`}
        </Alert>
      )}

      {/* Messages Area */}
      <ScrollContainer 
        autoScroll={true}
        showScrollButtons={true}
        sx={{ flex: 1, minHeight: 0 }}
      >
        <List>
          {messages.map((message) => (
            <MessageItem
              key={message._id}
              message={message}
              isOwn={message.sender._id === user.id}
              isNew={newMessageIds.has(message._id)}
              onReply={handleReply}
              onForward={handleForward}
              onDelete={handleDeleteMessage}
            />
          ))}
        </List>
        
        {typing.length > 0 && (
          <div className="typing-indicator">
            <Typography variant="body2" color="text.secondary">
              {typing.length === 1 
                ? `${typing[0]} is typing` 
                : `${typing.slice(0, -1).join(', ')} and ${typing[typing.length - 1]} are typing`
              }
            </Typography>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </ScrollContainer>

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          color="primary"
        >
          <AttachFile />
        </IconButton>

        <TextField
          fullWidth
          placeholder={forwardingMessage ? "Add a message..." : "Type a message..."}
          value={newMessage}
          onChange={handleTyping}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton color="primary">
                  <EmojiEmotions />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <IconButton
          type="submit"
          color="primary"
          disabled={!newMessage.trim() && !forwardingMessage}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
