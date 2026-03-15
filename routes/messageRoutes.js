const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageController");

// Send message
router.post("/send", authenticate, sendMessage);

// Backward compatibility routes
router.get("/:userId", authenticate, getMessages);
router.put("/read/:userId", authenticate, markAsRead);

module.exports = router;
