const express = require('express');
const router = express.Router();

// Get all applications for an offer
router.get('/offer/:offerId', (req, res) => {
  res.json({ message: 'Get all applications for offer' });
});

// Create new application
router.post('/', (req, res) => {
  res.json({ message: 'Create new application' });
});

// Get user's applications
router.get('/user/:userId', (req, res) => {
  res.json({ message: 'Get user applications' });
});

// Update application status
router.put('/:id', (req, res) => {
  res.json({ message: 'Update application status' });
});

module.exports = router; 