const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts/user/:userId
// @desc    AGGREGATION SCENARIO 2: Retrieve all posts of a specific user via single $lookup pipeline
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Single aggregation pipeline with $lookup
    // $match uses User._id index; $lookup uses Post { authorId: 1, createdAt: -1 } index
    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'posts', // MongoDB collection name for Post model
          localField: '_id',
          foreignField: 'authorId',
          as: 'posts'
        }
      },
      {
        $project: {
          password: 0 // Never expose password hash
        }
      }
    ]);

    if (!result.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/posts?page=1&limit=10
// @desc    Get all public posts (paginated, uses { createdAt: -1 } index)
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [posts, totalItems] = await Promise.all([
      Post.find()
        .populate('authorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments()
    ]);

    res.json({
      posts,
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

// @route   POST /api/posts
// @desc    Create a public post
router.post('/', protect, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const post = await Post.create({
      title,
      body,
      authorId: req.user.id
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;