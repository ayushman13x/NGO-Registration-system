const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); // Kept at the top for clarity
const User = require('../models/User');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        // PROFESSIONAL LOGIC:
        // Only this specific email can ever become an admin
        const assignedRole = (email === "superadmin@ngo.org") ? "admin" : "user";

        user = new User({ 
            name, 
            email, 
            password, 
            role: assignedRole // role is forced by the backend, not the user
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ msg: `Registered successfully as ${assignedRole}!` });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});
// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'your_fallback_secret', 
            { expiresIn: '1h' }
        );

        // FIX: Flatten the response to match your Login.jsx (res.data.role)
        res.json({
            token,
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;