import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProfileDialog = ({ open, onClose }) => {
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  const { user, updateUser } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  React.useEffect(() => {
    if (user) {
      setUsername(user.username || '');
    }
  }, [user]);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/api/user/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      updateUser({
        ...user,
        profilePicture: response.data.profilePicture,
      });

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`${API_URL}/api/user/profile`, {
        username: username.trim(),
      });

      updateUser({
        ...user,
        username: response.data.username,
      });

      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Profile Settings</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 2,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.profilePicture ? `${API_URL}${user.profilePicture}` : undefined}
              sx={{ width: 120, height: 120, fontSize: '3rem' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PhotoCamera />
              )}
            </IconButton>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureUpload}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Click the camera icon to change your profile picture
          </Typography>

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saving}
          />

          <TextField
            fullWidth
            label="Email"
            value={user?.email || ''}
            disabled
            helperText="Email cannot be changed"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveProfile}
          variant="contained"
          disabled={saving || uploading}
        >
          {saving ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog;
