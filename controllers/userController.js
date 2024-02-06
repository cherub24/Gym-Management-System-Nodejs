
//userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

// Show registration form
exports.showRegistrationForm = (req, res) => {
    res.render('register');
};

// Handle user registration
exports.register = async (req, res) => {
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Extract user input
    const { email, password } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        // Create a new user
        user = new User({ email, password });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save the user to the database
        await user.save();

        // Return a success message
        res.status(200).json({ msg: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
    }
};
