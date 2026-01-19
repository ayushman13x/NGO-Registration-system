const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to the registered user
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'success', 'failed'], 
        default: 'pending' 
    }, // Track status 
    transactionId: { type: String }, // For genuine payment confirmation [cite: 61]
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', DonationSchema);