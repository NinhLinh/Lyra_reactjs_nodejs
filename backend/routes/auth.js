const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * =========================
 * REGISTER
 * =========================
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        field: 'name',
        message: 'Name is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        field: 'email',
        message: 'Email is required'
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        field: 'email',
        message: 'Invalid email'
      });
    }

    if (!password) {
      return res.status(400).json({
        field: 'password',
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        field: 'password',
        message: 'Minimum 6 characters'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        field: 'email',
        message: 'Email already exists'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({
      message: 'Register successful'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error'
    });
  }
});


/**
 * =========================
 * LOGIN
 * =========================
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        field: 'email',
        message: 'Email is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        field: 'password',
        message: 'Password is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        field: 'email',
        message: 'Email not found'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        field: 'password',
        message: 'Wrong password, enter again pls'
      });
    }

    const token = jwt.sign(
        {
          id: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;
