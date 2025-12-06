import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

async function deleteAdminUser() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Delete admin user
    const result = await User.deleteOne({ email: 'admin@carthagegate.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Admin user deleted successfully!');
      console.log('\nNow run: node create_admin.js');
    } else {
      console.log('❌ No admin user found with email: admin@carthagegate.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting admin user:', error);
    process.exit(1);
  }
}

deleteAdminUser();
