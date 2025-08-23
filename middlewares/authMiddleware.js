const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  // ✅ Check if already authenticated via session
  if (req.isAuthenticated()) {
    console.log('✅ Authenticated via session:', req.user._id);
    return next();
  }

  // ✅ Check JWT token
  const token = req.cookies?.token || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                  ? req.headers.authorization.substring(7) 
                  : null);

  if (!token) {
    console.log('❌ No authentication token found');
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Please login first'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };
    
    console.log('✅ Authenticated via JWT:', req.user.id);
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions"
      });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  roleMiddleware
};