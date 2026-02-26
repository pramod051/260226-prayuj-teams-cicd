require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsCAFile: "./rds-combined-ca-bundle.pem",
  retryWrites: false,
});
// require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI 
  || 'mongodb://localhost:27017/chatdb';

const isDocumentDB = MONGODB_URI.includes('docdb.amazonaws.com');

// Build connection options
const getConnectionOptions = () => {
  const baseOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  if (isDocumentDB) {
    console.log('🔗 Connecting to AWS DocumentDB...');
    
    // Check if certificate exists
    const certPath = path.join(__dirname, 'rds-combined-ca-bundle.pem');
    const certExists = fs.existsSync(certPath);
    
    if (!certExists) {
      console.warn('⚠️  Certificate not found, SSL validation disabled');
    }

    return {
      ...baseOptions,
      ssl: true,                    // ✅ Required for DocumentDB
      sslValidate: certExists,
      sslCA: certExists ? fs.readFileSync(certPath) : undefined,
      retryWrites: false,           // ✅ DocumentDB doesn't support this
      directConnection: false,
    };
  }

  console.log('🔗 Connecting to local MongoDB...');
  return baseOptions;
};

// Connect with retry logic
const connectWithRetry = (retries = 5, delay = 5000) => {
  mongoose.connect(MONGODB_URI, getConnectionOptions())
    .then(() => {
      console.log('✓ Connected to database successfully');
      console.log(`  Type: ${isDocumentDB ? 'AWS DocumentDB' : 'MongoDB'}`);
    })
    .catch(err => {
      console.error(`✗ Database connection failed: ${err.message}`);
      if (retries > 0) {
        console.log(`  Retrying in ${delay / 1000}s... (${retries} left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      }
    });
};

// Event listeners
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ Mongoose error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
});

// Start connection
connectWithRetry();
