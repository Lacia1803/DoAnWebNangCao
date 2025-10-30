const { Borrow, User, Book } = require('../models');
const { sendBorrowConfirmation, sendReturnConfirmation } = require('../utils/emailService');
const { Op } = require('sequelize');

// Tạo phiếu mượn mới
exports.borrowBook = async (req, res) => {
  try {
    const { bookId, dueDate } = req.body;
    const userId = req.user.id;

    // Kiểm tra sách tồn tại và còn hàng
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    if (book.stock <= 0) {
      return res.status(400).json({ message: 'Sách đã hết' });
    }

    // Kiểm tra người dùng đã mượn sách này mà chưa trả chưa
    const existingBorrow = await Borrow.findOne({
      where: {
        userId,
        bookId,
        status: 'borrowed'
      }
    });

    if (existingBorrow) {
      return res.status(400).json({ message: 'Bạn đã mượn cuốn sách này và chưa trả' });
    }

    // Tạo phiếu mượn
    const borrow = await Borrow.create({
      userId,
      bookId,
      dueDate,
      status: 'borrowed'
    });

    // Giảm tồn kho sách
    await book.update({ stock: book.stock - 1 });

    const borrowWithDetails = await Borrow.findByPk(borrow.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] }
      ]
    });

    // Gửi email xác nhận (không bắt buộc)
    try {
      const user = req.user || (await User.findByPk(userId));
      await sendBorrowConfirmation(user, borrowWithDetails);
    } catch (e) {
      // Không chặn phản hồi nếu lỗi email
      console.warn('Gửi email mượn thất bại:', e.message);
    }

    res.status(201).json({
      message: 'Mượn sách thành công',
      borrow: borrowWithDetails
    });
  } catch (error) {
    console.error('Lỗi mượn sách:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Trả sách
exports.returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const whereClause = { id };
    if (!isAdmin) {
      whereClause.userId = userId;
    }

    const borrow = await Borrow.findOne({
      where: whereClause,
      include: [{ model: Book, as: 'book' }]
    });

    if (!borrow) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    }

    if (borrow.status === 'returned') {
      return res.status(400).json({ message: 'Sách đã được trả trước đó' });
    }

    // Update borrow record
    await borrow.update({
      returnDate: new Date(),
      status: 'returned'
    });

  // Tăng tồn kho sách
    await borrow.book.update({ stock: borrow.book.stock + 1 });

    // Gửi email xác nhận trả (không bắt buộc)
    try {
      const user = req.user || (await User.findByPk(borrow.userId));
      const borrowWithBook = await Borrow.findByPk(borrow.id, { include: [{ model: Book, as: 'book' }] });
      await sendReturnConfirmation(user, borrowWithBook);
    } catch (e) {
      console.warn('Gửi email trả sách thất bại:', e.message);
    }

    res.json({
      message: 'Trả sách thành công',
      borrow
    });
  } catch (error) {
    console.error('Lỗi trả sách:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Lấy lịch sử mượn của người dùng
exports.getUserBorrows = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const borrows = await Borrow.findAll({
      where: whereClause,
      include: [
        { model: Book, as: 'book', attributes: ['id', 'title', 'author', 'coverImage'] }
      ],
      order: [['borrowDate', 'DESC']]
    });

    res.json(borrows);
  } catch (error) {
    console.error('Lỗi lấy lịch sử mượn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Danh sách mượn trả (Admin)
exports.getAllBorrows = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: borrows } = await Borrow.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] }
      ],
      order: [['borrowDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      borrows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách mượn trả:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Đánh dấu quá hạn
exports.updateOverdueBorrows = async (req, res) => {
  try {
    const now = new Date();
    
    const updated = await Borrow.update(
      { status: 'overdue' },
      {
        where: {
          status: 'borrowed',
          dueDate: { [Op.lt]: now }
        }
      }
    );

    res.json({
      message: 'Đã cập nhật trạng thái quá hạn',
      updatedCount: updated[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật quá hạn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
