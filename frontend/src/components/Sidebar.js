import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  Add,
  Search,
  Group,
  Person,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Sidebar = ({ selectedRoom, onRoomSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [groupChatDialog, setGroupChatDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const { user } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/all`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createPrivateChat = async (participantId) => {
    try {
      const response = await axios.post(`${API_URL}/api/chat/room/private`, {
        participantId,
      });
      
      const newRoom = response.data;
      setRooms(prev => {
        const exists = prev.find(room => room._id === newRoom._id);
        if (exists) return prev;
        return [newRoom, ...prev];
      });
      
      onRoomSelect(newRoom);
      setNewChatDialog(false);
      toast.success('Private chat created!');
    } catch (error) {
      toast.error('Failed to create private chat');
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter group name and select users');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/chat/room/group`, {
        name: groupName,
        participants: selectedUsers.map(u => u._id),
      });
      
      const newRoom = response.data;
      setRooms(prev => [newRoom, ...prev]);
      onRoomSelect(newRoom);
      setGroupChatDialog(false);
      setGroupName('');
      setSelectedUsers([]);
      toast.success('Group chat created!');
    } catch (error) {
      toast.error('Failed to create group chat');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomDisplayName = (room) => {
    if (room.type === 'group') {
      return room.name;
    }
    const otherUser = room.participants.find(p => p._id !== user.id);
    return otherUser?.username || 'Unknown User';
  };

  const getRoomAvatar = (room) => {
    if (room.type === 'group') {
      return <Group />;
    }
    const otherUser = room.participants.find(p => p._id !== user.id);
    return (
      <Avatar
        src={otherUser?.profilePicture ? `${API_URL}${otherUser.profilePicture}` : undefined}
        sx={{ width: 40, height: 40 }}
      >
        {otherUser?.username?.[0]?.toUpperCase()}
      </Avatar>
    );
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Chats
          </Typography>
          <Box>
            <IconButton onClick={() => setNewChatDialog(true)} size="small">
              <Person />
            </IconButton>
            <IconButton onClick={() => setGroupChatDialog(true)} size="small">
              <Add />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {rooms.map((room) => (
          <ListItem key={room._id} disablePadding>
            <ListItemButton
              selected={selectedRoom?._id === room._id}
              onClick={() => onRoomSelect(room)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemAvatar>
                {getRoomAvatar(room)}
              </ListItemAvatar>
              <ListItemText
                primary={getRoomDisplayName(room)}
                secondary={room.type === 'group' ? `${room.participants.length} members` : 'Private chat'}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* New Private Chat Dialog */}
      <Dialog open={newChatDialog} onClose={() => setNewChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <List>
            {filteredUsers.map((u) => (
              <ListItem key={u._id} disablePadding>
                <ListItemButton onClick={() => createPrivateChat(u._id)}>
                  <ListItemAvatar>
                    <Avatar
                      src={u.profilePicture ? `${API_URL}${u.profilePicture}` : undefined}
                    >
                      {u.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.username}
                    secondary={u.email}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* New Group Chat Dialog */}
      <Dialog open={groupChatDialog} onClose={() => setGroupChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {selectedUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {selectedUsers.map((u) => (
                <Chip
                  key={u._id}
                  label={u.username}
                  onDelete={() => setSelectedUsers(prev => prev.filter(user => user._id !== u._id))}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}

          <TextField
            fullWidth
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <List>
            {filteredUsers
              .filter(u => !selectedUsers.find(su => su._id === u._id))
              .map((u) => (
                <ListItem key={u._id} disablePadding>
                  <ListItemButton onClick={() => setSelectedUsers(prev => [...prev, u])}>
                    <ListItemAvatar>
                      <Avatar
                        src={u.profilePicture ? `${API_URL}${u.profilePicture}` : undefined}
                      >
                        {u.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.username}
                      secondary={u.email}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setGroupChatDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={createGroupChat}>
              Create Group
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default Sidebar;
