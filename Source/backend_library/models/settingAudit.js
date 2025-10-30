const { DataTypes } = require('sequelize');
const sequelize = require('../configdatabase');
const SettingAudit = sequelize.define('SettingAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settingKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  // keep timestamps for auditing
  tableName: 'SettingAudits'
});

module.exports = SettingAudit;
