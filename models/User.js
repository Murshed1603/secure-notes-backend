const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, lowercase: true, trim: true},
        password: {type: String, required: true},
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        interests: [{type: String, trim: true}] // this section is for user's interests, like hobbies
    },
    {timestamps: true}
);

// strict indexes ( using SCHEMA.index as per requirements)
// supports login or lookup by email and prevents duplicate accounts
userSchema.index({email: 1}, {unique: true});

// schema for admin listing all users sorted by latest first
// also pagination is used
userSchema.index({createdAt: -1});

// schema for grouping users by Interests
userSchema.index({interests: 1});

module.exports = mongoose.model('User', userSchema);