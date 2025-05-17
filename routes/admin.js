const express = require('express');
const router = express.Router();
const db = require('../config/db.config');
const { auth, checkRole } = require('../middleware/auth');

// Get all users
router.get('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, email, role, first_name, last_name, created_at,
        CASE WHEN status IS NULL THEN 'active' ELSE status END as status
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user status
router.patch('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    // Don't allow updating admin users
    const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (user[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot modify admin users' });
    }

    await db.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// Get all projects with user details
router.get('/projects', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [projects] = await db.execute(`
      SELECT 
        p.*,
        u.first_name as client_first_name,
        u.last_name as client_last_name,
        u.email as client_email,
        COUNT(DISTINCT pa.id) as applications_count
      FROM project_posts p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN project_applications pa ON p.id = pa.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get system statistics
router.get('/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [[userStats]] = await db.execute(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_count,
        SUM(CASE WHEN role = 'contractor' THEN 1 ELSE 0 END) as contractor_count
      FROM users
      WHERE role != 'admin'
    `);

    const [[projectStats]] = await db.execute(`
      SELECT
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects
      FROM project_posts
    `);

    const [[applicationStats]] = await db.execute(`
      SELECT COUNT(*) as total_applications
      FROM project_applications
    `);

    res.json({
      users: userStats,
      projects: projectStats,
      applications: applicationStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Delete user (and all associated data)
router.delete('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting admin users
    const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (user[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Start transaction
    await db.beginTransaction();

    try {
      // Delete user's projects (cascade will handle applications)
      await db.execute('DELETE FROM project_posts WHERE client_id = ?', [userId]);
      
      // Delete user's portfolio projects (cascade will handle images)
      await db.execute('DELETE FROM portfolio_projects WHERE contractor_id = ?', [userId]);
      
      // Delete user's applications
      await db.execute('DELETE FROM project_applications WHERE contractor_id = ?', [userId]);
      
      // Delete user's messages
      await db.execute('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
      
      // Finally, delete the user
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);

      await db.commit();
      res.json({ message: 'User and associated data deleted successfully' });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

module.exports = router; 