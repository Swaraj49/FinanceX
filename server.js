const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const accountRoutes = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/accounts', accountRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Financial Noting API' });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MongoDB connection
console.log('🔗 Attempting MongoDB connection...');
console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financial-noting')
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database name:', mongoose.connection.name);
    console.log('🌐 Connection state:', mongoose.connection.readyState);
    
    // Fix: Drop the problematic username index
    try {
      const User = require('./models/User');
      
      // Try to drop the username index
      await User.collection.dropIndex('username_1');
      console.log('🗑️ Dropped problematic username index');
      
      // Also clean up any users with null username
      const result = await User.deleteMany({ username: null });
      console.log(`🧹 Cleaned up ${result.deletedCount} users with null username`);
      
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Username index not found (already dropped or never existed)');
      } else {
        console.log('⚠️ Could not drop username index:', error.message);
      }
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
  });

// MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;