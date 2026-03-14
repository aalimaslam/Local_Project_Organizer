const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Label = sequelize.define('Label', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Label;
