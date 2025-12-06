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
  valuation: { type: Number },
  estimatedPrice: { type: Number }, // From price estimation microservice
  liquidityScore: { type: Number, default: 0 },
  securityScore: { type: Number },
  securityAnalysis: { type: Schema.Types.Mixed },
  
  // Asset verification
  verificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
  verificationImages: [{ type: String }],
  verificationSubmittedAt: { type: Date },
  verificationApprovedAt: { type: Date },
  verificationRejectedAt: { type: Date },
  verificationRejectionReason: { type: String },
  verifiedByAdmin: { type: Schema.Types.ObjectId, ref: "User" },
  aiVerificationResult: { type: Schema.Types.Mixed },
  
  tokenization: {
    totalSupply: { type: Number },
    symbol: { type: String },
    pricePerToken: { type: Number },
    reservedTokens: { type: Number, default: 0 },
    availableTokens: { type: Number },
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
  
  priceHistory: [{
    date: { type: Date },
    price: { type: Number },
    volume: { type: Number, default: 0 }
  }],
  
  isListed: { type: Boolean, default: false },
  listingPrice: { type: Number },
  listedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Asset', AssetSchema);
