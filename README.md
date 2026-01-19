# NGO Registration and Donation Management System

A secure MERN-stack web application designed for Non-Governmental Organizations (NGOs) to manage donor registrations and track contributions transparently.

## 📌 Project Objective
This system ensures that user data is captured independently of the donation outcome. It provides a secure environment for donors to contribute and for administrators to monitor registrations and verified donation records.

## 🚀 Key Features
### User Side
- **Secure Registration/Login**: Uses Bcrypt for password hashing.
- **Donation Tracking**: Users can donate any amount via PhonePe Sandbox.
- **Personal History**: Users view their own registration details and donation status (Success/Pending/Failed).

### Admin Side
- **Management Dashboard**: Visual statistics for total funds and registrations.
- **Data Export**: Ability to export donation and registration records as CSV for offline auditing.
- **Role-Based Access**: Dedicated secure portal for administrators.

## 🛠️ Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js & Express.js
- **Database**: MongoDB (Atlas)
- **Payment Gateway**: PhonePe Integration (Sandbox Mode)

## 🏗️ System Architecture
The application uses a decoupled architecture where user registration data is stored independently of the donation process. This ensures that even if a payment is abandoned, the NGO retains the supporter's contact information.

