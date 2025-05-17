const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const auth = require('../middleware/auth');

// Get all offers
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.findAll();
    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Error fetching offers' });
  }
});

// Get single offer
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.json(offer);
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ message: 'Error fetching offer' });
  }
});

// Create offer (protected route)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, location, rate, latitude, longitude } = req.body;
    const offerId = await Offer.create({
      title,
      description,
      location,
      rate,
      latitude,
      longitude,
      contractor_id: req.user.userId
    });
    res.status(201).json({ message: 'Offer created successfully', offerId });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Error creating offer' });
  }
});

// Update offer (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Check if user owns the offer
    if (offer.contractor_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Offer.update(req.params.id, req.body);
    res.json({ message: 'Offer updated successfully' });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ message: 'Error updating offer' });
  }
});

// Delete offer (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Check if user owns the offer
    if (offer.contractor_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Offer.delete(req.params.id);
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ message: 'Error deleting offer' });
  }
});

module.exports = router; 