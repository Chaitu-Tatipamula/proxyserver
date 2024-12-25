const jwt = require("jsonwebtoken")

exports.generateToken = (userId)=>{
    const payload = {id : userId._id, role : userId.role};
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn : "15m"})
}
exports.verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);