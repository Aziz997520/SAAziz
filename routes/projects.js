const express = require('express');
const router = express.Router();
const db = require('../config/db.config');
const { auth, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all projects (for admin)
router.get('/admin/projects', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [projects] = await db.execute(`
      SELECT p.*, u.first_name, u.last_name, u.email
      FROM project_posts p
      JOIN users u ON p.client_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get client's projects
router.get('/client', auth, checkRole(['client']), async (req, res) => {
  try {
    const [projects] = await db.execute(
      'SELECT * FROM project_posts WHERE client_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get available projects for contractors
router.get('/available', auth, checkRole(['contractor']), async (req, res) => {
  try {
    const [projects] = await db.execute(`
      SELECT p.*, u.first_name, u.last_name
      FROM project_posts p
      JOIN users u ON p.client_id = u.id
      WHERE p.status = 'open'
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching available projects' });
  }
});

// Create a new project
router.post('/', auth, checkRole(['client']), async (req, res) => {
  try {
    const { title, description, budget, location, deadline } = req.body;
    const [result] = await db.execute(
      'INSERT INTO project_posts (client_id, title, description, budget, location, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, budget, location, deadline]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
  }
});

// Apply to a project
router.post('/:id/apply', auth, checkRole(['contractor']), async (req, res) => {
  try {
    const projectId = req.params.id;
    const [existing] = await db.execute(
      'SELECT * FROM project_applications WHERE project_id = ? AND contractor_id = ?',
      [projectId, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied to this project' });
    }

    await db.execute(
      'INSERT INTO project_applications (project_id, contractor_id) VALUES (?, ?)',
      [projectId, req.user.id]
    );
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error applying to project' });
  }
});

// Delete a project (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    await db.execute('DELETE FROM project_posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// Update project status
router.patch('/:id/status', auth, checkRole(['client']), async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute(
      'UPDATE project_posts SET status = ? WHERE id = ? AND client_id = ?',
      [status, req.params.id, req.user.id]
    );
    res.json({ message: 'Project status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating project status' });
  }
});

module.exports = router; 