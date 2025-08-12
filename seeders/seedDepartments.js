const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
require('dotenv').config();

const seedDepartments = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ DB Connected');

    // 2. Clear old data (optional)
    await Department.deleteMany(); 

    // 3. Get admin user (manager ke liye)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('Admin user not found');

    // 4. Seed departments
    await Department.create([
      { name: 'HR', manager: admin._id },
      { name: 'IT', manager: admin._id },
      { name: 'Sales' } // Manager optional
    ]);

    console.log('✅ Departments seeded!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    mongoose.disconnect();
  }
};

seedDepartments();