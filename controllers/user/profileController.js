const User = require('../../models/User');
const fs = require('fs');
const path = require('path');

// Get user profile - COMPLETE FIXED VERSION
exports.getProfile = async (req, res) => {
  try {
    console.log('🔄 Fetching profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email designation')
      .lean(); // ✅ IMPORTANT: Use lean() for plain objects

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ Add default values if missing - COMPLETE VERSION
    const userWithDefaults = {
      ...user,
      // Basic Information
      employeeId: user.employeeId || 'Not assigned',
      designation: user.designation || 'Employee',
      profilePhoto: user.profilePhoto || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto || '/images/default-cover.jpg',
      
      // Professional Information
      employeeType: user.employeeType || 'Full-time',
      workLocation: user.workLocation || 'Office',
      shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
      employeeStatus: user.employeeStatus || 'Probation',
      team: user.team || 'Not assigned',
      
      // Performance Metrics
      totalLeaves: user.totalLeaves || 12,
      leavesTaken: user.leavesTaken || 0,
      attendancePercentage: user.attendancePercentage || 100,
      performanceRating: user.performanceRating || 0,
      
      // ✅ MANUALLY ADD VIRTUAL FIELDS
      leavesRemaining: (user.totalLeaves || 12) - (user.leavesTaken || 0),
      
      // Personal Information Defaults
      phone: user.phone || '',
      personalEmail: user.personalEmail || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      currentAddress: user.currentAddress || '',
      permanentAddress: user.permanentAddress || '',
      
      // Emergency Contact Defaults
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactNumber: user.emergencyContactNumber || '',
      
      // Bank Details Defaults
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      ifscCode: user.ifscCode || '',
      branchName: user.branchName || '',
      accountType: user.accountType || 'Savings',
      
      // Government IDs Defaults
      aadharNumber: user.aadharNumber || '',
      panNumber: user.panNumber || '',
      passportNumber: user.passportNumber || '',
      drivingLicense: user.drivingLicense || '',
      uanNumber: user.uanNumber || '',
      pfNumber: user.pfNumber || '',
      esicNumber: user.esicNumber || '',
      
      // Education Defaults
      qualification: user.qualification || '',
      university: user.university || '',
      yearOfPassing: user.yearOfPassing || null,
      percentage: user.percentage || '',
      
      // Experience Defaults
      previousCompany: user.previousCompany || '',
      previousDesignation: user.previousDesignation || '',
      experienceYears: user.experienceYears || 0,
      
      // Skills Defaults
      skills: user.skills || [],
      
      // Social Media Defaults
      linkedinProfile: user.linkedinProfile || '',
      twitterProfile: user.twitterProfile || '',
      
      // Work Preferences Defaults
      preferredShift: user.preferredShift || '9:30 AM - 6:30 PM',
      workMode: user.workMode || 'Office'
    };

    // ✅ Calculate age manually
    if (user.dob) {
      const birthDate = new Date(user.dob);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
      }
      userWithDefaults.age = age;
    } else {
      userWithDefaults.age = null;
    }

    // ✅ Calculate total experience manually
    if (user.joiningDate) {
      const joinDate = new Date(user.joiningDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - joinDate);
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      userWithDefaults.totalExperience = `${diffYears} years ${diffMonths} months`;
    } else {
      userWithDefaults.totalExperience = '0 years';
    }

    // ✅ Calculate profile completion percentage
    let completedFields = 0;
    const totalFields = 15; // Adjust based on important fields
    
    // Check important fields
    const importantFields = [
      user.name, user.email, user.phone, user.designation, 
      user.department, user.employeeId, user.dob, user.gender,
      user.currentAddress, user.personalEmail, user.bankName,
      user.accountNumber, user.qualification, user.skills?.length > 0,
      user.profilePhoto && user.profilePhoto !== '/images/default-avatar.png'
    ];
    
    completedFields = importantFields.filter(field => {
      if (typeof field === 'boolean') return field;
      return field && field !== '' && field !== 'Not assigned';
    }).length;
    
    userWithDefaults.profileCompletion = Math.round((completedFields / totalFields) * 100);

    console.log('✅ Profile data prepared successfully for:', user.name);
    console.log('📊 Profile completion:', userWithDefaults.profileCompletion + '%');

    res.render('user/profile/view', {
      user: userWithDefaults,
      pageTitle: 'My Profile',
      layout: 'layouts/user-base'
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).render('error', {
      message: 'Server Error: ' + error.message,
      layout: 'layouts/user-base'
    });
  }
};

