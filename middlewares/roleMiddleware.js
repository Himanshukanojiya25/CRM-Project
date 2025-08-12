function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    } else {
      return res.status(403).send("Access Denied: Unauthorized Role");
    }
  };
}

module.exports = roleMiddleware; // ✅ Important
