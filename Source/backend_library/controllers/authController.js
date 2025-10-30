const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const { sendWelcomeEmail } = require('../utils/emailService');
const { CacheService } = require('../config/redis');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // Kiểm tra người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn('Cố gắng đăng ký với email đã tồn tại', { email });
      return ApiResponse.badRequest(res, 'Email đã được sử dụng');
    }
    
    // Kiểm tra giới hạn số lượng role khi tạo tài khoản
    if (role === 'admin' || role === 'vip') {
      const roleCount = await User.count({ where: { role } });
      
      if (role === 'admin' && roleCount >= 3) {
        return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 3 Admin');
      }
      if (role === 'vip' && roleCount >= 5) {
        return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 5 người dùng trả phí');
      }
    }

    // Nếu người dùng muốn đăng ký role 'admin' thì cần cung cấp mã nội bộ hợp lệ
    if (role === 'admin') {
      const internalCodeProvided = req.body.internalCode || '';
      // Try to read stored code from settings; fall back to default '1836'
      const Setting = require('../models/setting');
      let stored = await Setting.findByPk('internalAdminCode');
      const storedCode = stored ? (stored.value || null) : null;
      const { compareInternalCode } = require('../utils/internalCode');

      const ok = await compareInternalCode(internalCodeProvided, storedCode);
      if (!ok) {
        return ApiResponse.forbidden(res, 'Mã nội bộ không hợp lệ để đăng ký vai trò Quản trị viên');
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    logger.info('Đăng ký người dùng thành công', { userId: user.id, email: user.email });
    
    // Xóa cache danh sách người dùng và thống kê
    await CacheService.delPattern('users:list:*');
    await CacheService.del('users:stats');
    
    // Gửi email chào mừng (không chặn)
    sendWelcomeEmail(user).catch(err => {
      logger.error('Gửi email chào mừng thất bại', { userId: user.id, error: err.message });
    });
    
    return ApiResponse.created(res, {
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    }, 'Đăng ký thành công');
  } catch (error) {
    logger.logError(error, { context: 'register', body: req.body });
    return ApiResponse.serverError(res, 'Đăng ký thất bại');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn('Cố gắng đăng nhập với email không tồn tại', { email });
      return ApiResponse.unauthorized(res, 'Email hoặc mật khẩu không đúng');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn('Cố gắng đăng nhập với mật khẩu sai', { email });
      return ApiResponse.unauthorized(res, 'Email hoặc mật khẩu không đúng');
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    logger.info('Đăng nhập người dùng thành công', { userId: user.id, email: user.email });
    
    return ApiResponse.success(res, {
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    }, 'Đăng nhập thành công');
  } catch (error) {
    logger.logError(error, { context: 'login', email: req.body.email });
    return ApiResponse.serverError(res, 'Đăng nhập thất bại');
  }
};

module.exports = { register, login };
