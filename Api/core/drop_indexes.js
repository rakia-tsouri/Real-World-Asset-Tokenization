import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`Dropping indexes for ${collection.name}...`);
      await db.collection(collection.name).dropIndexes();
    }
    
    console.log('All indexes dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
