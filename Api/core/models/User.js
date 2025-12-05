import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
  // Basic user info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  
  // Hedera info
  accountId: { type: String, unique: true, sparse: true }, // e.g. "0.0.1234" - optional initially
  hederaPublicKey: { type: String },
  
  // Personal details
  fullName: { type: String },
  country: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String },
  phoneNumber: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  
  // KYC fields
  kycStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
  kycSubmittedAt: { type: Date },
  kycApprovedAt: { type: Date },
  kycRejectedAt: { type: Date },
  kycDocumentType: { type: String, enum: ["cin", "passport"] },
  kycDocumentUrl: { type: String },
  kycProcessedByAI: { type: Boolean, default: false },
  kycAIResult: { type: Schema.Types.Mixed },
  kycRejectionReason: { type: String },
  
  // Wallet connection
  hashpackWalletConnected: { type: Boolean, default: false },
  hashpackWalletId: { type: String },
  hashpackConnectedAt: { type: Date },
  
  // Verification status
  isVerified: { type: Boolean, default: false }, // Both KYC approved AND wallet connected
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
