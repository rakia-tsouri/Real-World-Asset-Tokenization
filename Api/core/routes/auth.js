import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      country,
      kycStatus: 'not_submitted',
      role: 'user'
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please complete your KYC verification.',
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          country: newUser.country,
          kycStatus: newUser.kycStatus,
          role: newUser.role,
          isVerified: newUser.isVerified
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          fullName: user.fullName,
          accountId: user.accountId,
          role: user.role,
          kycStatus: user.kycStatus,
          hashpackWalletConnected: user.hashpackWalletConnected,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

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
        name: user.name,
        email: user.email,
        accountId: user.accountId,
        hederaPublicKey: user.hederaPublicKey,
        fullName: user.fullName,
        country: user.country,
        role: user.role,
        kycStatus: user.kycStatus,
        kycApprovedAt: user.kycApprovedAt,
        hashpackWalletConnected: user.hashpackWalletConnected,
        isVerified: user.isVerified,
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

router.post('/link-hedera', authenticate, async (req, res) => {
  try {
    const { accountId, hederaPublicKey } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Hedera account ID is required'
      });
    }

    const existingHedera = await User.findOne({ accountId, _id: { $ne: req.user.userId } });
    if (existingHedera) {
      return res.status(400).json({
        success: false,
        message: 'This Hedera account is already linked to another user'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.accountId = accountId;
    user.hederaPublicKey = hederaPublicKey;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Hedera account linked successfully',
      data: {
        accountId: user.accountId,
        hederaPublicKey: user.hederaPublicKey
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to link Hedera account',
      error: error.message
    });
  }
});

router.post('/connect-wallet', authenticate, async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({
        success: false,
        message: 'Wallet ID is required'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.accountId = walletId;
    user.hashpackWalletConnected = true;
    user.hashpackWalletId = walletId;
    user.hashpackConnectedAt = new Date();
    user.updatedAt = new Date();
    
    if (user.kycStatus === 'approved') {
      user.isVerified = true;
    }

    await user.save();

    await Notification.create({
      userId: user._id,
      userAccountId: user.accountId,
      type: 'wallet_connected',
      title: 'Wallet Connected',
      message: user.isVerified
        ? 'Your HashPack wallet has been connected! You can now buy and sell assets.'
        : 'Your HashPack wallet has been connected! Please complete KYC verification to start trading.'
    });

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      data: {
        hashpackWalletConnected: user.hashpackWalletConnected,
        hashpackWalletId: user.hashpackWalletId,
        accountId: user.accountId,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect wallet',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(k => error.errors[k].message) : []
    });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    
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

export default router;
