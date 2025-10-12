const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ✅ LOCAL STRATEGY FOR NORMAL LOGIN (NEW ADDED)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    console.log('🔐 Local Strategy Attempt:', email);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.password) {
      console.log('❌ No password set for user:', email);
      return done(null, false, { message: 'Please use Google/GitHub login or reset password' });
    }

    if (user.status !== 'Active') {
      console.log('❌ User not active:', user.status);
      return done(null, false, { message: 'Account is not active. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return done(null, false, { message: 'Invalid email or password' });
    }

    console.log('✅ Local login successful:', user.email);
    return done(null, user);
  } catch (error) {
    console.error('❌ Local strategy error:', error);
    return done(error);
  }
}));

// ✅ GOOGLE STRATEGY (EXISTING - KEEP)
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
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        password: '',
        profilePhoto: profile.photos?.[0]?.value || '/images/default-avatar.png',
        profilePicture: {
          url: profile.photos?.[0]?.value || '/images/default-avatar.png',
          filename: '',
          originalName: '',
          uploadDate: new Date(),
          size: 0,
          mimeType: 'image/jpeg'
        },
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

// ✅ GITHUB STRATEGY (EXISTING - KEEP)
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback",
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔑 GitHub Profile:', profile);
    
    let email = profile.emails?.[0]?.value || 
                profile._json?.email || 
                `${profile.username}@github.com`;
    
    let user = await User.findOne({ 
      $or: [
        { githubId: profile.id },
        { email: email }
      ]
    });
    
    if (!user) {
      user = await User.create({
        githubId: profile.id,
        name: profile.displayName || profile.username,
        email: email,
        password: '',
        profilePhoto: profile.photos?.[0]?.value || '/images/default-avatar.png',
        profilePicture: {
          url: profile.photos?.[0]?.value || '/images/default-avatar.png',
          filename: '',
          originalName: '',
          uploadDate: new Date(),
          size: 0,
          mimeType: 'image/jpeg'
        },
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
      console.log('✅ New GitHub user created:', user.email);
    } else if (!user.githubId) {
      user.githubId = profile.id;
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ GitHub ID added to existing user:', user.email);
    }
    
    return done(null, user);
  } catch (error) {
    console.error('❌ GitHub OAuth Error:', error);
    return done(error, null);
  }
}));

// ✅ SERIALIZE USER
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ DESERIALIZE USER  
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;