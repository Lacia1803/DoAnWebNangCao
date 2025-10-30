const { DataTypes } = require('sequelize');
const sequelize = require('../configdatabase');

/**
 * Simple key/value settings table for small app-level configuration.
 * Example key: 'internalAdminCode' => value: '1836'
 */
const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Setting;
