const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const pool = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

class Message {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByConversationId(conversationId, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT m.*, u.firstName, u.lastName, u.profileImage 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.conversation_id = ? 
       ORDER BY m.created_at DESC 
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );
    return rows;
  }

  static async create(messageData) {
    const { conversation_id, sender_id, content } = messageData;
    const [result] = await pool.execute(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      [conversation_id, sender_id, content]
    );
    return result.insertId;
  }

  static async markAsRead(messageId) {
    await pool.execute(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [messageId]
    );
  }

  static async getUnreadCount(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM messages m 
       JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id 
       WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = FALSE`,
      [userId, userId]
    );
    return rows[0].count;
  }
}

module.exports = Message; 