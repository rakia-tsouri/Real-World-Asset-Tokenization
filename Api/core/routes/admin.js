import express from 'express';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import Asset from '../models/Asset.js';
import Notification from '../models/Notification.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createFungibleToken } from '../services/hederaService.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/admin/kyc/pending
// @desc    Get all pending KYC submissions
// @access  Admin
router.get('/kyc/pending', async (req, res) => {
  try {
    const pendingKYCs = await KYC.find({ status: 'pending' })
      .populate('userId', 'name email accountId createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingKYCs.length,
      data: pendingKYCs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending KYC submissions',
      error: error.message
    });
  }
});

// @route   GET /api/admin/kyc/:kycId
// @desc    Get detailed KYC information
// @access  Admin
router.get('/kyc/:kycId', async (req, res) => {
  try {
    const kycRequest = await KYC.findById(req.params.kycId)
      .populate('userId', 'name email accountId kycStatus isVerified hashpackWalletConnected');
    
    if (!kycRequest) {
      return res.status(404).json({
        success: false,
        message: 'KYC request not found'
      });
    }

    res.json({
      success: true,
      data: kycRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC details',
      error: error.message
    });
  }
});

// @route   POST /api/admin/kyc/:kycId/approve
// @desc    Approve a KYC request
// @access  Admin
router.post('/kyc/:kycId/approve', async (req, res) => {
  try {
    const kycRequest = await KYC.findById(req.params.kycId);
    
    if (!kycRequest) {
      return res.status(404).json({
        success: false,
        message: 'KYC request not found'
      });
    }

    const user = await User.findById(kycRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update KYC request
    kycRequest.status = 'approved';
    kycRequest.reviewedBy = req.user.userId;
    kycRequest.reviewedAt = new Date();
    kycRequest.updatedAt = new Date();
    await kycRequest.save();

    // Update user
    user.kycStatus = 'approved';
    user.kycApprovedAt = new Date();
    user.kycRejectedAt = null;
    user.kycRejectionReason = null;
    user.updatedAt = new Date();
    
    // Check if user is fully verified (KYC + Wallet)
    if (user.hashpackWalletConnected) {
      user.isVerified = true;
    }

    await user.save();

    // Create notification
    await Notification.create({
      userId: user._id,
      userAccountId: user.accountId,
      type: 'kyc_approved',
      title: 'KYC Approved',
      message: user.hashpackWalletConnected 
        ? 'Your identity verification has been approved! You can now buy and sell assets.'
        : 'Your identity verification has been approved! Please connect your HashPack wallet to start trading.'
    });

    res.json({
      success: true,
      message: 'KYC approved successfully',
      data: {
        kycId: kycRequest._id,
        userId: user._id,
        kycStatus: user.kycStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve KYC',
      error: error.message
    });
  }
});

// @route   POST /api/admin/kyc/:kycId/reject
// @desc    Reject a KYC request
// @access  Admin
router.post('/kyc/:kycId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const kycRequest = await KYC.findById(req.params.kycId);
    
    if (!kycRequest) {
      return res.status(404).json({
        success: false,
        message: 'KYC request not found'
      });
    }

    const user = await User.findById(kycRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update KYC request
    kycRequest.status = 'rejected';
    kycRequest.rejectionReason = reason;
    kycRequest.reviewedBy = req.user.userId;
    kycRequest.reviewedAt = new Date();
    kycRequest.updatedAt = new Date();
    await kycRequest.save();

    // Update user
    user.kycStatus = 'rejected';
    user.kycRejectedAt = new Date();
    user.kycApprovedAt = null;
    user.kycRejectionReason = reason;
    user.isVerified = false;
    user.updatedAt = new Date();

    await user.save();

    // Create notification
    await Notification.create({
      userId: user._id,
      userAccountId: user.accountId,
      type: 'kyc_rejected',
      title: 'KYC Rejected',
      message: `Your identity verification has been rejected. Reason: ${reason}`,
      metadata: { reason }
    });

    res.json({
      success: true,
      message: 'KYC rejected',
      data: {
        userId: user._id,
        kycStatus: user.kycStatus,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject KYC',
      error: error.message
    });
  }
});

// @route   GET /api/admin/assets/pending
// @desc    Get all pending asset verifications
// @access  Admin
router.get('/assets/pending', async (req, res) => {
  try {
    const pendingAssets = await Asset.find({ 
      verificationStatus: 'pending',
      verificationSubmittedAt: { $exists: true }
    })
    .populate('ownerId', 'accountId fullName email')
    .sort({ verificationSubmittedAt: -1 });

    res.json({
      success: true,
      count: pendingAssets.length,
      data: pendingAssets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending asset verifications',
      error: error.message
    });
  }
});

// @route   GET /api/admin/assets/:assetId
// @desc    Get detailed asset information
// @access  Admin
router.get('/assets/:assetId', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId)
      .populate('ownerId', 'accountId fullName email kycStatus');
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset details',
      error: error.message
    });
  }
});

