import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/kyc';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kyc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
  }
});

// @route   POST /api/kyc/submit
// @desc    Submit KYC information and document
// @access  Private
router.post('/submit', authenticate, upload.single('document'), async (req, res) => {
  try {
    const { fullName, email, dateOfBirth, address, phoneNumber, country, documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document upload is required'
      });
    }

    if (!documentType || !['cin', 'passport'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Document type must be either "cin" or "passport"'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a pending or approved KYC
    const existingKYC = await KYC.findOne({ 
      userId: user._id, 
      status: { $in: ['pending', 'approved'] } 
    });

    if (existingKYC) {
      return res.status(400).json({
        success: false,
        message: existingKYC.status === 'approved' 
          ? 'Your KYC is already approved' 
          : 'You already have a pending KYC request'
      });
    }

    // Create KYC request
    const kycRequest = await KYC.create({
      userId: user._id,
      fullName: fullName || user.name,
      email: user.email,
      dateOfBirth,
      address,
      phoneNumber,
      country: country || user.country,
      documentType,
      documentUrl: `/uploads/kyc/${req.file.filename}`,
      status: 'pending'
    });

    // Update user KYC status
    user.fullName = fullName || user.name;
    user.dateOfBirth = dateOfBirth;
    user.address = address;
    user.phoneNumber = phoneNumber;
    user.country = country || user.country;
    user.kycDocumentType = documentType;
    user.kycDocumentUrl = `/uploads/kyc/${req.file.filename}`;
    user.kycStatus = 'pending';
    user.kycSubmittedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    // TODO: Send document to AI verification microservice
    // This will be implemented when the AI service is ready
    // Expected endpoint: POST http://localhost:8001/verify-kyc
    // Payload: { kycId, userId, documentUrl, documentType }
    // The AI service should process the document and call back to /api/kyc/ai-callback
    try {
      const aiServiceUrl = process.env.AI_KYC_SERVICE_URL || 'http://localhost:8001/verify-kyc';
  // Uncomment when AI service is ready:
      // await axios.post(aiServiceUrl, {
      //   kycId: kycRequest._id,
      //   userId: user._id,
      //   documentUrl: kycRequest.documentUrl,
      //   documentType: documentType,
      //   callbackUrl: `${process.env.API_URL}/api/kyc/ai-callback`
      // });
    } catch (aiError) {
      console.error('[STUB] AI service not available:', aiError.message);
      // Don't fail the request if AI service is unavailable
    }

    // Create notification
    await Notification.create({
      userId: user._id,
      userAccountId: user._id,
      type: 'general',
      title: 'KYC Submitted',
      message: 'Your KYC verification has been submitted and is being processed. This may take up to 24 hours.'
    });

    res.status(200).json({
      success: true,
      message: 'KYC information submitted successfully. Verification in progress (up to 24 hours).',
      data: {
        kycRequestId: kycRequest._id,
        kycStatus: kycRequest.status,
        submittedAt: kycRequest.createdAt
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC',
      error: error.message
    });
  }
});

// @route   GET /api/kyc/status
// @desc    Get KYC status for current user
// @access  Private
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        kycApprovedAt: user.kycApprovedAt,
        kycRejectedAt: user.kycRejectedAt,
        kycRejectionReason: user.kycRejectionReason,
        documentType: user.kycDocumentType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC status',
      error: error.message
    });
  }
});

// @route   POST /api/kyc/ai-callback
// @desc    Callback endpoint for AI service to report results
// @access  Public (should be secured with API key in production)
router.post('/ai-callback', async (req, res) => {
  try {
    const { userId, result, confidence, details } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.kycProcessedByAI = true;
    user.kycAIResult = {
      result,
      confidence,
      details,
      processedAt: new Date()
    };
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'AI results recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process AI callback',
      error: error.message
    });
  }
});

export default router;
