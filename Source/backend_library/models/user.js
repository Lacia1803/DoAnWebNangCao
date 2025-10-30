const { DataTypes } = require('sequelize');
const sequelize = require('../configdatabase'); // Đường dẫn tới file config kết nối của bạn

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
     type: DataTypes.ENUM('admin', 'vip', 'user'),
    allowNull: false,
    defaultValue: 'user'
  }
});

module.exports = User;
