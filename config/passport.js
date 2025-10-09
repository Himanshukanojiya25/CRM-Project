const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ✅ Google Strategy (COMPLETE FIXED VERSION)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  scope: ['profile', 'email'],
  accessType: 'offline',
  prompt: 'consent'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔑 Google Profile:', profile);
    
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });
    
    if (!user) {
      // ✅ FIXED: Create user with proper address structure
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        password: '', // Social login users don't need password
        profilePhoto: profile.photos?.[0]?.value || '/images/default-avatar.png',
        profilePicture: {
          url: profile.photos?.[0]?.value || '/images/default-avatar.png',
          filename: '',
          originalName: '',
          uploadDate: new Date(),
          size: 0,
          mimeType: 'image/jpeg'
        },
        // ✅ FIXED: Proper address structure
        currentAddress: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        permanentAddress: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        // ✅ FIXED: Bank details structure
        bankDetails: {
          bankName: '',
          accountNumber: '',
          accountHolderName: '',
          ifscCode: '',
          branchName: '',
          accountType: 'Savings'
        },
        isEmailVerified: true,
        status: 'Active',
        role: 'user'
      });
      console.log('✅ New Google user created:', user.email);
    } else if (!user.googleId) {
      // Existing user, add Google ID
      user.googleId = profile.id;
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ Google ID added to existing user:', user.email);
    }
    
    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    return done(error, null);
  }
}));

// ✅ Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize user  
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;