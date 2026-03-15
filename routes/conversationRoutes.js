const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { 
  getConversations, 
  getConversationMessages, 
  markConversationAsRead 
} = require("../controllers/conversationController");

// Get all conversations
router.get("/", authenticate, getConversations);

// Get messages in a conversation
router.get("/:conversationId/messages", authenticate, getConversationMessages);

// Mark conversation as read
router.put("/:conversationId/read", authenticate, markConversationAsRead);

module.exports = router;
