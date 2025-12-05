import mongoose from 'mongoose';

const { Schema } = mongoose;

const AssetSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  ipfsCid: { type: String },
  availability_in_tunisia: { type: Boolean, default: true },
  valuation: { type: Number }, // in local currency or USD
  liquidityScore: { type: Number, default: 0 },
  hedera: {
    tokenId: { type: String }, 
    treasuryAccountId: { type: String },
    createdTxHash: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Asset', AssetSchema);
