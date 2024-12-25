const express = require("express");
const { register, login, sendOtp, verifyOtp, logout, logoutAllDevices, getKycDetails, postKycDetails,  } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.post("/logoutAll", logoutAllDevices)
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)
router.get("/getKyc", getKycDetails)
router.post("/kyc", postKycDetails)

module.exports = router