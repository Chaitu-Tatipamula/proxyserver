const rateLimiter = require("express-rate-limit")

const limiter = rateLimiter.rateLimit({
    windowMs : 60*60*1000,
    max : 100,
    message : "request limit reached, try again later"
});

module.exports = limiter