const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const Message = require("../models/message");
const Conversation = require("../models/Conversation");

// Store online users as { userId: Set<socketId> }
const onlineUsers = {};

// Emit an event to every active socket for a user.
const emitToUserSockets = (io, userSockets, eventName, payload) => {
  if (!userSockets) {
    return;
  }

  for (const socketId of userSockets) {
    io.to(socketId).emit(eventName, payload);
  }
};

module.exports = (io) => {
  // Middleware: verify token on socket connection.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Not authorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`? User connected: ${userId} | Socket ID: ${socket.id}`);

    // Track each socket so one user can stay online across multiple tabs.
    onlineUsers[userId] = onlineUsers[userId] || new Set();
    onlineUsers[userId].add(socket.id);
    console.log("?? Online users:", Object.keys(onlineUsers));

    // Update online status and broadcast the current presence state.
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("userOnline", userId);
    io.emit("onlineUsers", Object.keys(onlineUsers));

    // Send and persist a message.
    socket.on("sendMessage", async ({ receiverId, content }) => {
      try {
        const normalizedContent = typeof content === "string" ? content.trim() : "";
        if (!receiverId || !normalizedContent) {
          socket.emit("error", { message: "Receiver ID and content are required" });
          return;
        }

        if (receiverId === userId) {
          socket.emit("error", { message: "Cannot send message to yourself" });
          return;
        }

        const receiver = await User.findById(receiverId).select("_id");
        if (!receiver) {
          socket.emit("error", { message: "Receiver not found" });
          return;
        }

        console.log(`?? Message from ${userId} to ${receiverId}: "${normalizedContent}"`);

        // Find the existing conversation or create it on the first message.
        const participantIds = [userId, receiverId].sort();
        let conversation = await Conversation.findOne({
          participants: { $all: participantIds }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: participantIds
          });
        } else {
          // Touch updatedAt so conversation ordering stays fresh.
          conversation.updatedAt = new Date();
          await conversation.save();
        }

        // Save the message and include sender username for the client.
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          conversationId: conversation._id,
          content: normalizedContent
        });

        const populatedMessage = await message.populate("sender", "username");

        // Deliver to every active receiver tab/socket.
        emitToUserSockets(io, onlineUsers[receiverId], "receiveMessage", populatedMessage);

        // Confirm back to the sender.
        socket.emit("messageSent", populatedMessage);
        console.log("? Message sent confirmation to sender");
      } catch (error) {
        console.error("? Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicators are also sent to every receiver socket.
    socket.on("typing", ({ receiverId }) => {
      emitToUserSockets(io, onlineUsers[receiverId], "userTyping", { userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      emitToUserSockets(io, onlineUsers[receiverId], "userStopTyping", { userId });
    });

    // Remove just this socket on disconnect and mark offline only when none remain.
    socket.on("disconnect", async () => {
      console.log(`? User disconnected: ${userId}`);

      onlineUsers[userId]?.delete(socket.id);

      if (onlineUsers[userId]?.size === 0) {
        delete onlineUsers[userId];
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit("userOffline", userId);
      }

      io.emit("onlineUsers", Object.keys(onlineUsers));
    });
  });
};
