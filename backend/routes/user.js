const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * =========================
 * GET PROFILE
 * =========================
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.json(user);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Server error'
        });
    }
});


/**
 * =========================
 * UPDATE PROFILE
 * =========================
 */
router.put('/me', auth, async (req, res) => {
    const { name, phone, address } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // ✅ Validate (optional nhưng nên có)
        if (name !== undefined && name.trim() === '') {
            return res.status(400).json({
                field: 'name',
                message: 'Name cannot be empty'
            });
        }

        // ✅ Update
        user.name = name ?? user.name;
        user.phone = phone ?? user.phone;
        user.address = address ?? user.address;

        await user.save();

        return res.json({
            message: 'Profile updated'
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
 * CHANGE PASSWORD
 * =========================
 */
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        if (!currentPassword) {
            return res.status(400).json({
                field: 'currentPassword',
                message: 'Current password is required'
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                field: 'newPassword',
                message: 'New password is required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                field: 'newPassword',
                message: 'Minimum 6 characters'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                field: 'currentPassword',
                message: 'Wrong current password'
            });
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                field: 'newPassword',
                message: 'New password must be different'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({
            message: 'Password updated successfully'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Server error'
        });
    }
});

module.exports = router;
