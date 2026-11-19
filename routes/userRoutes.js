const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/by-interests
// @desc    AGGREGATION SCENARIO 1: Group users by interests using a SINGLE aggregate() call
// @access  Protected (any logged-in user or admin)
router.get('/by-interests', protect, async (req, res) => {
  try {
    // Strictly ONE User.aggregate() call, supported by { interests: 1 } index
    const groupedUsers = await User.aggregate([
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          userCount: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(groupedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users?page=1&limit=10
// @desc    Admin: List all users (paginated, uses { createdAt: -1 } index)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [users, totalItems] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Admin: Get single user profile (uses built-in _id index)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/users
// @desc    Admin: Add a new user
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      interests: Array.isArray(interests) ? interests : []
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Admin: Update user details or role
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;
    if (req.body.role) user.role = req.body.role;
    if (Array.isArray(req.body.interests)) user.interests = req.body.interests;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      interests: updated.interests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Admin: Remove a user
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;