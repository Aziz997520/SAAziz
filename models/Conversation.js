const pool = require('../config/database');

class Conversation {
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*, o.title as offer_title 
       FROM conversations c 
       LEFT JOIN offers o ON c.offer_id = o.id 
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT c.*, o.title as offer_title,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.sender_id != ? 
         AND m.is_read = FALSE) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       LEFT JOIN offers o ON c.offer_id = o.id
       WHERE cp.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId, userId]
    );
    return rows;
  }

  static async create(conversationData) {
    const { offer_id } = conversationData;
    const [result] = await pool.execute(
      'INSERT INTO conversations (offer_id) VALUES (?)',
      [offer_id]
    );
    return result.insertId;
  }

  static async addParticipant(conversationId, userId) {
    await pool.execute(
      'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
      [conversationId, userId]
    );
  }

  static async getParticipants(conversationId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.firstName, u.lastName, u.profileImage 
       FROM users u 
       JOIN conversation_participants cp ON u.id = cp.user_id 
       WHERE cp.conversation_id = ?`,
      [conversationId]
    );
    return rows;
  }
}

module.exports = Conversation; 