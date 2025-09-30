const User = require('../../models/User');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email designation');

    if (!user) {
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ Add default values if missing
    const userWithDefaults = {
      ...user.toObject(),
      employeeId: user.employeeId || 'Not assigned',
      designation: user.designation || 'Employee',
      profilePhoto: user.profilePhoto || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto || '/images/default-cover.jpg',
      employeeType: user.employeeType || 'Full-time',
      workLocation: user.workLocation || 'Office',
      shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
      employeeStatus: user.employeeStatus || 'Probation'
    };

    res.render('user/profile/view', {
      user: userWithDefaults,
      pageTitle: 'My Profile',
      layout: 'layouts/user-base'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).render('error', {
      message: 'Server Error',
      layout: 'layouts/user-base'
    });
  }
};

// Get edit profile page
exports.getEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email');

    if (!user) {
      return res.status(404).render('error', {
        message: 'User not found',
        layout: 'layouts/user-base'
      });
    }

    // ✅ Add default values if missing
    const userWithDefaults = {
      ...user.toObject(),
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      profilePhoto: user.profilePhoto || '/images/default-avatar.png',
      coverPhoto: user.coverPhoto || '/images/default-cover.jpg',
      employeeType: user.employeeType || 'Full-time',
      workLocation: user.workLocation || 'Office',
      shiftTimings: user.shiftTimings || '9:30 AM - 6:30 PM',
      employeeStatus: user.employeeStatus || 'Probation'
    };

    res.render('user/profile/edit', {
      user: userWithDefaults,
      pageTitle: 'Edit Profile',
      layout: 'layouts/user-base'
    });
  } catch (error) {
    console.error('Error fetching profile for edit:', error);
    res.status(500).render('error', {
      message: 'Server Error',
      layout: 'layouts/user-base'
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
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

    const skillsArray = skills ? skills.split(',').map(skill => skill.trim()) : [];

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
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
      },
      { new: true, runValidators: true }
    );

    req.flash('success', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Error updating profile');
    res.redirect('/user/profile/edit');
  }
};

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image');
      return res.redirect('/user/profile/edit');
    }

    // Delete old profile photo if exists
    const user = await User.findById(req.user._id);
    if (user.profilePhoto && user.profilePhoto !== '/images/default-avatar.png') {
      const oldPhotoPath = path.join(__dirname, '../../public', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: '/uploads/profiles/' + req.file.filename },
      { new: true }
    );

    req.flash('success', 'Profile photo updated successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('Error uploading photo:', error);
    req.flash('error', 'Error uploading photo');
    res.redirect('/user/profile/edit');
  }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select an image');
      return res.redirect('/user/profile/edit');
    }

    // Delete old cover photo if exists
    const user = await User.findById(req.user._id);
    if (user.coverPhoto && user.coverPhoto !== '/images/default-cover.jpg') {
      const oldPhotoPath = path.join(__dirname, '../../public', user.coverPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { coverPhoto: '/uploads/covers/' + req.file.filename },
      { new: true }
    );

    req.flash('success', 'Cover photo updated successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    req.flash('error', 'Error uploading cover photo');
    res.redirect('/user/profile/edit');
  }
};

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please select a document');
      return res.redirect('/user/profile/edit');
    }

    const { documentType } = req.body;
    const updateData = {};

    // Delete old document if exists
    const user = await User.findById(req.user._id);
    if (user[documentType] && user[documentType] !== '') {
      const oldDocPath = path.join(__dirname, '../../public', user[documentType]);
      if (fs.existsSync(oldDocPath)) {
        fs.unlinkSync(oldDocPath);
      }
    }

    updateData[documentType] = '/uploads/documents/' + req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    req.flash('success', 'Document uploaded successfully');
    res.redirect('/user/profile/edit');
  } catch (error) {
    console.error('Error uploading document:', error);
    req.flash('error', 'Error uploading document');
    res.redirect('/user/profile/edit');
  }
};