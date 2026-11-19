const express = require('express');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notes?page=1&limit=10
// @desc    Get paginated notes (User sees own notes; Admin sees everyone's notes)
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };

    const [notes, totalItems] = await Promise.all([
      Note.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Note.countDocuments(filter)
    ]);

    res.json({
      notes,
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

// @route   GET /api/notes/:id
// @desc    Get single note (uses built-in _id index)
router.get('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('userId', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user.role !== 'admin' && note.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this note' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/notes
// @desc    Create a note
router.post('/', protect, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = await Note.create({
      title,
      content,
      userId: req.user.id
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note (Owner or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user.role !== 'admin' && note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    note.title = req.body.title ?? note.title;
    note.content = req.body.content ?? note.content;
    const updatedNote = await note.save();

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user.role !== 'admin' && note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;