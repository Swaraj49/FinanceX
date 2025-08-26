const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all expenses for user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    
    const filter = { user: req.user._id };
    
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('account', 'name type')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
router.post('/', auth, [
  body('description').trim().isLength({ min: 1 }),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('category').isIn(['food', 'transport', 'entertainment', 'utilities', 'healthcare', 'shopping', 'other']),
  body('account').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify account belongs to user
    const account = await Account.findOne({
      _id: req.body.account,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const expense = new Expense({
      ...req.body,
      user: req.user._id
    });

    await expense.save();
    await expense.populate('account', 'name type');

    // Update account balance
    account.balance -= expense.amount;
    await account.save();

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { user: req.user._id };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const analytics = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalSpent = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      categoryBreakdown: analytics,
      totalSpent: totalSpent[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    ).populate('account', 'name type');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update account balance
    const account = await Account.findById(expense.account);
    if (account) {
      account.balance += expense.amount;
      await account.save();
    }

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;