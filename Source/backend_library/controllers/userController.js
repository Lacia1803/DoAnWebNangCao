const User = require('../models/user');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');
const { CacheService } = require('../config/redis');
const bcrypt = require('bcryptjs');
const Setting = require('../models/setting');
const SettingAudit = require('../models/settingAudit');
const { hashInternalCode } = require('../utils/internalCode');

/**
 * Tạo người dùng mới (Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Kiểm tra giới hạn role count nếu tạo admin hoặc vip
    if (role === 'admin' || role === 'vip') {
      const roleCount = await User.count({ where: { role } });
      if (role === 'admin' && roleCount >= 3) {
        return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 3 Admin trong hệ thống');
      }
      if (role === 'vip' && roleCount >= 5) {
        return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 5 người dùng trả phí trong hệ thống');
      }
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return ApiResponse.badRequest(res, 'Tên đăng nhập đã tồn tại');
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return ApiResponse.badRequest(res, 'Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    // Xóa cache
    await CacheService.del('users:*');
    await CacheService.del('users:stats');

    logger.info('Admin đã tạo người dùng mới', { 
      newUserId: newUser.id, 
      newUserRole: role,
      adminId: req.user.id 
    });

    // Trả về user (không gửi password)
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    return ApiResponse.created(res, userResponse, 'Tạo người dùng thành công');
  } catch (error) {
    logger.logError(error, { context: 'createUser', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể tạo người dùng');
  }
};

/**
 * Lấy tất cả người dùng với phân trang và tìm kiếm
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      role = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Tìm kiếm theo tên người dùng hoặc email
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Lọc theo vai trò
    if (role) {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] }, // Không gửi mật khẩu
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    logger.info('Đã lấy danh sách người dùng', { count, page, search, userId: req.user?.id });

    return ApiResponse.paginated(
      res,
      users,
      {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      },
      'Lấy danh sách users thành công'
    );
  } catch (error) {
    logger.logError(error, { context: 'getAllUsers', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể lấy danh sách users');
  }
};

/**
 * Lấy thông tin một người dùng theo ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Thử lấy từ cache trước
    const user = await CacheService.remember(
      `user:${id}`,
      async () => {
        return await User.findByPk(id, {
          attributes: { exclude: ['password'] }
        });
      },
      600 // Cache trong 10 phút
    );

    if (!user) {
      return ApiResponse.notFound(res, 'User không tồn tại');
    }

    logger.info('Đã lấy thông tin người dùng theo ID', { requestedId: id, userId: req.user?.id });
    return ApiResponse.success(res, user, 'Lấy thông tin user thành công');
  } catch (error) {
    logger.logError(error, { context: 'getUserById', requestedId: req.params.id });
    return ApiResponse.serverError(res, 'Không thể lấy thông tin user');
  }
};

/**
 * Lấy thông tin profile người dùng hiện tại
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return ApiResponse.notFound(res, 'User không tồn tại');
    }

    logger.info('Đã lấy profile người dùng', { userId: req.user.id });
    return ApiResponse.success(res, user, 'Lấy profile thành công');
  } catch (error) {
    logger.logError(error, { context: 'getProfile', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể lấy profile');
  }
};

/**
 * Cập nhật người dùng (Chỉ Admin hoặc profile của chính mình)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findByPk(id);
    if (!user) {
      return ApiResponse.notFound(res, 'User không tồn tại');
    }

    // Chỉ admin mới có thể thay đổi vai trò hoặc cập nhật người dùng khác
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === parseInt(id);

    if (!isAdmin && !isOwnProfile) {
      return ApiResponse.forbidden(res, 'Bạn chỉ có thể cập nhật profile của mình');
    }

    // Kiểm tra tính duy nhất của email nếu thay đổi email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ApiResponse.badRequest(res, 'Email đã được sử dụng');
      }
    }

    // Cập nhật các trường
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Chỉ admin mới có thể thay đổi vai trò
    if (role && isAdmin) {
      // Kiểm tra giới hạn số lượng role
      if (role !== user.role) {
        const roleCount = await User.count({ where: { role } });
        
        if (role === 'admin' && roleCount >= 3) {
          return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 3 Admin');
        }
        if (role === 'vip' && roleCount >= 5) {
          return ApiResponse.badRequest(res, 'Đã đạt giới hạn tối đa 5 người dùng trả phí');
        }
      }
      
      updateData.role = role;
    }

    await user.update(updateData);

    // Xóa cache người dùng
    await CacheService.del(`user:${id}`);
    await CacheService.delPattern('users:list:*');
    await CacheService.del('users:stats');
    logger.info('Đã cập nhật người dùng và xóa cache', { updatedId: id, userId: req.user.id, changes: updateData });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    return ApiResponse.success(res, updatedUser, 'Cập nhật user thành công');
  } catch (error) {
    logger.logError(error, { context: 'updateUser', requestedId: req.params.id, userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể cập nhật user');
  }
};

/**
 * Xóa người dùng (Chỉ Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Ngăn chặn xóa chính mình
    if (req.user.id === parseInt(id)) {
      return ApiResponse.badRequest(res, 'Bạn không thể xóa chính mình');
    }

    const user = await User.findByPk(id);
    if (!user) {
      return ApiResponse.notFound(res, 'User không tồn tại');
    }

    await user.destroy();

    // Xóa cache người dùng
    await CacheService.del(`user:${id}`);
    await CacheService.delPattern('users:list:*');
    await CacheService.del('users:stats');
    logger.info('Đã xóa người dùng và xóa cache', { deletedId: id, deletedBy: req.user.id });

    return ApiResponse.success(res, null, 'Xóa user thành công');
  } catch (error) {
    logger.logError(error, { context: 'deleteUser', requestedId: req.params.id, userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể xóa user');
  }
};

/**
 * Lấy thống kê người dùng (Chỉ Admin)
 */
