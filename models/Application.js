const pool = require('../config/database');

class Application {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE user_id = ?', [userId]);
    return rows;
  }

  static async findByOfferId(offerId) {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE offer_id = ?', [offerId]);
    return rows;
  }

  static async create(applicationData) {
    const { user_id, offer_id, cover_letter, status = 'pending' } = applicationData;
    const [result] = await pool.execute(
      'INSERT INTO applications (user_id, offer_id, cover_letter, status) VALUES (?, ?, ?, ?)',
      [user_id, offer_id, cover_letter, status]
    );
    return result.insertId;
  }

  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, id]
    );
  }
}

module.exports = Application; 