// Get edit profile page - FIXED VERSION
exports.getEditProfile = async (req, res) => {
  try {
    console.log('🔄 Fetching edit profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email')
      .lean(); // ✅ Use lean() for consistency

    if (!user) {
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ Add default values if missing - COMPLETE VERSION
    const userWithDefaults = {
      ...user,
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      profilePhoto: user.profilePhoto || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto || '/images/default-cover.jpg',
      employeeType: user.employeeType || 'Full-time',
      workLocation: user.workLocation || 'Office',
      shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
      employeeStatus: user.employeeStatus || 'Probation',
      team: user.team || '',
      phone: user.phone || '',
      personalEmail: user.personalEmail || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      currentAddress: user.currentAddress || '',
      permanentAddress: user.permanentAddress || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactNumber: user.emergencyContactNumber || '',
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      ifscCode: user.ifscCode || '',
      branchName: user.branchName || '',
      accountType: user.accountType || 'Savings',
      aadharNumber: user.aadharNumber || '',
      panNumber: user.panNumber || '',
      passportNumber: user.passportNumber || '',
      drivingLicense: user.drivingLicense || '',
      uanNumber: user.uanNumber || '',
      pfNumber: user.pfNumber || '',
      esicNumber: user.esicNumber || '',
      qualification: user.qualification || '',
      university: user.university || '',
      yearOfPassing: user.yearOfPassing || '',
      percentage: user.percentage || '',
      previousCompany: user.previousCompany || '',
      previousDesignation: user.previousDesignation || '',
      experienceYears: user.experienceYears || 0,
      skills: user.skills || [],
      linkedinProfile: user.linkedinProfile || '',
      twitterProfile: user.twitterProfile || '',
      preferredShift: user.preferredShift || '9:30 AM - 6:30 PM',
      workMode: user.workMode || 'Office'
    };

    console.log('✅ Edit profile data prepared for:', user.name);

    res.render('user/profile/edit', {
      user: userWithDefaults,
      pageTitle: 'Edit Profile',
      layout: 'layouts/user-base'
    });
  } catch (error) {
    console.error('❌ Error fetching profile for edit:', error);
    res.status(500).render('error', {
      message: 'Server Error: ' + error.message,
      layout: 'layouts/user-base'
    });
  }
};

// Update profile - ENHANCED VERSION
exports.updateProfile = async (req, res) => {
  try {
    console.log('🔄 Updating profile for user:', req.user._id);
    
    const {
      name, phone, dob, gender, personalEmail,
      emergencyContactNumber, emergencyContactName,
      bloodGroup, currentAddress, permanentAddress,
      shiftTimings, team, alternatePhone, personalPhone,
      linkedinProfile, twitterProfile, preferredShift,
      workMode, aadharNumber, panNumber, passportNumber,
      drivingLicense, uanNumber, pfNumber, esicNumber,
      bankName, accountNumber, ifscCode, branchName,
      accountType, qualification, university, yearOfPassing,
      percentage, previousCompany, previousDesignation,
      experienceYears, skills, employeeId, designation,
      employeeType, workLocation, employeeStatus
    } = req.body;

    // Process skills array
    const skillsArray = skills ? skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '') : [];

    // Prepare update data
    const updateData = {
      name,
      phone,
      dob: dob || null,
      gender,
      personalEmail,
      emergencyContactNumber,
      emergencyContactName,
      bloodGroup,
      currentAddress,
      permanentAddress,
      shiftTimings,
      team,
      alternatePhone,
      personalPhone,
      linkedinProfile,
      twitterProfile,
      preferredShift,
      workMode,
      aadharNumber,
      panNumber,
      passportNumber,
      drivingLicense,
      uanNumber,
      pfNumber,
      esicNumber,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      accountType,
      qualification,
      university,
      yearOfPassing: yearOfPassing || null,
      percentage,
      previousCompany,
      previousDesignation,
      experienceYears: experienceYears || 0,
      skills: skillsArray,
      employeeId,
      designation,
      employeeType,
      workLocation,
      employeeStatus
    };

    // Remove empty fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Profile updated successfully for:', updatedUser.name);

    req.flash('success', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    req.flash('error', 'Error updating profile: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};

// Upload profile photo - ENHANCED VERSION
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image');
      return res.redirect('/user/profile/edit');
    }

    console.log('🔄 Uploading profile photo for user:', req.user._id);

    // Delete old profile photo if exists
    const user = await User.findById(req.user._id);
    if (user.profilePhoto && user.profilePhoto !== '/images/default-avatar.png') {
      const oldPhotoPath = path.join(__dirname, '../../public', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log('🗑️ Deleted old profile photo:', user.profilePhoto);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: '/uploads/profiles/' + req.file.filename },
      { new: true }
    );

    console.log('✅ Profile photo updated for:', updatedUser.name);

    req.flash('success', 'Profile photo updated successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    req.flash('error', 'Error uploading photo: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};

// Upload cover photo - ENHANCED VERSION
exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image');
      return res.redirect('/user/profile/edit');
    }

    console.log('🔄 Uploading cover photo for user:', req.user._id);

    // Delete old cover photo if exists
    const user = await User.findById(req.user._id);
    if (user.coverPhoto && user.coverPhoto !== '/images/default-cover.jpg') {
      const oldPhotoPath = path.join(__dirname, '../../public', user.coverPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log('🗑️ Deleted old cover photo:', user.coverPhoto);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { coverPhoto: '/uploads/covers/' + req.file.filename },
      { new: true }
    );

    console.log('✅ Cover photo updated for:', updatedUser.name);

    req.flash('success', 'Cover photo updated successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('❌ Error uploading cover photo:', error);
    req.flash('error', 'Error uploading cover photo: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};

// Upload document - ENHANCED VERSION
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select a document');
      return res.redirect('/user/profile/edit');
    }

    const { documentType } = req.body;
    
    if (!documentType) {
      req.flash('error', 'Document type is required');
      return res.redirect('/user/profile/edit');
    }

    console.log('🔄 Uploading document for user:', req.user._id, 'Type:', documentType);

    const updateData = {};

    // Delete old document if exists
    const user = await User.findById(req.user._id);
    if (user[documentType] && user[documentType] !== '') {
      const oldDocPath = path.join(__dirname, '../../public', user[documentType]);
      if (fs.existsSync(oldDocPath)) {
        fs.unlinkSync(oldDocPath);
        console.log('🗑️ Deleted old document:', user[documentType]);
      }
    }

    updateData[documentType] = '/uploads/documents/' + req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    console.log('✅ Document uploaded successfully for:', updatedUser.name);

    req.flash('success', 'Document uploaded successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    req.flash('error', 'Error uploading document: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};