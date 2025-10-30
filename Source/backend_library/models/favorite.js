const { DataTypes } = require('sequelize');
const sequelize = require('../configdatabase');

/**
 * Model Favorite - Danh sách yêu thích của người dùng
 * Lưu trữ sách yêu thích của từng user
 */
const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID người dùng'
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Books',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID sách yêu thích'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'bookId'],
      name: 'unique_user_book_favorite'
    }
  ]
});

module.exports = Favorite;
