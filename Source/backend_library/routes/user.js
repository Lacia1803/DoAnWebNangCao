const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, vip, user]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  '/',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getAllUsers
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, vip, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post(
  '/',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validate([
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username phải từ 3-30 ký tự'),
    body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
    body('role').optional().isIn(['admin', 'vip', 'user']).withMessage('Role phải là admin, vip hoặc user')
  ]),
  userController.createUser
);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get(
  '/stats',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getUserStats
);

// Lấy mã nội bộ hiện tại (Admin only)
router.get(
  '/internal-code',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getInternalCode
);

// Cập nhật mã nội bộ (Admin only)
router.put(
  '/internal-code',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validate([
    body('value').trim().notEmpty().withMessage('Mã nội bộ là bắt buộc')
  ]),
  userController.updateInternalCode
);

// Lấy lịch sử thay đổi mã nội bộ (Admin only)
router.get(
  '/internal-code/audit',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getInternalCodeAudit
);

/**
 * @swagger
 * /api/users/profile/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get(
  '/profile/me',
  authMiddleware.authenticateToken,
  userController.getProfile
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authMiddleware.authenticateToken,
  authMiddleware.requireOwnerOrAdmin,
  userController.getUserById
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  '/:id',
  authMiddleware.authenticateToken,
  authMiddleware.requireOwnerOrAdmin,
  validate([
    body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('role').optional().isIn(['admin', 'vip', 'user']).withMessage('Role must be admin, vip or user')
  ]),
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  '/:id',
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.deleteUser
);

module.exports = router;
