const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

// Get all users (protected)
router.get("/", authenticate, getAllUsers);

// Get user by ID (protected)
router.get("/:userId", authenticate, getUserById);

module.exports = router;
