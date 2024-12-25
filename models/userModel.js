const mongoose = require("mongoose");

// KYC Schema
const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Reference to User
  fullName: { type: String, required: true },
  aadhaarNumber: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  id: { type: String, required: true }, // Path/URL to the uploaded ID document
  selfie: { type: String, required: true }, // Path/URL to the uploaded selfie
  submittedAt: { type: Date, default: Date.now }, // Timestamp of submission
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }, // KYC status
});

const KYC = mongoose.model("KYC", kycSchema);

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  referralCode: { type: String },
  phoneNumber: { type: Number },
  passCode: { type: String, required: true },
  role: { type: String, default: "user" },
  deviceTokens: { type: [String], default: [] },
  kycStatus: { type: String, enum: ["Pending", "Approved", "Rejected","Not Submitted"], default: "Not Submitted" }, // KYC status in User model
  kycDetails: { type: mongoose.Schema.Types.ObjectId, ref: "KYC" }, // Reference to KYC
});

const User = mongoose.model("User", userSchema);

module.exports = { User, KYC };
