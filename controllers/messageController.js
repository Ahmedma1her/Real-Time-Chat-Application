const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const User = require("../models/Users");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content required" });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Find or create conversation
    const participantIds = [senderId, receiverId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participantIds }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantIds
      });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversationId: conversation._id,
      content
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all conversations for logged-in user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "username email isOnline")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages in a conversation with specific user
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const participantIds = [currentUserId, userId].sort();
    const conversation = await Conversation.findOne({
      participants: { $all: participantIds }
    });

    if (!conversation) {
      return res.json([]);
    }

    const messages = await Message.find({
      conversationId: conversation._id
    })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { sendMessage, getConversations, getMessages };
