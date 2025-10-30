const sequelize = require('../configdatabase');
const User = require('./user');
const Book = require('./book');
const Borrow = require('./borrow');
const Favorite = require('./favorite');
const Setting = require('./setting');
const SettingAudit = require('./settingAudit');

// Define relationships
User.hasMany(Borrow, { foreignKey: 'userId', as: 'borrows' });
Borrow.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(Borrow, { foreignKey: 'bookId', as: 'borrows' });
Borrow.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// Favorite relationships
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(Favorite, { foreignKey: 'bookId', as: 'favorites' });
Favorite.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// Setting audit associations (who changed a setting)
SettingAudit.belongsTo(User, { foreignKey: 'changedBy', as: 'changer' });
User.hasMany(SettingAudit, { foreignKey: 'changedBy', as: 'settingChanges' });

module.exports = {
  sequelize,
  User,
  Book,
  Borrow,
  Favorite,
  Setting,
  SettingAudit
};
