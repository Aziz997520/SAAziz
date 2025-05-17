const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const pool = require('../config/database');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  rate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active',
  },
});

Offer.belongsTo(User, { as: 'contractor', foreignKey: 'contractorId' });

class Offer {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM offers ORDER BY created_at DESC');
    return rows;
  }

  static async create(offerData) {
    const { title, description, company, location, salary, user_id } = offerData;
    const [result] = await pool.execute(
      'INSERT INTO offers (title, description, company, location, salary, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, company, location, salary, user_id]
    );
    return result.insertId;
  }

  static async update(id, offerData) {
    const { title, description, company, location, salary } = offerData;
    await pool.execute(
      'UPDATE offers SET title = ?, description = ?, company = ?, location = ?, salary = ? WHERE id = ?',
      [title, description, company, location, salary, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM offers WHERE id = ?', [id]);
  }
}

module.exports = Offer; 