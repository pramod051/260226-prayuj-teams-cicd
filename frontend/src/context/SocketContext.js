import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { user } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Show browser notification
  const showNotification = (title, options = {}) => {
    if (notificationPermission === 'granted' && document.hidden) {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  };

  useEffect(() => {
    if (user) {
      const newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Listen for new messages and show notifications
      newSocket.on('new-message', (messageData) => {
        if (messageData.sender._id !== user.id) {
          showNotification(`New message from ${messageData.sender.username}`, {
            body: messageData.content,
            tag: `message-${messageData._id}`
          });
        }
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user, API_URL, notificationPermission]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send-message', messageData);
    }
  };

  const startTyping = (roomId, username) => {
    if (socket) {
      socket.emit('typing', { room: roomId, username });
    }
  };

  const stopTyping = (roomId, username) => {
    if (socket) {
      socket.emit('stop-typing', { room: roomId, username });
    }
  };

  const value = {
    socket,
    onlineUsers,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    notificationPermission,
    showNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
