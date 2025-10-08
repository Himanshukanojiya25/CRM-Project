const User = require('../../models/User');
const fs = require('fs');
const path = require('path');

// Get user profile - ENHANCED VERSION
exports.getProfile = async (req, res) => {
  try {
    console.log('🔄 Fetching profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email designation')
      .lean();

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ ENHANCED: Add default values with better handling
    const userWithDefaults = {
      ...user,
      
      // Basic Information
      employeeId: user.employeeId || 'Not assigned',
      designation: user.designation || 'Employee',
      profilePhoto: user.profilePhoto || user.profilePicture?.url || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto?.url || '/images/default-cover.jpg',
      
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
      
      // ✅ FIXED: Calculate leaves remaining
      leavesRemaining: (user.totalLeaves || 12) - (user.leavesTaken || 0),
      
      // Personal Information Defaults
      phone: user.phone || '',
      personalEmail: user.personalEmail || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      
      // ✅ FIXED: Address handling
      currentAddress: user.currentAddressSimple || (user.currentAddress ? 
        `${user.currentAddress.street}, ${user.currentAddress.city}, ${user.currentAddress.state} - ${user.currentAddress.pincode}` : ''),
      permanentAddress: user.permanentAddressSimple || (user.permanentAddress ? 
        `${user.permanentAddress.street}, ${user.permanentAddress.city}, ${user.permanentAddress.state} - ${user.permanentAddress.pincode}` : ''),
      
      // Emergency Contact Defaults
      emergencyContactName: user.emergencyContactName || user.emergencyContact?.name || '',
      emergencyContactNumber: user.emergencyContactNumber || user.emergencyContact?.phone || '',
      
      // Bank Details Defaults
      bankName: user.bankName || user.bankDetails?.bankName || '',
      accountNumber: user.accountNumber || user.bankDetails?.accountNumber || '',
      ifscCode: user.ifscCode || user.bankDetails?.ifscCode || '',
      branchName: user.branchName || user.bankDetails?.branchName || '',
      accountType: user.accountType || user.bankDetails?.accountType || 'Savings',
      
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
      
      // ✅ FIXED: Skills handling - multiple formats
      skills: user.skillsSimple || (user.skills ? user.skills.map(skill => skill.name) : []),
      
      // Social Media Defaults
      linkedinProfile: user.linkedinProfile || user.socialLinks?.linkedin || '',
      twitterProfile: user.twitterProfile || user.socialLinks?.twitter || '',
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

    // ✅ ENHANCED: Calculate profile completion percentage
    let completedFields = 0;
    const totalFields = 18; // Important fields
    
    const importantFields = [
      user.name, 
      user.email, 
      user.phone, 
      user.designation, 
      user.department, 
      user.employeeId, 
      user.dob, 
      user.gender,
      user.personalEmail, 
      user.currentAddressSimple || user.currentAddress?.street,
      user.bankName || user.bankDetails?.bankName,
      user.accountNumber || user.bankDetails?.accountNumber,
      user.qualification,
      user.university,
      user.skillsSimple?.length > 0 || user.skills?.length > 0,
      user.profilePhoto || user.profilePicture?.url,
      user.emergencyContactName || user.emergencyContact?.name,
      user.experienceYears > 0
    ];
    
    completedFields = importantFields.filter(field => {
      if (typeof field === 'boolean') return field;
      if (Array.isArray(field)) return field.length > 0;
      return field && field !== '' && field !== 'Not assigned';
    }).length;
    
    userWithDefaults.profileCompletion = Math.round((completedFields / totalFields) * 100);

    console.log('✅ Profile data prepared successfully for:', user.name);
    console.log('📊 Profile completion:', userWithDefaults.profileCompletion + '%');
    console.log('🎯 Skills found:', userWithDefaults.skills);

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

// Get edit profile page - ENHANCED VERSION
exports.getEditProfile = async (req, res) => {
  try {
    console.log('🔄 Fetching edit profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email')
      .lean();

    if (!user) {
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ ENHANCED: Add default values with better compatibility
    const userWithDefaults = {
      ...user,
      // Basic Information
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      profilePhoto: user.profilePhoto || user.profilePicture?.url || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto?.url || '/images/default-cover.jpg',
      
      // Professional Information
      employeeType: user.employeeType || 'Full-time',
      workLocation: user.workLocation || 'Office',
      shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
      employeeStatus: user.employeeStatus || 'Probation',
      team: user.team || '',
      
      // Personal Information
      phone: user.phone || '',
      personalEmail: user.personalEmail || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      
      // ✅ FIXED: Address handling for edit form
      currentAddress: user.currentAddressSimple || (user.currentAddress ? user.currentAddress.street : ''),
      permanentAddress: user.permanentAddressSimple || (user.permanentAddress ? user.permanentAddress.street : ''),
      
      // Emergency Contact
      emergencyContactName: user.emergencyContactName || user.emergencyContact?.name || '',
      emergencyContactNumber: user.emergencyContactNumber || user.emergencyContact?.phone || '',
      
      // Bank Details
      bankName: user.bankName || user.bankDetails?.bankName || '',
      accountNumber: user.accountNumber || user.bankDetails?.accountNumber || '',
      ifscCode: user.ifscCode || user.bankDetails?.ifscCode || '',
      branchName: user.branchName || user.bankDetails?.branchName || '',
      accountType: user.accountType || user.bankDetails?.accountType || 'Savings',
      
      // Government IDs
      aadharNumber: user.aadharNumber || '',
      panNumber: user.panNumber || '',
      passportNumber: user.passportNumber || '',
      drivingLicense: user.drivingLicense || '',
      uanNumber: user.uanNumber || '',
      pfNumber: user.pfNumber || '',
      esicNumber: user.esicNumber || '',
      
      // Education
      qualification: user.qualification || '',
      university: user.university || '',
      yearOfPassing: user.yearOfPassing || '',
      percentage: user.percentage || '',
      
      // Experience
      previousCompany: user.previousCompany || '',
      previousDesignation: user.previousDesignation || '',
      experienceYears: user.experienceYears || 0,
      
      // ✅ FIXED: Skills handling for edit form
      skillsSimple: user.skillsSimple || (user.skills ? user.skills.map(skill => skill.name) : []),
      skills: user.skillsSimple || (user.skills ? user.skills.map(skill => skill.name) : []),
      
      // Social Media
      linkedinProfile: user.linkedinProfile || user.socialLinks?.linkedin || '',
      twitterProfile: user.twitterProfile || user.socialLinks?.twitter || '',
    };

    console.log('✅ Edit profile data prepared for:', user.name);
    console.log('🎯 Skills for edit:', userWithDefaults.skills);

    // Check for success/error messages from previous requests
    const success = req.flash('success');
    const error = req.flash('error');

    res.render('user/profile/edit', {
      user: userWithDefaults,
      pageTitle: 'Edit Profile',
      layout: 'layouts/user-base',
      success: success.length > 0 ? success[0] : null,
      error: error.length > 0 ? error[0] : null
    });
  } catch (error) {
    console.error('❌ Error fetching profile for edit:', error);
    res.status(500).render('error', {
      message: 'Server Error: ' + error.message,
      layout: 'layouts/user-base'
    });
  }
};

// Update profile - COMPLETELY FIXED VERSION
exports.updateProfile = async (req, res) => {
  try {
    console.log('🔄 Updating profile for user:', req.user._id);
    console.log('📝 Request body:', req.body);
    
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

    // ✅ FIXED: Skills processing - handle multiple formats
    let skillsArray = [];
    if (skills) {
      if (typeof skills === 'string') {
        // Comma-separated string
        skillsArray = skills.split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== '');
      } else if (Array.isArray(skills)) {
        // Already an array
        skillsArray = skills.map(skill => skill.trim()).filter(skill => skill !== '');
      }
    }
    console.log('🎯 Processed skills:', skillsArray);

    // ✅ ENHANCED: Prepare update data with proper field mapping
    const updateData = {
      name,
      phone,
      dob: dob || null,
      gender,
      personalEmail,
      emergencyContactNumber,
      emergencyContactName,
      bloodGroup,
      currentAddressSimple: currentAddress,
      permanentAddressSimple: permanentAddress,
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
      skillsSimple: skillsArray, // Store in simple array format
      employeeId,
      designation,
      employeeType,
      workLocation,
      employeeStatus,
      
      // Also update complex objects for backward compatibility
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactNumber
      },
      currentAddress: {
        street: currentAddress || ''
      },
      permanentAddress: {
        street: permanentAddress || ''
      },
      bankDetails: {
        bankName,
        accountNumber,
        ifscCode,
        branchName,
        accountType
      },
      socialLinks: {
        linkedin: linkedinProfile,
        twitter: twitterProfile
      }
    };

    // Remove empty fields to avoid overwriting with empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Remove empty nested objects
    if (updateData.emergencyContact && (!updateData.emergencyContact.name && !updateData.emergencyContact.phone)) {
      delete updateData.emergencyContact;
    }
    if (updateData.bankDetails && (!updateData.bankDetails.bankName && !updateData.bankDetails.accountNumber)) {
      delete updateData.bankDetails;
    }

    console.log('💾 Final update data:', updateData);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Profile updated successfully for:', updatedUser.name);
    console.log('🎯 Updated skills:', updatedUser.skillsSimple);

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    
    let errorMessage = 'Error updating profile';
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate field value entered';
    } else {
      errorMessage = 'Error updating profile: ' + error.message;
    }
    
    req.flash('error', errorMessage);
    res.redirect('/user/profile/edit');
  }
};

// Upload profile photo - ENHANCED VERSION
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image file');
      return res.redirect('/user/profile/edit');
    }

    console.log('🔄 Uploading profile photo for user:', req.user._id);
    console.log('📁 File details:', req.file);

    // Delete old profile photo if exists
    const user = await User.findById(req.user._id);
    const oldPhoto = user.profilePhoto || user.profilePicture?.url;
    
    if (oldPhoto && oldPhoto !== '/images/default-avatar.png') {
      const oldPhotoPath = path.join(__dirname, '../../public', oldPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log('🗑️ Deleted old profile photo:', oldPhoto);
      }
    }

    const photoPath = '/uploads/profiles/' + req.file.filename;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        profilePhoto: photoPath,
        profilePicture: {
          url: photoPath,
          filename: req.file.filename,
          originalName: req.file.originalname,
          uploadDate: new Date(),
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      },
      { new: true }
    );

    console.log('✅ Profile photo updated for:', updatedUser.name);

    req.flash('success', 'Profile photo updated successfully!');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('❌ Error uploading profile photo:', error);
    req.flash('error', 'Error uploading photo: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};

// Upload cover photo - ENHANCED VERSION
exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image file');
      return res.redirect('/user/profile/edit');
    }

    console.log('🔄 Uploading cover photo for user:', req.user._id);

    // Delete old cover photo if exists
    const user = await User.findById(req.user._id);
    const oldCover = user.coverPhoto?.url;
    
    if (oldCover && oldCover !== '/images/default-cover.jpg') {
      const oldCoverPath = path.join(__dirname, '../../public', oldCover);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
        console.log('🗑️ Deleted old cover photo:', oldCover);
      }
    }

    const coverPath = '/uploads/covers/' + req.file.filename;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        coverPhoto: {
          url: coverPath,
          filename: req.file.filename,
          originalName: req.file.originalname
        }
      },
      { new: true }
    );

    console.log('✅ Cover photo updated for:', updatedUser.name);

    req.flash('success', 'Cover photo updated successfully!');
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
    const documentPath = '/uploads/documents/' + req.file.filename;

    // Map document types to field names
    const documentFieldMap = {
      'aadharDocument': 'documents.aadharFront',
      'panDocument': 'documents.panCard',
      'resumeDocument': 'documents.resume',
      'offerLetterDocument': 'documents.offerLetter',
      'experienceLetterDocument': 'documents.experienceLetter'
    };

    const fieldName = documentFieldMap[documentType];
    if (!fieldName) {
      req.flash('error', 'Invalid document type');
      return res.redirect('/user/profile/edit');
    }

    // Delete old document if exists
    const user = await User.findById(req.user._id);
    const oldDoc = user.documents?.[documentType.replace('Document', '')];
    
    if (oldDoc && oldDoc !== '') {
      const oldDocPath = path.join(__dirname, '../../public', oldDoc);
      if (fs.existsSync(oldDocPath)) {
        fs.unlinkSync(oldDocPath);
        console.log('🗑️ Deleted old document:', oldDoc);
      }
    }

    // Set the document path
    updateData[fieldName] = documentPath;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    console.log('✅ Document uploaded successfully for:', updatedUser.name);

    req.flash('success', 'Document uploaded successfully!');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    req.flash('error', 'Error uploading document: ' + error.message);
    res.redirect('/user/profile/edit');
  }
};

