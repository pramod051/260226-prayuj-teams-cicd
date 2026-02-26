const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get messages for a room
router.get('/messages/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .populate({
        path: 'forwardedFrom',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get private room
router.post('/room/private', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    // Check if room already exists
    let room = await Room.findOne({
      type: 'private',
      participants: { $all: [userId, participantId], $size: 2 }
    }).populate('participants', 'username profilePicture');

    if (!room) {
      room = new Room({
        name: 'Private Chat',
        type: 'private',
        participants: [userId, participantId],
        createdBy: userId
      });
      await room.save();
      await room.populate('participants', 'username profilePicture');
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group room
router.post('/room/group', auth, async (req, res) => {
  try {
    const { name, description, participants } = req.body;
    const userId = req.user._id;

    const room = new Room({
      name,
      description,
      type: 'group',
      participants: [userId, ...participants],
      admin: userId,
      createdBy: userId
    });

    await room.save();
    await room.populate('participants', 'username profilePicture');

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      participants: userId
    })
    .populate('participants', 'username profilePicture')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      fileUrl, 
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Search users
router.get('/users/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('username email profilePicture').limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download file
router.get('/download/:filename', auth, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Download failed' });
  }
});

module.exports = router;
