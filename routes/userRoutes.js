const express = require("express");
const { getProfile } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/roleMiddleware")


router.get("/profile", authMiddleware("user"), getProfile)

module.exports = router;