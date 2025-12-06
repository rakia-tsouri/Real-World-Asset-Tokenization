import mongoose from "mongoose";

const { Schema } = mongoose;

const PortfolioSchema = new Schema({
  userAccountId: { type: String, required: true },
  allocations: [{ assetId: Schema.Types.ObjectId, percent: Number }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Portfolio", PortfolioSchema);
