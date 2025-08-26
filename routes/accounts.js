const express = require('express');
const { body, validationResult } = require('express-validator');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all accounts for user
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Fetching vaults for user:', req.user._id);
    const accounts = await Account.find({ user: req.user._id });
    console.log('📊 Found', accounts.length, 'vaults');
    res.json(accounts);
  } catch (error) {
    console.error('❌ Error fetching vaults:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create account
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }),
  body('type').isIn(['checking', 'savings', 'credit', 'cash']),
  body('balance').optional().isNumeric()
], async (req, res) => {
  try {
    console.log('🔐 Creating vault for user:', req.user._id);
    console.log('📝 Vault data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const account = new Account({
      ...req.body,
      user: req.user._id
    });

    await account.save();
    console.log('✅ Vault created successfully:', account._id);
    res.status(201).json(account);
  } catch (error) {
    console.error('❌ Error creating vault:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update account
router.put('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;