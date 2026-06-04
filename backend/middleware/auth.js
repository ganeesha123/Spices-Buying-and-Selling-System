const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

// Check if user has required role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Check if user owns the resource or is support
const checkOwnership = (req, res, next) => {
  // Support agents can access all resources
  if (req.user.role === 'support') {
    return next();
  }

  // Check if user owns the resource (userId in params should match authenticated user)
  const resourceUserId = req.params.userId || req.body.userId;
  if (resourceUserId && resourceUserId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  checkOwnership
};
