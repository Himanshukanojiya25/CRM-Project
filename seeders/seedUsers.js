const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to database');

    await User.deleteMany();

    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const hashedUserPassword = await bcrypt.hash('user123', 12);

    // ✅ TEMPORARY: Without department field
    await User.create([
      { 
        name: 'Admin',
        email: 'admin@crm.com',
        password: hashedAdminPassword,
        role: 'admin'
      },
      {
        name: 'Employee', 
        email: 'emp@crm.com',
        password: hashedUserPassword,
        role: 'user'
      }
    ]);

    console.log('✅ Users seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedUsers();