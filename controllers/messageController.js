const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const User = require("../models/Users");
const { sendMessageSchema } = require("./validation/messageValidation");

// Send a message
const sendMessage = async (req, res) => {
  try {
    // Validate input
    const { error } = sendMessageSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Prevent sending message to yourself
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send message to yourself" });
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

// Get messages with specific user (backward compatibility)
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

// Mark messages as read (backward compatibility)
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const participantIds = [currentUserId, userId].sort();
    const conversation = await Conversation.findOne({
      participants: { $all: participantIds }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        receiver: currentUserId,
        sender: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { sendMessage, getMessages, markAsRead };
