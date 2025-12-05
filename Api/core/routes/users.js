import express from 'express';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Asset from '../models/Asset.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/portfolio
// @desc    Get current user portfolio
// @access  Private
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    // Get user's assets
    const myAssets = await Asset.find({ ownerId: req.user.userId })
      .select('title category valuation listingPrice isListed tokenId createdAt verificationStatus');

    // Calculate portfolio stats
    const totalValue = myAssets.reduce((sum, asset) => sum + (asset.listingPrice || asset.valuation || 0), 0);
    const listedAssets = myAssets.filter(a => a.isListed).length;
    const approvedAssets = myAssets.filter(a => a.verificationStatus === 'approved').length;

    res.json({
      success: true,
      data: {
        assets: myAssets,
        stats: {
          totalAssets: myAssets.length,
          totalValue,
          listedAssets,
          approvedAssets
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error: error.message
    });
  }
});

// @route   GET /api/users/:accountId
// @desc    Get user profile by accountId
// @access  Public
router.get('/:accountId', async (req, res) => {
  try {
    const user = await User.findOne({ accountId: req.params.accountId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// @route   GET /api/users/:accountId/portfolio
// @desc    Get user portfolio
// @access  Public
router.get('/:accountId/portfolio', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userAccountId: req.params.accountId })
      .populate('allocations.assetId');

    if (!portfolio) {
      return res.json({
        success: true,
        data: {
          userAccountId: req.params.accountId,
          allocations: [],
          createdAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:accountId/kyc
// @desc    Update user KYC status
// @access  Private (Admin only)
router.put('/:accountId/kyc', async (req, res) => {
  try {
    const { kycStatus } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(kycStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KYC status'
      });
    }

    const user = await User.findOne({ accountId: req.params.accountId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.kycStatus = kycStatus;
    if (kycStatus === 'approved') {
      user.kycApprovedAt = new Date();
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'KYC status updated',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update KYC status',
      error: error.message
    });
  }
});

export default router;
