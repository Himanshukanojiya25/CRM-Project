const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ✅ Database connection
const connectDB = require('./config/db');

// ✅ User model
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    console.log('🚀 Starting admin user creation...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@crm.com' },
        { role: 'admin' }
      ] 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👨‍💼 Role: ${existingAdmin.role}`);
      console.log(`   🆔 ID: ${existingAdmin._id}`);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin',
      status: 'Active',
      isEmailVerified: true,
      employeeId: 'ADMIN001',
      designation: 'System Administrator',
      profilePhoto: '/images/default-avatar.png',
      phone: '+91-9876543210',
      department: null,
      joiningDate: new Date()
    });

    await adminUser.save();
    console.log('🎉 Admin user created successfully!');
    console.log('================================');
    console.log('📧 Email: admin@crm.com');
    console.log('🔑 Password: admin123');
    console.log('👨‍💼 Role: admin');
    console.log('================================');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdminUser();