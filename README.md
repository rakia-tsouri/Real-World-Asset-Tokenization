# Carthage Gate - Democratizing Real Estate Investment in Tunisia

Carthage Gate brings real-world asset tokenization to Tunisia, making premium real estate investment accessible to everyone. Start investing with as little as **300 TND** — no big money needed.

## 🎯 Mission

We're making it easy for Tunisians to invest in real estate through blockchain technology, breaking down traditional barriers and enabling fractional ownership of premium properties across Tunisia.

## ✨ Key Features

-  **Low Barrier to Entry**: Start investing with just 300 TND
-  **Fractional Ownership**: Buy shares of high-value properties
-  **Tunisia-Focused**: Properties across Tunis, Sousse, Hammamet, and beyond
-  **Instant Transactions**: Buy and sell property shares on the blockchain
-  **Transparent & Secure**: Every transaction is recorded and verified on-chain
-  **TND Currency**: All transactions in Tunisian Dinars for local convenience

## 🌟 Why Carthage Gate?

Traditional real estate investment in Tunisia requires significant capital, complex paperwork, and months of processing. Carthage Gate changes this by:

- **Eliminating High Entry Costs**: No need for hundreds of thousands of dinars upfront
- **Providing Liquidity**: Trade your property shares anytime without waiting for buyers
- **Ensuring Transparency**: Blockchain technology provides immutable proof of ownership
- **Simplifying the Process**: No lawyers, no notaries, no endless paperwork
- **Enabling Diversification**: Invest in multiple properties across different regions

## 🏗️ Architecture

The Carthage Gate platform consists of the following components:

- **Smart Contracts**: Solidity-based contracts for property tokenization and fractional ownership
- **Property Registry**: On-chain registry mapping tokens to real Tunisian properties
- **Compliance Module**: KYC verification and regulatory compliance for Tunisian law
- **TND Payment Integration**: Seamless transactions in Tunisian Dinars
- **Oracle Integration**: Real-time property valuations and market data
- **Frontend DApp**: User-friendly interface for browsing, buying, and managing property shares

## 🚀 Platform Features

### For Investors
-  Browse verified properties across Tunisia
-  Purchase fractional shares starting at 300 TND
-  Track your portfolio in real-time
-  Receive proportional rental income automatically
-  Trade shares on the secondary market
-  View complete property documentation and history

### For Property Owners
-  Tokenize your property to raise capital
-  Maintain partial ownership while accessing liquidity
-  Automated rent distribution to token holders
-  Reduced administrative burden
-  Access to a wider investor base

### For the Platform
-  Property verification and due diligence
-  Legal compliance and documentation
-  Escrow services for transactions
-  Property management coordination
-  Dispute resolution mechanisms

## 🛠️ Tech Stack

- **Blockchain**: Ethereum / Polygon (for lower gas fees)
- **Smart Contracts**: Solidity ^0.8.0
- **Development Framework**: Hardhat
- **Testing**: Chai, Mocha, Waffle
- **Frontend**: React.js / Next.js
- **Web3 Integration**: ethers.js
- **Storage**: IPFS for property documents and metadata
- **Oracles**: Chainlink for TND/ETH price feeds
- **Payment Processing**: Integration with Tunisian payment gateways
- **Security**: OpenZeppelin Contracts

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Infura/Alchemy API key (for deployment)
- Understanding of Tunisian real estate regulations

## Installation

```bash
# Clone the repository
git clone https://github.com/rakia-tsouri/Real-World-Asset-Tokenization.git
cd Real-World-Asset-Tokenization

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - Private keys
# - RPC endpoints
# - API keys
# - TND payment gateway credentials
```

## Configuration

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
POLYGON_RPC_URL=your_polygon_rpc
ETHERSCAN_API_KEY=your_etherscan_key
TND_PAYMENT_GATEWAY_KEY=your_payment_key
IPFS_PROJECT_ID=your_ipfs_id
IPFS_PROJECT_SECRET=your_ipfs_secret
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run specific test file
npx hardhat test test/PropertyToken.test.js

# Test TND payment integration
npx hardhat test test/TndPayment.test.js
```

## Deployment

```bash
# Compile contracts
npm run compile

# Deploy to local network
npx hardhat run scripts/deploy.js

# Deploy to Polygon testnet (Mumbai)
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon

# Verify contract
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

## Usage Examples

### Tokenizing a Property

```javascript
const propertyToken = await PropertyToken.deploy(
  "Villa Gammarth Token",
  "VGT",
  totalShares,
  pricePerShare, // in TND equivalent
  propertyMetadataURI
);

// Set property details
await propertyToken.setPropertyDetails(
  "123 Avenue Habib Bourguiba, Gammarth, Tunis",
  propertyValue, // in TND
  rentalYield // annual percentage
);
```

### Investing in a Property

```javascript
// Check available shares
const availableShares = await propertyToken.getAvailableShares();

// Purchase shares (minimum 300 TND)
await propertyToken.purchaseShares(numberOfShares, {
  value: priceInTND
});
```

### Receiving Rental Income

```javascript
// Property manager distributes monthly rent
await propertyToken.distributeRentalIncome({ 
  value: totalRentalAmount 
});

// Investors can claim their share
await propertyToken.claimRentalIncome();
```

## Smart Contract Overview

### PropertyToken.sol
ERC-20 token contract representing fractional ownership of a specific property with TND-denominated pricing.

### PropertyRegistry.sol
Maintains the registry of all tokenized properties in Tunisia with legal documentation and verification status.

### ComplianceModule.sol
Handles KYC verification for Tunisian investors and ensures compliance with local regulations.

### RentalDistributor.sol
Automates monthly rental income distribution to token holders proportional to their ownership.

### TndPaymentGateway.sol
Interfaces with Tunisian payment systems for seamless TND transactions.

## 🇹🇳 Regulatory Compliance

Carthage Gate operates in accordance with Tunisian law:

- Full KYC verification for all investors
- Compliance with property ownership regulations
- Partnership with licensed real estate agencies
- Legal documentation stored on IPFS with on-chain hashes
- Adherence to Central Bank of Tunisia guidelines
- Tax reporting and withholding as per Tunisian tax law

## Security

- All contracts audited by certified blockchain security firms
- Multi-signature wallet for treasury management
- Time-locked upgrades for critical contract changes
- Emergency pause functionality
- Insurance fund for investor protection
- Regular security audits and penetration testing

## Supported Property Types

-  **Commercial Properties**: Offices, retail spaces, warehouses
-  **Residential Properties**: Apartments, villas, townhouses
-  **Hospitality**: Hotels, resorts, vacation rentals
-  **Development Projects**: New construction opportunities
-  **Agricultural Land**: Farms, olive groves, vineyards

---

**Made with ❤️ in Tunisia | Empowering the next generation of property investors**
