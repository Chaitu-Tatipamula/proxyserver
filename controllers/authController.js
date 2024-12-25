const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { v4 : uuidv4 } = require("uuid")
const otpService = require("../services/otpService")
const tokenService = require("../services/tokenService")
const logger = require("../utils/logger")
const { User,KYC } = require("../models/userModel")

exports.register = async (req,res) => {
    try {
        const {username, dob, referralCode, passCode, phoneNumber} = req.body;

        const existingUser = await User.findOne({username});
        if(existingUser){ 
            logger.warn(`Registration failed Username ${username} already exists`)
            return res.status(400).json({message : "User already exists"})
        }

        const hashedPasscode = await bcrypt.hash(passCode, 10)
        
        const user = new User({
            userId : uuidv4(),
            username,
            dob,
            referralCode,
            passCode : hashedPasscode,
            phoneNumber : phoneNumber
        })

        await user.save()
        logger.info(`User registered : ${username}`)
        res.status(201).json({message : "User registerd Successfully"})
    } catch (error) {
        res.status(500).json({err : error.message})
    }
}


exports.login = async (req,res) => {
    try {
        const {username, passCode, otp} = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;
        const user = await User.findOne({username});
        if(!user){
            logger.warn(`Login attempt failed Username ${username} doesnot exist`)
            return res.status(404).json({message : "Not found"})
        } 
        
        const isMatch = await bcrypt.compare(passCode, user.passCode);
        if(!isMatch){
            logger.warn(`Login attempt failed passCode doesnot match`)
            return res.status(401).json({message : "Invalid credentials"})
        }

        // const isotpValid = await verifyOtp(username, otp);
        // if(!isotpValid){
        //     logger.warn(`Login attempt failed Invalid otp provided`)
        //     return res.status(401).json({message : "Invalid otp"})
        // }

        const token = tokenService.generateToken(user)

        const maxDevices = 5;
        if (user.deviceTokens.length >= maxDevices) {
            return res.status(403).json({err : "Forbidden: Devices limit reached"})
        }
        user.deviceTokens.push(token);
        await user.save();
        logger.info(`User LoggedIn : ${username}`)
        res.status(201).json({ token })
    } catch (error) {
        res.status(500).json({err : error.message})
    }
}

exports.logout = async (req, res) => {
    try {
      const token = req.header("Authorization").replace("Bearer ", "");
      const user = await User.findOne({ deviceTokens: token });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      user.deviceTokens = user.deviceTokens.filter((t) => t !== token);
      await user.save();
  
      logger.info(`User logged out: ${user.username}`);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      logger.warn(`User logout error: ${error}`);
      res.status(500).json({ err: error.message });
    }
  };
  exports.logoutAllDevices = async (req, res) => {
    try {
      const token = req.header("Authorization").replace("Bearer ", "");
      const user = await User.findOne({ deviceTokens: token });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      user.deviceTokens = [];
      await user.save();
      
      logger.info(`User logged out: ${user.username}`);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      logger.warn(`Devices logout error: ${error}`);
      res.status(500).json({ err: error.message });
    }
  };

exports.sendOtp = async (req,res) => {
    try {
        const {username} = req.body;
        
        const user = await User.findOne({username});
        if(!user){
            logger.warn(`Login attempt failed Username ${username} doesnot exist`)
            return res.status(404).json({message : "Not found"})
        }
        
        const response = await otpService.generateAndSendOtp(username, user.phoneNumber);
        
        logger.info(`OTP generated and sent to Telegram for ${username} and telegramid ${user.telegramUserId} `);
        res.status(201).json({ message: "OTP sent to Telegram", response});
    } catch (error) {
        res.status(500).json({err : error.message})
    }
}
exports.verifyOtp = async (req,res) => {
    try {
        const {request_id, code} = req.body;
        
        // const user = await User.findOne({username});
        // if(!user){
        //     logger.warn(`Login attempt failed Username ${username} doesnot exist`)
        //     return res.status(404).json({message : "Not found"})
        // }
        
        const response = await otpService.verifyOtp(request_id, code);
        
        logger.info(`OTP verified`);
        res.status(201).json({ status : response });
    } catch (error) {
        res.status(500).json({err : error.message})
    }
}


exports.postKycDetails = async (req, res) => {
    try {
      const {
        userId,
        fullName,
        aadhaarNumber,
        address,
        city,
        country,
        zipCode,
        id,
        selfie,
      } = req.body;
  
      const user = req.body.userId; // Assume `req.user` is set after authentication middleware
  
      // Check if the user already has KYC details submitted
      const existingKyc = await KYC.findOne({ user });
      if (existingKyc) {
        logger.warn(`KYC submission failed: User ${userId} already submitted KYC`);
        return res
          .status(400)
          .json({ message: "KYC details already submitted." });
      }
  
      // Create a new KYC record
      const kycDetails = new KYC({
        userId,
        fullName,
        aadhaarNumber,
        address,
        city,
        country,
        zipCode,
        id,
        selfie,
      });
  
      await kycDetails.save();
  
      // Update user's KYC status
      await User.findByIdAndUpdate(userId, { kycStatus: "Pending" });
  
      logger.info(`KYC details submitted for User ${userId}`);
      res.status(201).json({ message: "KYC details submitted successfully." });
    } catch (error) {
      logger.error(`Error submitting KYC details: ${error.message}`);
      res.status(500).json({ err: "Kyc submitted already" });
    }
  };
  
  exports.getKycDetails = async (req, res) => {
    try {
      const userId = req.headers.userid;
      
      const kycDetails = await KYC.findOne({ userId });
  
      if (!kycDetails) {
        logger.warn(`KYC details not found for User ${userId}`);
        return res.status(404).json({ message: "KYC details not found." });
      }
  
      logger.info(`Fetched KYC details for User ${userId}`);
      res.status(200).json({ kycDetails });
    } catch (error) {
      logger.error(`Error fetching KYC details: ${error.message}`);
      res.status(500).json({ err: error.message });
    }
  };