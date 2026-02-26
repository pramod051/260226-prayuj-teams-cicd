import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ProfileDialog from '../components/ProfileDialog';
import NotificationManager from '../components/NotificationManager';

const Chat = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setProfileDialogOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <NotificationManager />
      <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            Prayuj Teams
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.username}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar
                src={user?.profilePicture ? `${window.location.protocol}//${window.location.hostname}:5000${user.profilePicture}` : undefined}
                sx={{ width: 32, height: 32 }}
              >
                {!user?.profilePicture && <AccountCircle />}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleProfileClick}>
                <Settings sx={{ mr: 1 }} />
                Profile Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'auto' }}>
        <Grid container sx={{ height: '100%' }}>
          <Grid item xs={12} md={4} lg={3}>
            <Sidebar
              selectedRoom={selectedRoom}
              onRoomSelect={setSelectedRoom}
            />
          </Grid>
          <Grid item xs={12} md={8} lg={9}>
            {selectedRoom ? (
              <ChatWindow room={selectedRoom} />
            ) : (
              <Paper
                sx={{
                  height: '100%',
		  overflowY: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'background.default',
                }}
              >
                <Box textAlign="center">
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    Welcome to Prayuj Teams
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Select a chat to start messaging
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </Box>
  );
};

export default Chat;