// Additional utility function to fix existing user data
exports.fixUserData = async (req, res) => {
  try {
    const users = await User.find();
    let fixedCount = 0;

    for (const user of users) {
      const updateData = {};

      // Fix profile photo
      if (user.profilePicture?.url && !user.profilePhoto) {
        updateData.profilePhoto = user.profilePicture.url;
      }

      // Fix skills
      if (user.skills?.length > 0 && (!user.skillsSimple || user.skillsSimple.length === 0)) {
        updateData.skillsSimple = user.skills.map(skill => skill.name);
      }

      // Fix addresses
      if (user.currentAddress?.street && !user.currentAddressSimple) {
        updateData.currentAddressSimple = user.currentAddress.street;
      }

      if (user.permanentAddress?.street && !user.permanentAddressSimple) {
        updateData.permanentAddressSimple = user.permanentAddress.street;
      }

      // Fix emergency contact
      if (user.emergencyContact?.name && !user.emergencyContactName) {
        updateData.emergencyContactName = user.emergencyContact.name;
        updateData.emergencyContactNumber = user.emergencyContact.phone;
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(user._id, updateData);
        fixedCount++;
        console.log(`✅ Fixed data for user: ${user.name}`);
      }
    }

    res.json({
      success: true,
      message: `Fixed data for ${fixedCount} users`,
      fixedCount
    });
  } catch (error) {
    console.error('❌ Error fixing user data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};