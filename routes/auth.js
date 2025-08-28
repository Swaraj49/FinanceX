const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    console.log('🚀 Registration attempt:', { 
      name: req.body.name, 
      email: req.body.email,
      passwordLength: req.body.password?.length 
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    
    console.log('🔍 Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('👤 Creating new user...');
    const user = new User({ name, email, password });
    await user.save();
    console.log('✅ User created successfully:', user._id);

    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated successfully');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    console.log('✅ Registration completed successfully for:', email);
  } catch (error) {
    console.error('❌ Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Test endpoint to check if API is working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({ 
    message: 'Auth API is working',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI
    }
  });
});

// Simple registration test endpoint
router.post('/test-register', async (req, res) => {
  try {
    console.log('🧪 Test registration attempt');
    console.log('📝 Request body:', req.body);
    
    // Test MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    // Test basic user creation without validation
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    console.log('🔍 Testing user creation...');
    const user = new User(testUser);
    
    console.log('💾 Attempting to save user...');
    await user.save();
    
    console.log('✅ Test user created successfully');
    
    // Clean up test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('🧹 Test user cleaned up');
    
    res.json({ 
      success: true, 
      message: 'Registration test passed',
      mongodb: 'working',
      userModel: 'working'
    });
    
  } catch (error) {
    console.error('❌ Test registration failed:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
});

module.exports = router;