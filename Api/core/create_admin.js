import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

async function createAdminUser() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@odici.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\nTo delete and recreate, run: node delete_admin.js');
      process.exit(0);
    }

    // Create admin user (password will be hashed by the pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@odici.com',
      password: 'admin123', // Will be hashed automatically by User model
      role: 'admin',
      kycStatus: 'approved',
      isVerified: true,
      hashpackWalletConnected: false,
      accountId: '0.0.admin' // Dummy accountId to avoid unique constraint
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log('Email: admin@odici.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nTo access the admin dashboard:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to http://localhost:3000/admin/kyc');
    console.log('   OR use the link in the navigation menu');
    console.log('\nYou can now review pending KYC submissions!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
