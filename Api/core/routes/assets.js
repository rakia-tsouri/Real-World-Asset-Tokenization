import express from 'express';
import Asset from '../models/Asset.js';

const router = express.Router();

// @route   GET /api/assets
// @desc    Get all assets
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { availability_in_tunisia, search, sort, listed } = req.query;
    let query = {};

    // Filter by Tunisia availability
    if (availability_in_tunisia !== undefined) {
      query.availability_in_tunisia = availability_in_tunisia === 'true';
    }

    // Filter by listed status
    if (listed !== undefined) {
      query.isListed = listed === 'true';
    }

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let assets = await Asset.find(query).populate('ownerId', 'accountId country');

    // Sort
    if (sort === 'valuation-asc') {
      assets.sort((a, b) => (a.valuation || 0) - (b.valuation || 0));
    } else if (sort === 'valuation-desc') {
      assets.sort((a, b) => (b.valuation || 0) - (a.valuation || 0));
    } else if (sort === 'liquidity-desc') {
      assets.sort((a, b) => b.liquidityScore - a.liquidityScore);
    } else if (sort === 'newest') {
      assets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('ownerId', 'accountId country kycStatus');
    
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
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
});

// @route   POST /api/assets
// @desc    Create new asset
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ownerId, 
      ipfsCid, 
      availability_in_tunisia, 
      valuation, 
      liquidityScore,
      hedera 
    } = req.body;

    if (!title || !ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Title and ownerId are required'
      });
    }

    const newAsset = await Asset.create({
      title,
      description,
      ownerId,
      ipfsCid,
      availability_in_tunisia: availability_in_tunisia !== undefined ? availability_in_tunisia : true,
      valuation,
      liquidityScore: liquidityScore || 0,
      hedera
    });

    const populatedAsset = await Asset.findById(newAsset._id).populate('ownerId', 'accountId country');

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: populatedAsset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update asset
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const updateFields = ['title', 'description', 'ipfsCid', 'availability_in_tunisia', 'valuation', 'liquidityScore', 'hedera'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    });

    await asset.save();

    const updatedAsset = await Asset.findById(asset._id).populate('ownerId', 'accountId country');

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
});

export default router;
