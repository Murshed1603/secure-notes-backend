const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// STRICT INDEXES:
// 1. Supports Aggregation Scenario 2 ($lookup matching User._id to authorId) + sorting
postSchema.index({ authorId: 1, createdAt: -1 });

// 2. Supports listing all public posts sorted by newest first (paginated)
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);