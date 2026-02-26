import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const NotificationManager = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleNewMessage = (message) => {
      // Don't show notification for own messages
      if (message.sender._id === user.id) return;

      // Show toast notification
      toast.info(`${message.sender.username}: ${
        message.messageType === 'text' 
          ? message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content
          : `Sent a ${message.messageType}`
      }`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Prayuj Teams - ${message.sender.username}`, {
          body: message.messageType === 'text' 
            ? message.content 
            : `Sent a ${message.messageType}`,
          icon: '/favicon.ico',
          tag: 'mw-teams-message',
          requireInteraction: false,
        });

        // Auto close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };

    socket.on('receive-message', handleNewMessage);

    return () => {
      socket.off('receive-message', handleNewMessage);
    };
  }, [socket, user]);

  return null; // This component doesn't render anything
};

export default NotificationManager;
