const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Routes cho quản lý danh sách yêu thích
 * Tất cả routes đều yêu cầu authentication
 */

// Lấy danh sách yêu thích của user hiện tại
router.get('/my', authenticateToken, favoriteController.getMyFavorites);

// Kiểm tra trạng thái yêu thích của một sách
router.get('/check/:bookId', authenticateToken, favoriteController.checkFavoriteStatus);

// Thêm sách vào yêu thích
router.post('/', authenticateToken, favoriteController.addToFavorites);

// Xóa sách khỏi yêu thích
router.delete('/:bookId', authenticateToken, favoriteController.removeFromFavorites);

module.exports = router;