// @route   POST /api/admin/assets/:assetId/approve
// @desc    Approve an asset verification and create Hedera token
// @access  Admin
router.post('/assets/:assetId/approve', async (req, res) => {
  try {
    const { 
      // Allow admin to override tokenization parameters
      totalSupply,
      symbol,
      pricePerToken,
      reservedTokens
    } = req.body;

    const asset = await Asset.findById(req.params.assetId).populate('ownerId');
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Update tokenization parameters if admin provided overrides
    if (totalSupply !== undefined) asset.tokenization.totalSupply = totalSupply;
    if (symbol !== undefined) asset.tokenization.symbol = symbol;
    if (pricePerToken !== undefined) asset.tokenization.pricePerToken = pricePerToken;
    if (reservedTokens !== undefined) {
      asset.tokenization.reservedTokens = reservedTokens;
      asset.tokenization.availableTokens = asset.tokenization.totalSupply - reservedTokens;
    }

    // Validate tokenization data
    if (!asset.tokenization.totalSupply || !asset.tokenization.symbol || !asset.tokenization.pricePerToken) {
      return res.status(400).json({
        success: false,
        message: 'Asset must have tokenization parameters (totalSupply, symbol, pricePerToken) before approval'
      });
    }

    // Create Hedera fungible token
    let tokenCreationResult;
    try {
      tokenCreationResult = await createFungibleToken({
        name: asset.title,
        symbol: asset.tokenization.symbol,
        totalSupply: asset.tokenization.totalSupply,
        decimals: 0, // Whole fractions only
        memo: `${asset.category} - ${asset.description?.substring(0, 50) || ''}`
      });

      // Save Hedera token data to asset
      asset.hedera.tokenId = tokenCreationResult.tokenId;
      asset.hedera.treasuryAccountId = tokenCreationResult.treasuryAccountId;
      asset.hedera.supplyKey = tokenCreationResult.supplyKey;
      asset.hedera.adminKey = tokenCreationResult.adminKey;
      asset.hedera.tokenized = true;
      asset.hedera.createdTxHash = tokenCreationResult.transactionId;

    } catch (tokenError) {
      console.error('Hedera token creation failed:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create Hedera token for this asset',
        error: tokenError.message
      });
    }

    // Update asset verification status
    asset.verificationStatus = 'approved';
    asset.verificationApprovedAt = new Date();
    asset.verificationRejectedAt = null;
    asset.verificationRejectionReason = null;
    asset.verifiedByAdmin = req.user.userId;
    asset.updatedAt = new Date();
    asset.isListed = true; // Automatically list approved assets

    await asset.save();

    // Create notification
    await Notification.create({
      userId: asset.ownerId._id,
      userAccountId: asset.ownerId.accountId,
      type: 'asset_approved',
      title: 'Asset Approved & Tokenized',
      message: `Your asset "${asset.title}" has been verified, approved, and tokenized on Hedera! Token ID: ${asset.hedera.tokenId}`,
      metadata: { 
        assetId: asset._id, 
        assetTitle: asset.title,
        tokenId: asset.hedera.tokenId,
        totalSupply: asset.tokenization.totalSupply,
        availableTokens: asset.tokenization.availableTokens
      }
    });

    res.json({
      success: true,
      message: 'Asset approved and tokenized successfully',
      data: {
        assetId: asset._id,
        verificationStatus: asset.verificationStatus,
        tokenId: asset.hedera.tokenId,
        treasuryAccountId: asset.hedera.treasuryAccountId,
        totalSupply: asset.tokenization.totalSupply,
        availableTokens: asset.tokenization.availableTokens,
        pricePerToken: asset.tokenization.pricePerToken
      }
    });
  } catch (error) {
    console.error('Asset approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve asset',
      error: error.message
    });
  }
});

// @route   POST /api/admin/assets/:assetId/reject
// @desc    Reject an asset verification
// @access  Admin
router.post('/assets/:assetId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const asset = await Asset.findById(req.params.assetId).populate('ownerId');
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.verificationStatus = 'rejected';
    asset.verificationRejectedAt = new Date();
    asset.verificationApprovedAt = null;
    asset.verificationRejectionReason = reason;
    asset.verifiedByAdmin = req.user.userId;
    asset.updatedAt = new Date();

    await asset.save();

    // Create notification
    await Notification.create({
      userId: asset.ownerId._id,
      userAccountId: asset.ownerId.accountId,
      type: 'asset_rejected',
      title: 'Asset Verification Rejected',
      message: `Your asset "${asset.title}" verification has been rejected. Reason: ${reason}`,
      metadata: { assetId: asset._id, assetTitle: asset.title, reason }
    });

    res.json({
      success: true,
      message: 'Asset rejected',
      data: {
        assetId: asset._id,
        verificationStatus: asset.verificationStatus,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject asset',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      pendingKYC,
      approvedKYC,
      rejectedKYC,
      totalAssets,
      pendingAssets,
      approvedAssets,
      rejectedAssets
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ kycStatus: 'pending' }),
      User.countDocuments({ kycStatus: 'approved' }),
      User.countDocuments({ kycStatus: 'rejected' }),
      Asset.countDocuments(),
      Asset.countDocuments({ verificationStatus: 'pending' }),
      Asset.countDocuments({ verificationStatus: 'approved' }),
      Asset.countDocuments({ verificationStatus: 'rejected' })
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          kycPending: pendingKYC,
          kycApproved: approvedKYC,
          kycRejected: rejectedKYC
        },
        assets: {
          total: totalAssets,
          verificationPending: pendingAssets,
          verificationApproved: approvedAssets,
          verificationRejected: rejectedAssets
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;
