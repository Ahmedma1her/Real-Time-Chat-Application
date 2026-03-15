const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const Message = require("../models/message");
const Conversation = require("../models/Conversation");

// Store online users { userId: socketId }
const onlineUsers = {};

module.exports = (io) => {

  // Middleware: Verify token on connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Not authorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;  // Attach user to socket
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${userId}`);

    // 1. Add user to onlineUsers
    onlineUsers[userId] = socket.id;

    // 2. Update isOnline in DB
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // 3. Broadcast online status to everyone
    io.emit("userOnline", userId);

    // 4. Send current online users to connected user
    socket.emit("onlineUsers", Object.keys(onlineUsers));

    // ─── Send Message ───────────────────────────────────────
    socket.on("sendMessage", async ({ receiverId, content }) => {
      try {
        // Find or create conversation
        const participantIds = [userId, receiverId].sort();
        let conversation = await Conversation.findOne({
          participants: { $all: participantIds }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: participantIds
          });
        }

        // Save message to DB
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          conversationId: conversation._id,
          content
        });

        // Populate sender info
        const populatedMessage = await message.populate("sender", "username");

        // Send to receiver if online
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", populatedMessage);
        }

        // Send back to sender as confirmation
        socket.emit("messageSent", populatedMessage);

      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── Typing Indicator ───────────────────────────────────
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { userId });
      }
    });

    // ─── Disconnect ─────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);

      // Remove from onlineUsers
      delete onlineUsers[userId];

      // Update isOnline in DB
      await User.findByIdAndUpdate(userId, { isOnline: false });

      // Broadcast offline status
      io.emit("userOffline", userId);
    });
  });
};
