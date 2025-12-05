import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/assets';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `asset-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const assetUpload = multer({
  storage: assetStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(null, false);
  }
});

router.get('/', async (req, res) => {
  try {
    const { availability_in_tunisia, search, sort, listed, includeUnverified } = req.query;
    let query = {};

    if (includeUnverified !== 'true') {
      query.verificationStatus = 'approved';
    }

    if (listed === 'true') {
      query.isListed = true;
    }

    if (availability_in_tunisia !== undefined) {
      query.availability_in_tunisia = availability_in_tunisia === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Assets query:', query);
    let assets = await Asset.find(query)
      .populate('ownerId', 'accountId fullName country kycStatus');

    console.log(`Found ${assets.length} assets matching query`);

    if (sort === 'price-asc') {
      assets.sort((a, b) => (a.listingPrice || a.valuation || 0) - (b.listingPrice || b.valuation || 0));
    } else if (sort === 'price-desc') {
      assets.sort((a, b) => (b.listingPrice || b.valuation || 0) - (a.listingPrice || a.valuation || 0));
    } else if (sort === 'liquidity-desc') {
      assets.sort((a, b) => b.liquidityScore - a.liquidityScore);
    } else if (sort === 'security-desc') {
      assets.sort((a, b) => (b.securityScore || 0) - (a.securityScore || 0));
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

router.get('/my-assets', authenticate, async (req, res) => {
  try {
    const assets = await Asset.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your assets',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('ownerId', 'accountId fullName country kycStatus');
    
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

router.post('/estimate-price', authenticate, async (req, res) => {
  try {
    const { title, description, category, location, condition, age } = req.body;

    try {
      const estimationServiceUrl = process.env.PRICE_ESTIMATION_SERVICE_URL || 'http://localhost:8002/estimate';
      
      console.log(`[STUB] Would call price estimation service: ${estimationServiceUrl}`);
      
      const estimatedPrice = Math.floor(Math.random() * 50000) + 10000;
      const confidence = Math.random() * 0.3 + 0.7;

      res.json({
        success: true,
        data: {
          estimatedPrice,
          confidence,
          currency: 'USD',
          factors: {
            category,
            condition,
            age,
            location
          }
        }
      });
    } catch (estimationError) {
      console.error('Price estimation service error:', estimationError.message);
      res.status(503).json({
        success: false,
        message: 'Price estimation service temporarily unavailable'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to estimate price',
      error: error.message
    });
  }
});

router.post('/create-and-verify', authenticate, requireVerified, (req, res, next) => {
  assetUpload.array('images', 3)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 10MB per image.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 3 images allowed.'
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category,
      location,
      condition,
      estimatedPrice,
      availability_in_tunisia,
      // Real Estate fields
      propertyType,
      size,
      bedrooms,
      bathrooms,
      yearBuilt,
      lotSize,
      floors,
      parking,
      furnished,
      // Vehicle fields
      make,
      model,
      year,
      mileage,
      transmission,
      fuelType,
      engineSize,
      color,
      vin,
      owners,
      // Commodity fields
      commodityType,
      weight,
      unit,
      purity,
      certification,
      storage,
      form,
      // Company fields
      companyName,
      industry,
      yearEstablished,
      revenue,
      employees,
      valuation,
      equity,
      registrationNumber,
      // Tokenization fields
      totalSupply,
      symbol,
      pricePerToken,
      reservedTokens,
      availableTokens
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one verification image is required (max 3)'
      });
    }

    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 images allowed'
      });
    }

    const user = await User.findById(req.user.userId);
    
    const verificationImages = req.files.map(file => `/uploads/assets/${file.filename}`);

    const assetData = {
      title,
      description,
      category,
      location,
      condition,
      ownerId: req.user.userId,
      ownerAccountId: user.accountId,
      estimatedPrice,
      availability_in_tunisia: availability_in_tunisia !== undefined ? availability_in_tunisia : true,
      verificationStatus: 'pending',
      verificationImages,
      verificationSubmittedAt: new Date()
    };

    if (category === 'real-estate') {
      Object.assign(assetData, {
        propertyType,
        size,
        bedrooms,
        bathrooms,
        yearBuilt,
        lotSize,
        floors,
        parking,
        furnished
      });
    } else if (category === 'vehicle') {
      Object.assign(assetData, {
        make,
        model,
        year,
        mileage,
        transmission,
        fuelType,
        engineSize,
        color,
        vin,
        owners
      });
    } else if (category === 'commodity') {
      Object.assign(assetData, {
        commodityType,
        weight,
        unit,
        purity,
        certification,
        storage,
        form
      });
    } else if (category === 'company') {
      Object.assign(assetData, {
        companyName,
        industry,
        yearEstablished,
        revenue,
        employees,
        valuation,
        equity,
        registrationNumber
      });
    }

    if (totalSupply && symbol && pricePerToken) {
      assetData.tokenization = {
        totalSupply: parseInt(totalSupply),
        symbol: symbol.toUpperCase(),
        pricePerToken: parseFloat(pricePerToken),
        reservedTokens: parseInt(reservedTokens) || 0,
        availableTokens: parseInt(availableTokens) || (parseInt(totalSupply) - (parseInt(reservedTokens) || 0))
      };
    }

    const newAsset = await Asset.create(assetData);

    try {
      const aiServiceUrl = process.env.AI_ASSET_SERVICE_URL || 'http://localhost:8003/verify-asset';
      console.log(`[STUB] Would send asset images to AI service: ${aiServiceUrl}`);
      console.log(`[STUB] Asset ID: ${newAsset._id}, Images: ${verificationImages.length}`);
      
    } catch (aiError) {
      console.error('[STUB] AI service not available:', aiError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Asset created and submitted for verification',
      data: newAsset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  }
});

router.post('/:id/list', authenticate, requireVerified, async (req, res) => {
  try {
    const { price } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only list your own assets'
      });
    }

    if (asset.verificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Asset must be verified before listing'
      });
    }

    asset.isListed = true;
    asset.listingPrice = price;
    asset.listedAt = new Date();
    asset.updatedAt = new Date();

    await asset.save();

    res.json({
      success: true,
      message: 'Asset listed successfully',
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list asset',
      error: error.message
    });
  }
});

router.post('/:id/unlist', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only unlist your own assets'
      });
    }

    asset.isListed = false;
    asset.listingPrice = null;
    asset.updatedAt = new Date();

    await asset.save();

    res.json({
      success: true,
      message: 'Asset unlisted successfully',
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unlist asset',
      error: error.message
    });
  }
});

router.post('/:id/security-analysis', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.hedera.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Asset must be tokenized first'
      });
    }

    try {
      const securityServiceUrl = process.env.SECURITY_ANALYSIS_SERVICE_URL || 'http://localhost:8004/analyze';
      console.log(`[STUB] Would call security analysis service: ${securityServiceUrl}`);
      
      const securityScore = Math.floor(Math.random() * 30) + 70;
      
      asset.securityScore = securityScore;
      asset.securityAnalysis = {
        score: securityScore,
        analyzedAt: new Date(),
        factors: {
          ownerVerification: 'passed',
          documentAuthenticity: 'passed',
          marketLiquidity: 'medium'
        }
      };
      asset.updatedAt = new Date();

      await asset.save();

      res.json({
        success: true,
        data: {
          securityScore,
          analysis: asset.securityAnalysis
        }
      });
    } catch (securityError) {
      console.error('Security analysis service error:', securityError.message);
      res.status(503).json({
        success: false,
        message: 'Security analysis service temporarily unavailable'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform security analysis',
      error: error.message
    });
  }
});

export default router;
