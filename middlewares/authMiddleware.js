// const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  // 🔹 TEMPORARY BYPASS FOR TESTING
  req.user = { id: 'dummyId', role: 'admin', name: 'Test Admin' };
  return next();

  /*
  if (req.user) return next();

  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Access Denied: No Token Provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role, // Make sure role is included in the token
    };
    next();
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
  */
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this resource.",
      });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  roleMiddleware,
};
