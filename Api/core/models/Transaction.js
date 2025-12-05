import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  assetName: String,
  assetSymbol: String,
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  pricePerToken: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  // Blockchain-specific fields
  transactionHash: {
    type: String,
    default: null
  },
  blockchainNetwork: {
    type: String,
    default: 'hedera-testnet'
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);
