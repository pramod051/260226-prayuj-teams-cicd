# Prayuj Teams - Professional Chat Application
# Adding this line
A modern, professional chat application built with React, Node.js, Socket.IO, and MongoDB. Features real-time messaging, file sharing, group chats, and more.

## 🚀 Features

- **Professional UI**: Clean, modern interface with green branding
- **User Authentication**: Secure registration and login system
- **Real-time Messaging**: Instant message delivery with Socket.IO
- **Private & Group Chats**: Create private conversations or group discussions
- **File Sharing**: Upload and share images, videos, and documents
- **Profile Management**: Customizable user profiles with picture upload
- **Typing Indicators**: See when others are typing
- **Responsive Design**: Works on desktop and mobile devices
- **Audio/Video Call Ready**: UI prepared for call features
- **Notifications**: Toast notifications for important events

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **React 18** with functional components
- **Material-UI (MUI)** for professional styling
- **Socket.IO Client** for real-time features
- **Axios** for API calls
- **React Router** for navigation
- **React Toastify** for notifications

### Infrastructure
- **Docker & Docker Compose** for containerization
- **MongoDB** database
- **Nginx** for frontend serving

## 📦 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Installation & Deployment

1. **Clone and navigate to the project:**
   ```bash
   cd /home/pramod/project/pramod-project/new-chat-appproject
   ```

2. **Deploy with Docker:**
   ```bash
   ./deploy.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Manual Setup (Development)

If you prefer to run without Docker:

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update connection string in backend/.env

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=production
MONGODB_URI=mongodb://admin:password123@mongodb:27017/talkwithteams?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

### Frontend Configuration

Update `frontend/src/context/AuthContext.js` and `frontend/src/context/SocketContext.js` if needed:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## 📱 Usage

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Start Chatting**: Create private chats or group conversations

### Key Features
- **Private Chat**: Click the person icon in sidebar to start a private conversation
- **Group Chat**: Click the plus icon to create a group chat
- **File Sharing**: Use the attachment icon to share files
- **Profile**: Click your avatar to update profile and picture
- **Typing**: See real-time typing indicators
- **Responsive**: Works on all screen sizes

## 🏗 Project Structure

```
talk-with-teams/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── uploads/         # File uploads directory
│   ├── server.js        # Main server file
│   └── Dockerfile       # Backend container config
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context providers
│   │   └── App.js       # Main app component
│   ├── public/          # Static files
│   └── Dockerfile       # Frontend container config
├── docker-compose.yml   # Multi-container setup
├── deploy.sh           # Deployment script
└── README.md           # This file
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: File type and size restrictions
- **CORS Protection**: Configured for secure cross-origin requests

## 🚀 Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Configure domain/SSL** in nginx configuration
3. **Use production MongoDB** instance
4. **Update CORS settings** for your domain

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Remove everything including volumes
docker-compose down -v --rmi all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the logs: `docker-compose logs -f`
- Ensure all ports are available (3000, 5000, 27017)
- Verify Docker and Docker Compose are installed
- Check MongoDB connection and credentials

## 🔮 Future Enhancements

- Audio/Video calling implementation
- Push notifications
- Message encryption
- File preview
- Message search
- User status indicators
- Message reactions
- Dark mode theme
- Mobile app (React Native)

---

**Prayuj Teams** - Professional communication made simple! 💚
