import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userAccountId: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      "kyc_approved", 
      "kyc_rejected", 
      "asset_approved", 
      "asset_rejected",
      "wallet_connected",
      "asset_sold",
      "asset_purchased",
      "general"
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userAccountId: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
