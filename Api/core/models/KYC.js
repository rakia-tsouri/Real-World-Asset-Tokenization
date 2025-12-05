import mongoose from 'mongoose';

const { Schema } = mongoose;

const KycRequestSchema = new Schema({
  userAccountId: { type: String, required: true },
  challenge: { type: String, required: true },
  signature: { type: String },
  status: { type: String, enum: ["created","verified","failed"], default: "created" },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date }
});

export default mongoose.model('KycRequest', KycRequestSchema);