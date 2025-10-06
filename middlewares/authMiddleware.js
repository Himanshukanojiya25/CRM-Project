const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // ✅ Step 1: Session based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('✅ Authenticated via session:', req.user._id || req.user.id);

    // Ensure _id exists for Mongoose
    if (!req.user._id && req.user.id) {
      req.user._id = req.user.id;
    }

    return next();
  }

  // ✅ Step 2: JWT token based authentication
  const token = req.cookies?.token || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
                  ? req.headers.authorization.substring(7)
                  : null);

  if (!token) {
    console.log('❌ No authentication token found - Redirecting to login');
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };

    console.log('✅ Authenticated via JWT:', req.user._id);
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    
    // ✅ CLEAR THE INVALID TOKEN
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

// Role-based middleware
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  roleMiddleware
};