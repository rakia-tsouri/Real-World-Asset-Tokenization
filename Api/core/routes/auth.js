import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user with Hedera account
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { accountId, hederaPublicKey, country } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Hedera accountId is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ accountId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this Hedera account'
      });
    }

    // Create user
    const newUser = await User.create({
      accountId,
      hederaPublicKey,
      country,
      kycStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          accountId: newUser.accountId,
          country: newUser.country,
          kycStatus: newUser.kycStatus
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   GET /api/auth/user/:accountId
// @desc    Get user by Hedera accountId
// @access  Public
router.get('/user/:accountId', async (req, res) => {
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
      data: {
        id: user._id,
        accountId: user.accountId,
        hederaPublicKey: user.hederaPublicKey,
        country: user.country,
        kycStatus: user.kycStatus,
        kycApprovedAt: user.kycApprovedAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

export default router;
