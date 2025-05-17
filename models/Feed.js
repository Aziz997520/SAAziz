const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Feed = sequelize.define('Feed', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  comments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

Feed.belongsTo(User, { as: 'author', foreignKey: 'userId' });

module.exports = Feed; 