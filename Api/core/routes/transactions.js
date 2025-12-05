import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

// @route   POST /api/transactions/buy
// @desc    Buy asset tokens (record transaction)
// @access  Public
router.post('/buy', async (req, res) => {
  try {
    const { userId, assetId, quantity, pricePerToken } = req.body;

    if (!userId || !assetId || !quantity || !pricePerToken) {
      return res.status(400).json({
        success: false,
        message: 'userId, assetId, quantity, and pricePerToken are required'
      });
    }

    // Verify user and asset exist
    const [user, asset] = await Promise.all([
      User.findById(userId),
      Asset.findById(assetId)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const totalAmount = quantity * pricePerToken;

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      assetId,
      assetName: asset.title,
      assetSymbol: asset.hedera?.tokenId || 'N/A',
      type: 'buy',
      quantity,
      pricePerToken,
      totalAmount,
      status: 'completed'
    });

    // Update or create portfolio allocation
    let portfolio = await Portfolio.findOne({ userAccountId: user.accountId });
    
    if (!portfolio) {
      portfolio = await Portfolio.create({
        userAccountId: user.accountId,
        allocations: [{ assetId, percent: 100 }]
      });
    } else {
      const existingAllocation = portfolio.allocations.find(
        a => a.assetId.toString() === assetId.toString()
      );
      
      if (!existingAllocation) {
        portfolio.allocations.push({ assetId, percent: 0 }); // Percent to be calculated separately
        await portfolio.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Buy transaction recorded',
      data: {
        transaction,
        portfolio
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: error.message
    });
  }
});

// @route   POST /api/transactions/sell
// @desc    Sell asset tokens (record transaction)
// @access  Public
router.post('/sell', async (req, res) => {
  try {
    const { userId, assetId, quantity, pricePerToken } = req.body;

    if (!userId || !assetId || !quantity || !pricePerToken) {
      return res.status(400).json({
        success: false,
        message: 'userId, assetId, quantity, and pricePerToken are required'
      });
    }

    // Verify user and asset exist
    const [user, asset] = await Promise.all([
      User.findById(userId),
      Asset.findById(assetId)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const totalAmount = quantity * pricePerToken;

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      assetId,
      assetName: asset.title,
      assetSymbol: asset.hedera?.tokenId || 'N/A',
      type: 'sell',
      quantity,
      pricePerToken,
      totalAmount,
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      message: 'Sell transaction recorded',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/user/:userId
// @desc    Get user transactions
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .populate('assetId', 'title description valuation')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'accountId country')
      .populate('assetId', 'title description valuation');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

export default router;
