const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const router = express.Router();

// 1. IMPORT YOUR MODEL (Change 'NGOStats' to your actual model name)
const Donation = require("../models/Donation"); 

// 1. ROUTE TO INITIATE PAYMENT
router.post("/pay", async (req, res) => {
    console.log("🚀 PAY ROUTE HIT! Amount:", req.body.amount);

    try {
        const { amount, userId } = req.body;
        
        if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY) {
            return res.status(500).json({ error: "Server configuration missing keys." });
        }

        // Unique ID generation to prevent "Try Again" collisions
        const merchantTransactionId = "MT" + Date.now() + Math.floor(Math.random() * 1000); 
        await Donation.create({
            userId: userId,
            amount: amount,
            transactionId: merchantTransactionId, // This MUST match the payload ID
            status: 'pending'
        });
        const payload = {
            merchantId: process.env.PHONEPE_MERCHANT_ID,
            merchantTransactionId,
            merchantUserId: "MUID" + userId,
            amount: amount * 100, // INR to paise
            redirectUrl: `http://localhost:3000/payment-status/${merchantTransactionId}`,
            redirectMode: "REDIRECT",
            paymentInstrument: { type: "PAY_PAGE" }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const string = base64Payload + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const xVerifyChecksum = sha256 + "###" + process.env.PHONEPE_SALT_INDEX;

        const response = await axios.post(
            `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
            { request: base64Payload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerifyChecksum,
                    accept: "application/json",
                },
                family: 4
            }
        );

        res.status(200).json({ url: response.data.data.instrumentResponse.redirectInfo.url });

    } catch (error) {
        console.error("❌ ERROR IN /PAY:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. ROUTE TO VERIFY STATUS & UPDATE DATABASE
// ... (keep your /pay route and imports exactly as they are) ...

// 2. UPDATED ROUTE TO VERIFY STATUS & UPDATE DATABASE
router.get("/status/:transactionId", async (req, res) => {
    const { transactionId } = req.params;
    const merchantId = process.env.PHONEPE_MERCHANT_ID;

    const string = `/pg/v1/status/${merchantId}/${transactionId}` + process.env.PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + process.env.PHONEPE_SALT_INDEX;

    try {
        const response = await axios.get(
            `${process.env.PHONEPE_BASE_URL}/pg/v1/status/${merchantId}/${transactionId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "X-MERCHANT-ID": merchantId,
                    accept: "application/json",
                },
            }
        );

        const apiCode = response.data.code;

        if (apiCode === "PAYMENT_SUCCESS") {
            // ✅ Mark as Success
            await Donation.findOneAndUpdate(
                { transactionId: transactionId }, 
                { status: 'success' }
            );
            console.log(`💰 Database Updated: ${transactionId} is now SUCCESS`);
            return res.json({ success: true, message: "Payment Successful" });

        } else if (apiCode === "PAYMENT_PENDING") {
            // ⏳ Keep as Pending (Requirement 7: Failed and pending must be recorded)
            await Donation.findOneAndUpdate(
                { transactionId: transactionId }, 
                { status: 'pending' }
            );
            return res.json({ success: false, message: "Payment is still pending", status: 'pending' });

        } else {
            // ❌ Mark as Failed explicitly (Requirement 7: No fake success allowed)
            await Donation.findOneAndUpdate(
                { transactionId: transactionId }, 
                { status: 'failed' }
            );
            console.log(`❌ Database Updated: ${transactionId} marked as FAILED`);
            return res.json({ 
                success: false, 
                message: response.data.message || "Payment Failed",
                status: 'failed' 
            });
        }
    } catch (error) {
        console.error("❌ STATUS ERROR:", error.message);
        // Even if the API call fails, the database already has the record as 'pending' 
        // from the /pay route, fulfilling data integrity rules.
        res.status(500).json({ success: false, message: "Verification Failed" });
    }
});

module.exports = router;