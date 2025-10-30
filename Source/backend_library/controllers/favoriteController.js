const { Favorite, Book, User } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../config/logger');

/**
 * Lấy tất cả sách yêu thích của người dùng hiện tại
 */
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info(`Lấy danh sách yêu thích của user ${userId}`);
    
    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Book,
        as: 'book',
        attributes: ['id', 'title', 'author', 'category', 'coverImage', 'description', 'bookType', 'stock']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Format response để trả về thông tin sách trực tiếp
    const formattedFavorites = favorites.map(fav => ({
      favoriteId: fav.id,
      addedAt: fav.createdAt,
      ...fav.book.toJSON()
    }));
    
    return ApiResponse.success(res, formattedFavorites, 'Lấy danh sách yêu thích thành công');
  } catch (error) {
    logger.error('Lỗi khi lấy danh sách yêu thích:', error);
    return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách yêu thích');
  }
};

/**
 * Thêm sách vào danh sách yêu thích
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;
    
    // Kiểm tra bookId
    if (!bookId) {
      return ApiResponse.badRequest(res, 'Vui lòng cung cấp bookId');
    }
    
    // Kiểm tra sách có tồn tại không
    const book = await Book.findByPk(bookId);
    if (!book) {
      return ApiResponse.notFound(res, 'Không tìm thấy sách');
    }
    
    // Kiểm tra đã yêu thích chưa
    const existingFavorite = await Favorite.findOne({
      where: { userId, bookId }
    });
    
    if (existingFavorite) {
      return ApiResponse.badRequest(res, 'Sách đã có trong danh sách yêu thích');
    }
    
    // Thêm vào favorites
    const favorite = await Favorite.create({ userId, bookId });
    
    logger.info(`User ${userId} đã thêm sách ${bookId} vào yêu thích`);
    
    return ApiResponse.created(res, favorite, 'Thêm vào yêu thích thành công');
  } catch (error) {
    logger.error('Lỗi khi thêm vào yêu thích:', error);
    return ApiResponse.serverError(res, 'Lỗi khi thêm vào yêu thích');
  }
};

/**
 * Xóa sách khỏi danh sách yêu thích
 */
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    
    const favorite = await Favorite.findOne({
      where: { userId, bookId }
    });
    
    if (!favorite) {
      return ApiResponse.notFound(res, 'Không tìm thấy sách trong danh sách yêu thích');
    }
    
    await favorite.destroy();
    
    logger.info(`User ${userId} đã xóa sách ${bookId} khỏi yêu thích`);
    
    return ApiResponse.success(res, null, 'Xóa khỏi yêu thích thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa khỏi yêu thích:', error);
    return ApiResponse.serverError(res, 'Lỗi khi xóa khỏi yêu thích');
  }
};

/**
 * Kiểm tra sách có trong danh sách yêu thích không
 */
const checkFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    
    const favorite = await Favorite.findOne({
      where: { userId, bookId }
    });
    
    return ApiResponse.success(res, { isFavorite: !!favorite }, 'Kiểm tra trạng thái yêu thích thành công');
  } catch (error) {
    logger.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
    return ApiResponse.serverError(res, 'Lỗi khi kiểm tra trạng thái yêu thích');
  }
};

module.exports = {
  getMyFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus
};
