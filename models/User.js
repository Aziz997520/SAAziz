const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const db = require('../config/db.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(191),
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'client', 'contractor'),
    defaultValue: 'client',
  },
  phone: {
    type: DataTypes.STRING,
  },
  profileImage: {
    type: DataTypes.STRING,
  },
  bio: {
    type: DataTypes.TEXT,
  },
  skills: {
    type: DataTypes.JSON,
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Class methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

User.getClientProfile = async function(id) {
  const user = await this.findOne({
    where: { id, role: 'client' },
    include: [{
      model: sequelize.models.Application,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalApplications'],
        [sequelize.fn('COUNT', 
          sequelize.literal("CASE WHEN status = 'accepted' THEN 1 END")), 
          'acceptedApplications'
        ]
      ]
    }],
    group: ['User.id']
  });
  return user;
};

User.getContractorProfile = async function(id) {
  const user = await this.findOne({
    where: { id, role: 'contractor' },
    include: [{
      model: sequelize.models.Offer,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOffers'],
        [sequelize.fn('COUNT', 
          sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 
          'activeOffers'
        ]
      ]
    }],
    group: ['User.id']
  });
  return user;
};

User.updateRating = async function(id) {
  const user = await this.findByPk(id);
  if (!user) return;

  const ratings = await Promise.all([
    sequelize.models.Offer.findAll({
      where: { contractor_id: id, status: 'completed' },
      attributes: ['rating']
    }),
    sequelize.models.Application.findAll({
      where: { user_id: id, status: 'completed' },
      attributes: ['rating']
    })
  ]);

  const allRatings = [...ratings[0], ...ratings[1]].map(r => r.rating).filter(Boolean);
  if (allRatings.length > 0) {
    const averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    await user.update({ rating: averageRating });
  }
};

// Hooks
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

class User {
    static async create(userData) {
        const { email, password, role, first_name, last_name } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO users (email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, role, first_name, last_name]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT id, email, role, first_name, last_name, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateProfile(userId, userData) {
        const { first_name, last_name } = userData;
        const [result] = await db.execute(
            'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
            [first_name, last_name, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User; 