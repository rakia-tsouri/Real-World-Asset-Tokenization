import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Portfolio from '../models/Portfolio.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { 
  buyTokensFromTreasury, 
  sellTokensToTreasury, 
  getTransactionHistory,
  getTokenBalance 
} from '../services/hederaService.js';

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user's transactions from Hedera blockchain
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.accountId) {
      return res.status(400).json({
        success: false,
        message: 'User account not connected to Hedera'
      });
    }

    // Fetch transactions from Hedera Mirror Node
    const hederaTransactions = await getTransactionHistory(user.accountId);

    // Also get local transaction records for additional metadata
    const localTransactions = await Transaction.find({ userId: req.user.userId })
      .populate('assetId', 'title category tokenization.symbol hedera.tokenId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        onChain: hederaTransactions,
        local: localTransactions
      }
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// @route   POST /api/transactions/buy
// @desc    Buy asset tokens (on-chain transaction)
// @access  Private (Verified users only)
router.post('/buy', authenticate, requireVerified, async (req, res) => {
  try {
    const { assetId, quantity } = req.body;

    if (!assetId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'assetId and valid quantity are required'
      });
    }

    // Get user data
    const user = await User.findById(req.user.userId);
    if (!user || !user.accountId) {
      return res.status(400).json({
        success: false,
        message: 'User wallet not connected'
      });
    }

    // Verify asset exists and is tokenized
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not listed for sale'
      });
    }

    if (!asset.hedera?.tokenized || !asset.hedera?.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not tokenized on Hedera blockchain'
      });
    }

    // Check available tokens
    if (quantity > asset.tokenization.availableTokens) {
      return res.status(400).json({
        success: false,
        message: `Only ${asset.tokenization.availableTokens} tokens available`
      });
    }

    const pricePerToken = asset.tokenization.pricePerToken;
    const totalAmount = quantity * pricePerToken;

    // Execute on-chain token transfer from treasury to buyer
    let blockchainResult;
    try {
      blockchainResult = await buyTokensFromTreasury(
        asset.hedera.tokenId,
        user.accountId,
        quantity,
        totalAmount
      );
    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
      return res.status(500).json({
        success: false,
        message: 'Blockchain transaction failed. Please ensure your wallet is associated with the token.',
        error: blockchainError.message
      });
    }

    // Update available tokens
    asset.tokenization.availableTokens -= quantity;
    await asset.save();

    // Create local transaction record for metadata
    const transaction = await Transaction.create({
      userId: req.user.userId,
      assetId,
      assetName: asset.title,
      assetSymbol: asset.tokenization.symbol,
      type: 'buy',
      quantity,
      pricePerToken,
      totalAmount,
      status: 'completed',
      transactionHash: blockchainResult.transactionId,
      blockchainNetwork: 'hedera-testnet'
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
        portfolio.allocations.push({ assetId, percent: 0 });
        await portfolio.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tokens purchased successfully on Hedera blockchain',
      data: {
        transaction,
        blockchainTxId: blockchainResult.transactionId,
        tokenId: asset.hedera.tokenId,
        quantity,
        totalAmount,
        remainingTokens: asset.tokenization.availableTokens
      }
    });
  } catch (error) {
    console.error('Buy transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: error.message
    });
  }
});

// @route   POST /api/transactions/sell
// @desc    Sell asset tokens (record transaction)
// @access  Private (Verified users only)
router.post('/sell', authenticate, requireVerified, async (req, res) => {
  try {
    const { assetId, quantity, pricePerToken } = req.body;

    if (!assetId || !quantity || !pricePerToken) {
      return res.status(400).json({
        success: false,
        message: 'assetId, quantity, and pricePerToken are required'
      });
    }

    // Verify asset exists
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const totalAmount = quantity * pricePerToken;

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user.userId,
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

// @route   GET /api/transactions/:id
// @desc    Get transaction details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    })
      .populate('assetId', 'title description valuation tokenId');

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
