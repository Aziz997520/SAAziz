const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('./config/database');
const { auth, adminAuth } = require('./middleware/auth');
require('dotenv').config();
const fs = require('fs');

const app = express();

// File upload configuration
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.path.includes('profile') ? 'profiles' : 
                req.path.includes('feed') ? 'feeds' :
                req.path.includes('offers') ? 'offers' : 'attachments';
    cb(null, `./uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user?.id || 'temp'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Maximum 5 files per upload
  }
});

// Error handling middleware for file uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
    }
    return res.status(400).json({ message: 'File upload error.' });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

app.use(handleUploadError);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Import models
const User = require('./models/User');
const Offer = require('./models/Offer');
const Message = require('./models/Message');
const Feed = require('./models/Feed');

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone,
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
});

// Admin Routes (Protected)
app.get('/api/admin/stats/users', adminAuth, async (req, res) => {
  try {
    const total = await User.count();
    const recent = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    res.json({ total, recent });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

app.get('/api/admin/stats/offers', async (req, res) => {
  try {
    const total = await Offer.count();
    const recent = await Offer.findAll({
      include: [{ model: User, as: 'contractor' }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    res.json({ total, recent });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching offer stats' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.update(req.body);
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Offers Routes
app.get('/api/offers', async (req, res) => {
  try {
    const offers = await Offer.findAll({
      include: [{ model: User, as: 'contractor' }]
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching offers' });
  }
});

app.post('/api/offers', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const images = req.files ? req.files.map(file => `/uploads/offers/${file.filename}`) : [];
    const offerData = {
      ...req.body,
      images,
      contractorId: req.user.id,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
    };
    
    const offer = await Offer.create(offerData);
    res.json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Error creating offer' });
  }
});

app.put('/api/offers/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const offer = await Offer.findByPk(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.contractorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this offer' });
    }

    // Handle image updates
    let updatedImages = [...(offer.images || [])];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/offers/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    // Remove images if specified
    if (req.body.removedImages) {
      const removedImages = JSON.parse(req.body.removedImages);
      updatedImages = updatedImages.filter(img => !removedImages.includes(img));
      
      // Delete removed image files
      removedImages.forEach(img => {
        const filePath = path.join(__dirname, img);
        fs.unlink(filePath, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    const offerData = {
      ...req.body,
      images: updatedImages,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : offer.latitude,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : offer.longitude,
    };

    // Remove the removedImages field from the data to be saved
    delete offerData.removedImages;
    
    await offer.update(offerData);
    res.json(offer);
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Error updating offer' });
  }
});

app.get('/api/offers/:id', async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ model: User, as: 'contractor' }]
    });
    if (offer) {
      res.json(offer);
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching offer' });
  }
});

// Applications Routes
app.post('/api/offers/:id/apply', (req, res) => {
  const { message } = req.body;
  const application = {
    id: applications.length + 1,
    offerId: parseInt(req.params.id),
    message,
    status: 'PENDING',
    createdAt: new Date(),
  };
  applications.push(application);
  res.json(application);
});

app.get('/api/applications', (req, res) => {
  res.json(applications);
});

// Profile Routes
app.get('/api/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

app.put('/api/profile/:userId', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updateData = { ...req.body };
    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    
    await user.update(updateData);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Messaging Routes
app.post('/api/messages', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const attachments = req.files ? req.files.map(file => `/uploads/attachments/${file.filename}`) : [];
    const message = await Message.create({
      content: req.body.content,
      senderId: req.user.id,
      receiverId: req.body.receiverId,
      attachments,
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

app.get('/api/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        [sequelize.Op.or]: [
          { senderId: req.user.id, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'profileImage'] },
        { model: User, as: 'receiver', attributes: ['id', 'firstName', 'lastName', 'profileImage'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Feed Routes
app.post('/api/feed', auth, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => `/uploads/feeds/${file.filename}`) : [];
    const post = await Feed.create({
      content: req.body.content,
      userId: req.user.id,
      images,
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});

app.get('/api/feed', auth, async (req, res) => {
  try {
    const posts = await Feed.findAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/admin', require('./routes/admin'));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database sync and server start
const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }).then(async () => {
  // Create upload directories
  const dirs = ['profiles', 'feeds', 'attachments', 'offers'];
  dirs.forEach(dir => {
    const path = `./uploads/${dir}`;
    if (!require('fs').existsSync(path)) {
      require('fs').mkdirSync(path, { recursive: true });
    }
  });

  // Initialize database with sample data if needed
  const userCount = await User.count();
  if (userCount === 0) {
    const initializeDatabase = require('./config/init-db');
    await initializeDatabase();
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Unable to connect to the database:', error);
}); 