// ----------------------------
// seeders/seed.js
// ----------------------------

// 1. Required Modules Import
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');

// 2. Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/crmdb')
  .then(() => console.log('✅ MongoDB Connected for Seeding!'))
  .catch(err => console.error('❌ Connection Error:', err));

// 3. Seed Data Function
const seedDB = async () => {
  try {
    // 4. Purana Data Delete Karna (Optional)
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log('🗑️ Old Data Cleared!');

    // 5. Password Hashing
    const adminPassword = await bcrypt.hash("123456", 12);
    const hrPassword = await bcrypt.hash("654321", 12);
    const devPassword = await bcrypt.hash("devpass", 12);

    // 6. Multiple Departments Create Karein
    const itDept = await Department.create({ 
      name: "IT", 
      description: "Technology Team" 
    });

    const hrDept = await Department.create({
      name: "HR",
      description: "Human Resources"
    });

    // 7. Multiple Users Create Karein
    await User.create([
      {
        name: "Admin",
        email: "admin@test.com",
        password: adminPassword,
        department: itDept._id,
        role: "admin"
      },
      {
        name: "HR Head",
        email: "hr@test.com",
        password: hrPassword,
        department: hrDept._id,
        role: "hr"  
      },
      {
        name: "Developer",
        email: "dev@test.com",
        password: devPassword,
        department: itDept._id,
        role: "developer",
        age: 25,
        phone: "9876543210"
      }
    ]);

    console.log('🌱 Test Data Added:');
    console.log('- 2 Departments (IT, HR)');
    console.log('- 3 Users (Admin, HR Head, Developer)');
    
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    throw err; // Re-throw for .catch() block
  } finally {
    await mongoose.connection.close();
  }
};

// 8. Seed Function Call with proper exit handling
seedDB()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));