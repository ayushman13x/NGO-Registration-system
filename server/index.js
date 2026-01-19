const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();
console.log("--- DEBUGGING KEYS ---");
console.log("Merchant ID:", process.env.PHONEPE_MERCHANT_ID);
console.log("Salt Key exists:", !!process.env.PHONEPE_SALT_KEY); // true or false
console.log("Base URL:", process.env.PHONEPE_BASE_URL);
const app = express();
app.use(cors());
app.use(express.json());
// This tells the server: "Any request sent to /api/auth should use the auth.js file"
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use("/api/payment", paymentRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connection Successful!"))
    .catch((err) => console.log("❌ Connection Failed:", err));

const PORT = process.env.PORT || 5000;
// Global Error Handler - Put this at the end of index.js
app.use((err, req, res, next) => {
    console.error("🔥 ACTUAL SERVER ERROR:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));