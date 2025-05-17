const express = require('express');
const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  res.json({ message: 'Get all users' });
});

// Register user
router.post('/register', (req, res) => {
  res.json({ message: 'Register user' });
});

// Login user
router.post('/login', (req, res) => {
  res.json({ message: 'Login user' });
});

// Get user profile
router.get('/profile/:id', (req, res) => {
  res.json({ message: 'Get user profile' });
});

module.exports = router; 