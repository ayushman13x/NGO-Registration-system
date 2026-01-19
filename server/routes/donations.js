const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');

// 1. INITIATE ROUTE (The Handshake)
// This creates a "Pending" record in your database with a fake Order ID
router.post('/initiate', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // Simulate a Gateway Order ID (e.g., order_mock_abc123)
        const mockOrderId = `order_mock_${Math.random().toString(36).substring(7)}`;

        const newDonation = new Donation({
            userId,
            amount,
            status: 'pending', // PS Requirement: Track all attempts
            transactionId: mockOrderId
        });

        const savedDonation = await newDonation.save();

        res.status(201).json({
            msg: "Mock Gateway: Order Created",
            orderId: mockOrderId,
            donationDatabaseId: savedDonation._id
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. VERIFY ROUTE (The Confirmation)
// This simulates the "Success" signal coming back from the gateway
router.post('/verify', async (req, res) => {
    try {
        const { donationDatabaseId, status } = req.body; // status: 'success' or 'failed'

        // Find the donation and update its status
        const donation = await Donation.findByIdAndUpdate(
            donationDatabaseId,
            { status: status },
            { new: true }
        );

        if (!donation) {
            return res.status(404).json({ msg: "Donation record not found" });
        }

        res.json({
            msg: `Mock Gateway: Payment ${status}`,
            donation
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ADMIN ROUTE: Get total funds and all successful donations

router.get('/total-funds', async (req, res) => {
    try {
        // 1. Find all successful donations
        const successfulDonations = await Donation.find({ status: 'success' });

        // 2. Add them all up starting from 0
        const total = successfulDonations.reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            success: true,
            totalFundsRaised: total,
            count: successfulDonations.length
        });
    } catch (err) {
        console.error("Calculation Error:", err.message);
        res.status(500).json({ success: false, message: "Error calculating total" });
    }
});

// UPDATED ADMIN ROUTE: The "All-in-One" Dashboard Source
router.get('/admin/stats', async (req, res) => {
    try {
        // 1. Get the User Count (Requirement 4.3)
        const totalUsers = await User.countDocuments();

        // 2. Find successful donations for the money calculation
        const successfulDonations = await Donation.find({ status: 'success' })
            .populate('userId', 'name email');

        // 3. Find ALL donations for the Admin Management Table
        // Requirement 4.3: "View all donation records" (Success, Pending, and Failed)
        const allDonations = await Donation.find()
            .populate('userId', 'name email')
            .sort({ timestamp: -1 });

        // 4. Calculate total amount
        const totalFunds = successfulDonations.reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            success: true,
            totalRegistrations: totalUsers,      // For the new User Count box
            totalFundsRaised: totalFunds,        // For the ₹3000 box
            totalDonationsCount: allDonations.length, // Total attempts tracked
            donations: allDonations              // Full list for the management table
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all registered users for Admin Management
router.get('/admin/users', async (req, res) => {
    try {
        // Find all users, sorted by registration date
        const users = await User.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// GET user-specific donations
router.get('/user/:userId', async (req, res) => {
    try {
        const donations = await await Donation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;