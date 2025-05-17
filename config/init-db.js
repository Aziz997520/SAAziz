const sequelize = require('./database');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Message = require('../models/Message');
const Feed = require('../models/Feed');

const initializeDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true }); // Be careful with force: true in production!

    // Create admin user
    await User.create({
      email: 'admin@servini.tn',
      password: 'admin123', // In production, use hashed passwords
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    // Create sample contractors
    const contractors = [
      {
        email: 'plumber@servini.tn',
        password: 'contractor123',
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        role: 'contractor',
        phone: '+216 22 333 444',
        bio: 'Professional plumber with 8 years of experience',
        skills: ['Plumbing', 'Pipe Fitting', 'Emergency Repairs'],
      },
      {
        email: 'electrician@servini.tn',
        password: 'contractor123',
        firstName: 'Mohamed',
        lastName: 'Trabelsi',
        role: 'contractor',
        phone: '+216 23 444 555',
        bio: 'Licensed electrician specializing in residential and commercial work',
        skills: ['Electrical Installation', 'Maintenance', 'Troubleshooting'],
      },
    ];

    for (const contractor of contractors) {
      await User.create(contractor);
    }

    // Create sample clients
    const clients = [
      {
        email: 'client1@servini.tn',
        password: 'client123',
        firstName: 'Sami',
        lastName: 'Khadhraoui',
        role: 'client',
        phone: '+216 24 555 666',
      },
      {
        email: 'client2@servini.tn',
        password: 'client123',
        firstName: 'Leila',
        lastName: 'Ben Salah',
        role: 'client',
        phone: '+216 25 666 777',
      },
    ];

    for (const client of clients) {
      await User.create(client);
    }

    // Create sample offers
    const offers = [
      {
        title: 'Emergency Plumbing Service',
        description: 'Available 24/7 for any plumbing emergencies. Fast and reliable service.',
        location: 'Tunis',
        rate: '50 TND/hour',
        contractorId: 2, // Plumber's ID
        status: 'active',
      },
      {
        title: 'Electrical Installation',
        description: 'Complete electrical installation services for new constructions.',
        location: 'Sfax',
        rate: '60 TND/hour',
        contractorId: 3, // Electrician's ID
        status: 'active',
      },
    ];

    for (const offer of offers) {
      await Offer.create(offer);
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = initializeDatabase; 