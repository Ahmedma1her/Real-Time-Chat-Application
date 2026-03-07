const express = require("express");
const router = express.Router();

const { sendMessage, getConversations, getMessages } = require("../controllers/messageController");
const { authenticate } = require("../middleware/authMiddleware");



// All routes are protected with authenticate middleware
router.post("/send", authenticate, sendMessage);
router.get("/conversations", authenticate, getConversations);
router.get("/:userId", authenticate, getMessages);

module.exports = router;
