const express = require('express');
const router = express.Router();
const db = require('../config/db.config');
const { auth, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = 'uploads/portfolio';
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get contractor's portfolio
router.get('/contractor', auth, checkRole(['contractor']), async (req, res) => {
  try {
    const [projects] = await db.execute(`
      SELECT p.*, GROUP_CONCAT(pi.image_url) as images
      FROM portfolio_projects p
      LEFT JOIN project_images pi ON p.id = pi.project_id
      WHERE p.contractor_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    const portfolioProjects = projects.map(project => ({
      ...project,
      images: project.images ? project.images.split(',') : []
    }));

    res.json(portfolioProjects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching portfolio' });
  }
});

// Add portfolio project
router.post('/', auth, checkRole(['contractor']), upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, completion_date, client_name } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO portfolio_projects (contractor_id, title, description, completion_date, client_name) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description, completion_date, client_name]
    );

    const projectId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => [
        projectId,
        `/uploads/portfolio/${file.filename}`
      ]);

      await db.query(
        'INSERT INTO project_images (project_id, image_url) VALUES ?',
        [imageValues]
      );
    }

    res.status(201).json({ id: projectId });
  } catch (error) {
    // If error occurs, cleanup any uploaded files
    if (req.files) {
      req.files.forEach(async file => {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    res.status(500).json({ error: 'Error creating portfolio project' });
  }
});

// Delete portfolio project
router.delete('/:id', auth, checkRole(['contractor']), async (req, res) => {
  try {
    // Get project images before deletion
    const [images] = await db.execute(
      'SELECT image_url FROM project_images WHERE project_id = ?',
      [req.params.id]
    );

    // Delete project (cascade will handle related images in DB)
    await db.execute(
      'DELETE FROM portfolio_projects WHERE id = ? AND contractor_id = ?',
      [req.params.id, req.user.id]
    );

    // Delete image files
    for (const image of images) {
      const filePath = path.join(__dirname, '..', 'public', image.image_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    res.json({ message: 'Portfolio project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting portfolio project' });
  }
});

// Update portfolio project
router.patch('/:id', auth, checkRole(['contractor']), upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, completion_date, client_name } = req.body;
    
    await db.execute(
      'UPDATE portfolio_projects SET title = ?, description = ?, completion_date = ?, client_name = ? WHERE id = ? AND contractor_id = ?',
      [title, description, completion_date, client_name, req.params.id, req.user.id]
    );

    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => [
        req.params.id,
        `/uploads/portfolio/${file.filename}`
      ]);

      await db.query(
        'INSERT INTO project_images (project_id, image_url) VALUES ?',
        [imageValues]
      );
    }

    res.json({ message: 'Portfolio project updated successfully' });
  } catch (error) {
    // Cleanup any uploaded files on error
    if (req.files) {
      req.files.forEach(async file => {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    res.status(500).json({ error: 'Error updating portfolio project' });
  }
});

module.exports = router; 