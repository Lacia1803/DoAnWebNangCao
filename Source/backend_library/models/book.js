const { DataTypes } = require('sequelize');
const sequelize = require('../configdatabase');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
    },
    bookType: {
      type: DataTypes.ENUM('physical', 'online'),
      allowNull: false,
      defaultValue: 'physical',
      comment: 'Loại sách: physical (mượn trực tiếp), online (đọc trực tuyến)'
    },
    contentFile: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Đường dẫn file nội dung sách (PDF, Word, TXT) cho sách online'
  }
});

module.exports = Book;
