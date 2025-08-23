const User = require('../../models/User');
const Department = require('../../models/Department');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { sendWelcomeEmail } = require('../../utils/emailSender'); // ✅ ADD THIS LINE

exports.getEmployeePage = async (req, res) => {
  try {
    const users = await User.find().populate('department', 'name');
    
    res.render('admin/employees/list', {
      pageTitle: 'Employees Management - CRM',
      layout: 'layouts/admin-base',
      users: users
    });
  } catch (error) {
    console.error('Employee page error:', error);
    res.status(500).send('Error loading employees page');
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, phone, departmentName, role, status, joiningDate, password } = req.body;
    
    let department = await Department.findOne({ name: departmentName });
    if (!department) {
      department = new Department({ name: departmentName });
      await department.save();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newEmployee = new User({
      name,
      email,
      phone,
      department: department._id,
      role: role.toLowerCase(),
      status,
      joiningDate: new Date(joiningDate),
      password: hashedPassword
    });

    await newEmployee.save();

    // ✅ ADD THIS CODE - Welcome email send karega
    try {
      await sendWelcomeEmail(email, name, password);
      console.log('✅ Welcome email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed (but employee created):', emailError);
    }

    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    console.log('🗑️ Deleting user ID:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ Invalid ID format');
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User deleted successfully:', deletedUser._id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};