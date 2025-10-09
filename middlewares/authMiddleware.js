const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  console.log('🔐 AUTH CHECK - Path:', req.path);
  
  // ✅ Session based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('✅ Authenticated via session:', req.user._id);
    return next();
  }

  // ✅ JWT token based authentication
  const token = req.cookies?.token;
  
  if (!token) {
    console.log('❌ No token found - redirecting to auth');
    return res.redirect('/auth');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };

    console.log('✅ Authenticated via JWT:', req.user.email);
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    res.clearCookie('token');
    return res.redirect('/auth');
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.redirect('/auth');
    }
    next();
  };
};

module.exports = {
  isAuthenticated,
  roleMiddleware
};