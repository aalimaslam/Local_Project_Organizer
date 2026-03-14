const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  startCommand: {
    type: DataTypes.STRING,
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  groupName: {
    type: DataTypes.STRING,
  },
  lastOpened: {
    type: DataTypes.DATE,
  },
  tags: {
    type: DataTypes.JSON, // Stored as JSON string in SQLite
    defaultValue: [],
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'idle',
  }
});

module.exports = Project;
