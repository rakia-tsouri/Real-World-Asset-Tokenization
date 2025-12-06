import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  validateRequest
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

export const assetValidation = [
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('symbol').trim().notEmpty().withMessage('Asset symbol is required'),
  body('totalSupply').isNumeric().withMessage('Total supply must be a number'),
  body('pricePerToken').isNumeric().withMessage('Price per token must be a number'),
  body('assetType').isIn(['real-estate', 'commodities', 'art', 'bonds', 'other']).withMessage('Invalid asset type'),
  validateRequest
];

export const transactionValidation = [
  body('assetId').notEmpty().withMessage('Asset ID is required'),
  body('quantity').isNumeric().isInt({ min: 1 }).withMessage('Quantity must be a positive number'),
  body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
  validateRequest
];
