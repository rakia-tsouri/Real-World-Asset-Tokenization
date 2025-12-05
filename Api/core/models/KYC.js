import mongoose from 'mongoose';

const { Schema } = mongoose;

const KycRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  dateOfBirth: { type: Date },
  address: { type: String },
  phoneNumber: { type: String },
  country: { type: String },
  documentType: { type: String, enum: ['cin', 'passport'], required: true },
  documentUrl: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // AI Processing
  processedByAI: { type: Boolean, default: false },
  aiResult: {
    result: String,
    confidence: Number,
    details: Schema.Types.Mixed,
    processedAt: Date
  },
  
  // Admin Review
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('KycRequest', KycRequestSchema);