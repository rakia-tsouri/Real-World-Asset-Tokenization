import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  accountId: { type: String, unique: true, required: true }, // e.g. "0.0.1234"
  hederaPublicKey: { type: String }, // recorded for convenience
  country: { type: String },
  kycStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  kycApprovedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
