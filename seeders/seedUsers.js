const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  await mongoose.connect(process.env.DB_URI);
  
  await User.deleteMany(); // Purane data clear

 await User.create([
  { 
    name: 'Admin',
    email: 'admin@crm.com',
    department: 'HR', // ✅ Add department
    role: 'admin'
  },
  {
    name: 'Employee',
    email: 'emp@crm.com',
    department: 'IT', // ✅ Add department
    role: 'user'
  }
]);

  console.log('✅ Users seeded!');
  mongoose.disconnect();
};

seedUsers();