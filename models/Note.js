const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: {type: String, required: true, trim: true},
        content: {type: String, required: true},
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {timestamps: true}
);

// Schema for a user can list then own notes sorted by latest
noteSchema.index({userId: 1, createdAt: -1});

// Schema for admin so admin can list everyone's notes sorted by latest
noteSchema.index({createdAt: -1});

module.exports = mongoose.model('Note', noteSchema);