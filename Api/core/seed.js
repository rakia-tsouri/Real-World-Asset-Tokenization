import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './models/Asset.js';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Asset.deleteMany({});
    await User.deleteMany({});

    console.log('👤 Creating sample users...');
    const users = await User.insertMany([
      {
        name: 'Ahmed Ben Salem',
        email: 'ahmed@example.tn',
        password: '$2a$10$YourHashedPasswordHere', // Pre-hashed to avoid pre-save hook
        accountId: '0.0.1001',
        hederaPublicKey: '302a300506032b6570032100...',
        country: 'Tunisia',
        kycStatus: 'approved',
        kycApprovedAt: new Date(),
        hashpackWalletConnected: true,
        isVerified: true
      },
      {
        name: 'Mohammed Al Maktoum',
        email: 'mohammed@example.ae',
        password: '$2a$10$YourHashedPasswordHere',
        accountId: '0.0.1002',
        hederaPublicKey: '302a300506032b6570032100...',
        country: 'UAE',
        kycStatus: 'approved',
        kycApprovedAt: new Date(),
        hashpackWalletConnected: true,
        isVerified: true
      },
      {
        name: 'Jean Dupont',
        email: 'jean@example.fr',
        password: '$2a$10$YourHashedPasswordHere',
        accountId: '0.0.1003',
        hederaPublicKey: '302a300506032b6570032100...',
        country: 'France',
        kycStatus: 'approved',
        kycApprovedAt: new Date(),
        hashpackWalletConnected: true,
        isVerified: true
      }
    ]);

    console.log('🏛️  Seeding sample assets...');
    const sampleAssets = [
      {
        title: 'Sidi Bou Said Luxury Villa',
        description: 'Traditional Tunisian villa with Mediterranean sea view in Sidi Bou Said. Beautiful architecture with modern amenities.',
        ownerId: users[0]._id,
        ipfsCid: 'QmSidiBouSaid12345',
        availability_in_tunisia: true,
        valuation: 425000, // USD
        liquidityScore: 75,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5001',
          treasuryAccountId: '0.0.1001',
          createdTxHash: '0x123abc...',
          tokenized: true
        }
      },
      {
        title: 'Tunisian Olive Oil Export Fund',
        description: 'Investment in premium Tunisian olive oil production and export. Sfax and Mahdia regions, EU Organic certified.',
        ownerId: users[0]._id,
        ipfsCid: 'QmOliveOil67890',
        availability_in_tunisia: true,
        valuation: 1050000, // USD
        liquidityScore: 85,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5002',
          treasuryAccountId: '0.0.1001',
          createdTxHash: '0x456def...',
          tokenized: true
        }
      },
      {
        title: 'Carthage Heritage Art Collection',
        description: 'Curated collection of Tunisian contemporary and traditional art. Features works by Nja Mahdaoui and Ammar Farhat.',
        ownerId: users[0]._id,
        ipfsCid: 'QmCarthageArt11111',
        availability_in_tunisia: true,
        valuation: 360000, // USD
        liquidityScore: 60,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5003',
          treasuryAccountId: '0.0.1001',
          createdTxHash: '0x789ghi...',
          tokenized: true
        }
      },
      {
        title: 'La Marsa Beachfront Development',
        description: 'Modern residential and commercial complex in La Marsa coastal area. 120 apartments with completion in 2026.',
        ownerId: users[0]._id,
        ipfsCid: 'QmLaMarsa22222',
        availability_in_tunisia: true,
        valuation: 760000, // USD
        liquidityScore: 70,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5004',
          treasuryAccountId: '0.0.1001',
          createdTxHash: '0xabcdef...',
          tokenized: true
        }
      },
      {
        title: 'Dubai Marina Tower',
        description: 'Luxury residential tower in Dubai Marina with premium amenities. Built in 2020 with 85,000 sq ft total area.',
        ownerId: users[1]._id,
        ipfsCid: 'QmDubaiMarina33333',
        availability_in_tunisia: false,
        valuation: 2100000, // USD
        liquidityScore: 90,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5005',
          treasuryAccountId: '0.0.1002',
          createdTxHash: '0x111222...',
          tokenized: true
        }
      },
      {
        title: 'Global Gold Reserve Fund',
        description: 'Tokenized gold backed by vaults in Switzerland and London. 99.99% pure gold with quarterly audits.',
        ownerId: users[2]._id,
        ipfsCid: 'QmGoldReserve44444',
        availability_in_tunisia: false,
        valuation: 4080000, // USD
        liquidityScore: 95,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5006',
          treasuryAccountId: '0.0.1003',
          createdTxHash: '0x333444...',
          tokenized: true
        }
      },
      {
        title: 'European Bond Portfolio',
        description: 'Diversified EU government bonds with stable returns. 5-15 year maturity, 3.8% APY, AA+ rating.',
        ownerId: users[2]._id,
        ipfsCid: 'QmEUBonds55555',
        availability_in_tunisia: false,
        valuation: 2400000, // USD
        liquidityScore: 88,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5007',
          treasuryAccountId: '0.0.1003',
          createdTxHash: '0x555666...',
          tokenized: true
        }
      },
      {
        title: 'Silicon Valley Tech Fund',
        description: 'Tokenized venture capital fund investing in AI & Blockchain startups. Portfolio of 25 companies with 18% annualized returns.',
        ownerId: users[2]._id,
        ipfsCid: 'QmSVTech66666',
        availability_in_tunisia: false,
        valuation: 5075000, // USD
        liquidityScore: 92,
        verificationStatus: 'approved',
        verificationApprovedAt: new Date(),
        hedera: {
          tokenId: '0.0.5008',
          treasuryAccountId: '0.0.1003',
          createdTxHash: '0x777888...',
          tokenized: true
        }
      }
    ];

    const createdAssets = await Asset.insertMany(sampleAssets);

    console.log(`✅ Successfully seeded ${users.length} users and ${createdAssets.length} assets:`);
    console.log('\n📦 Users:');
    users.forEach(user => {
      console.log(`   - ${user.accountId} (${user.country})`);
    });
    console.log('\n🏛️  Assets:');
    createdAssets.forEach(asset => {
      console.log(`   - ${asset.title} (${asset.hedera.tokenId}) - $${asset.valuation.toLocaleString()}`);
    });

    console.log('\n✨ Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
