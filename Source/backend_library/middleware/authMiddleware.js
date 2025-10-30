const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

// Middleware xác thực token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Yêu cầu token truy cập',
        error: 'MISSING_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token không hợp lệ - không tìm thấy người dùng',
        error: 'INVALID_USER' 
      });
    }
    
    req.user = user; // Lưu thông tin user vào request
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: 'Định dạng token không hợp lệ',
        error: 'INVALID_TOKEN' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Token đã hết hạn',
        error: 'EXPIRED_TOKEN' 
      });
    }
    
    return res.status(500).json({ 
      message: 'Xác minh token thất bại',
      error: 'TOKEN_ERROR' 
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Yêu cầu quyền quản trị viên',
      error: 'INSUFFICIENT_PERMISSIONS',
      userRole: req.user.role 
    });
  }
  next();
};

// Middleware kiểm tra quyền user (bao gồm vip) hoặc admin
const requireUser = (req, res, next) => {
  if (req.user.role !== 'user' && req.user.role !== 'vip' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Yêu cầu quyền người dùng',
      error: 'INSUFFICIENT_PERMISSIONS',
      userRole: req.user.role 
    });
  }
  next();
};

// Middleware kiểm tra quyền VIP hoặc Admin
const requireVipOrAdmin = (req, res, next) => {
  if (req.user.role !== 'vip' && req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Vui lòng nâng cấp tài khoản để sử dụng tính năng này',
      error: 'VIP_REQUIRED',
      userRole: req.user.role
    });
  }
  next();
};

// Middleware kiểm tra user chỉ có thể truy cập tài khoản của mình (hoặc admin có thể truy cập tất cả)
const requireOwnerOrAdmin = (req, res, next) => {
  const requestedUserId = parseInt(req.params.id);
  const currentUserId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isAdmin && currentUserId !== requestedUserId) {
    return res.status(403).json({ 
      message: 'Bạn chỉ có thể truy cập tài khoản của mình',
      error: 'ACCESS_DENIED' 
    });
  }
  next();
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  requireUser, 
  requireOwnerOrAdmin,
  requireVipOrAdmin
};
