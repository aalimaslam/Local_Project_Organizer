const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  labels: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
});

module.exports = Note;