exports.getUserStats = async (req, res) => {
  try {
    // Thử lấy từ cache trước
    const cachedStats = await CacheService.get('users:stats');
    if (cachedStats) {
      logger.info('Trúng cache cho thống kê người dùng');
      return ApiResponse.success(res, cachedStats, 'Thống kê user');
    }

    const totalUsers = await User.count();
    const adminCount = await User.count({ where: { role: 'admin' } });
    const vipCount = await User.count({ where: { role: 'vip' } });
    const userCount = await User.count({ where: { role: 'user' } });

    // Lấy số lượng đăng ký gần đây (30 ngày trước)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const stats = {
      totalUsers,
      adminCount,
      vipCount,
      userCount,
      recentRegistrations,
      limits: {
        maxAdmin: 3,
        maxVip: 5,
        remainingAdmin: Math.max(0, 3 - adminCount),
        remainingVip: Math.max(0, 5 - vipCount)
      }
    };

    // Lưu cache thống kê trong 5 phút
    await CacheService.set('users:stats', stats, 300);
    logger.info('Đã lấy và cache thống kê người dùng', { userId: req.user.id });

    return ApiResponse.success(res, stats, 'Lấy thống kê users thành công');
  } catch (error) {
    logger.logError(error, { context: 'getUserStats', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể lấy thống kê users');
  }
};

/**
 * Lấy mã nội bộ hiện tại (Admin only)
 */
exports.getInternalCode = async (req, res) => {
  try {
    let setting = await Setting.findByPk('internalAdminCode');
    const value = setting ? setting.value : '1836';
    return ApiResponse.success(res, { key: 'internalAdminCode', value }, 'Lấy mã nội bộ thành công');
  } catch (error) {
    logger.logError(error, { context: 'getInternalCode', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể lấy mã nội bộ');
  }
};

/**
 * Cập nhật mã nội bộ (Admin only)
 */
exports.updateInternalCode = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || String(value).trim().length === 0) {
      return ApiResponse.badRequest(res, 'Mã nội bộ là bắt buộc');
    }

    let setting = await Setting.findByPk('internalAdminCode');
    const trimmed = String(value).trim();
    const oldValue = setting ? setting.value : null;
    // Hash the stored internal code before persisting
    const hashed = await hashInternalCode(trimmed);
    if (!setting) {
      setting = await Setting.create({ key: 'internalAdminCode', value: hashed });
    } else {
      await setting.update({ value: hashed });
    }

    // Record audit of the change (oldValue may be null)
    try {
      // For audit, avoid storing plaintext; store masked indicators
      await SettingAudit.create({
        settingKey: 'internalAdminCode',
        oldValue: oldValue ? '***' : null,
        newValue: '***',
        changedBy: req.user.id
      });
    } catch (auditErr) {
      // Log the audit error but don't block the main flow
      logger.logError(auditErr, { context: 'updateInternalCode:audit', userId: req.user?.id });
    }

    // Clear users stats cache in case UI depends on it
    await CacheService.del('users:stats');

    logger.info('Đã cập nhật mã nội bộ', { updatedBy: req.user.id });
    return ApiResponse.success(res, { key: 'internalAdminCode', value: setting.value }, 'Cập nhật mã nội bộ thành công');
  } catch (error) {
    logger.logError(error, { context: 'updateInternalCode', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể cập nhật mã nội bộ');
  }
};

/**
 * Lấy lịch sử thay đổi mã nội bộ (Admin only)
 */
exports.getInternalCodeAudit = async (req, res) => {
  try {
    const audits = await SettingAudit.findAll({
      where: { settingKey: 'internalAdminCode' },
      include: [
        { model: User, as: 'changer', attributes: ['id', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ApiResponse.success(res, audits, 'Lấy lịch sử thay đổi mã nội bộ thành công');
  } catch (error) {
    logger.logError(error, { context: 'getInternalCodeAudit', userId: req.user?.id });
    return ApiResponse.serverError(res, 'Không thể lấy lịch sử thay đổi mã nội bộ');
  }
};
