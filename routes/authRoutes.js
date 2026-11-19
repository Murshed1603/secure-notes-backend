const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {protect} = require('../middleware/auth');

const router = express.Router();

// This function generates JWT
const generateToken = (user) => {
    return jwt.sign(
        {id: user._id, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
    );
};

// Route : POST/api/auth/register
// Description : Register a new user and also hashes password
router.post('/register', async (req, res) => {
    try {
        const {name, email, password, role, interests} = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({message: 'Name, email and password are required.'});
        }

        // uses [email : 1] as unique index
        const existingUser = await User.findOne({email: email.toLowerCase()});
        if(existingUser) {
            return res.status(400).json({message: 'User with this email already exists.'});
        }

        // feature for hashing password
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
            token: generateToken(user),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                interests: user.interests
            }
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// Router : POST/api/auth/login
// Description : Authenticate user and returns JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password} = req.body;

        // uses [email 1]
        const user = await User.findOne({email: email.toLowerCase()});
        if(!user) {
            return res.status(401).json({message: 'Invalid email or password !'});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({message: 'Invalid email or password !'});
        }

        res.json({
            token: generateToken(user),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                interests: user.interests
            }
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// Route : GET/api/auth/me
// Description : This will get currently logged in user profile

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if(!user) return res.status(404).json({message: 'User not found'});
        res.json(user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;