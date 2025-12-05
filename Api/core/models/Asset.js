import mongoose from 'mongoose';

const { Schema } = mongoose;

const AssetSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  ownerAccountId: { type: String },
  ipfsCid: { type: String },
  availability_in_tunisia: { type: Boolean, default: true },
  valuation: { type: Number }, // in local currency or USD
  estimatedPrice: { type: Number }, // From price estimation microservice
  liquidityScore: { type: Number, default: 0 },
  securityScore: { type: Number }, // From security analysis microservice
  securityAnalysis: { type: Schema.Types.Mixed },
  
  // Asset verification
  verificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
  verificationImages: [{ type: String }], // URLs to uploaded images (max 3)
  verificationSubmittedAt: { type: Date },
  verificationApprovedAt: { type: Date },
  verificationRejectedAt: { type: Date },
  verificationRejectionReason: { type: String },
  verifiedByAdmin: { type: Schema.Types.ObjectId, ref: "User" },
  aiVerificationResult: { type: Schema.Types.Mixed },
  
  // Tokenization settings (set by user during creation)
  tokenization: {
    totalSupply: { type: Number }, // Total number of token fractions
    symbol: { type: String }, // Token symbol (e.g., "VILLA01")
    pricePerToken: { type: Number }, // Initial price per token fraction
    reservedTokens: { type: Number, default: 0 }, // Tokens kept by owner (not for sale)
    availableTokens: { type: Number }, // Tokens available for trading
  },
  
  hedera: {
    tokenId: { type: String }, 
    treasuryAccountId: { type: String },
    supplyKey: { type: String },
    adminKey: { type: String },
    createdTxHash: { type: String },
    tokenized: { type: Boolean, default: false },
    decimals: { type: Number, default: 0 }
  },
  
  // Trading
  isListed: { type: Boolean, default: false },
  listingPrice: { type: Number }, // Deprecated - use pricePerToken
  listedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Asset', AssetSchema);
