const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { v4 : uuidv4 } = require("uuid")
const {User} = require("../models/userModel")
const otpService = require("../services/otpService")
const tokenService = require("../services/tokenService")

exports.getProfile = async (req,res) => {
    try {

        const user = await User.findById(req.user.id).select("-passCode");
        
        if(!user) return res.status(400).json({message : "User not found"})

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({err : error.message})
    }
}