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

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${userId} | Socket ID: ${socket.id}`);

    // 1. Add user to onlineUsers
   onlineUsers[userId] = onlineUsers[userId] || new Set();
  onlineUsers[userId].add(socket.id);
    console.log(`📊 Online users:`, Object.keys(onlineUsers));

    // 2. Update isOnline in DB
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // 3. Broadcast online status to everyone
    io.emit("userOnline", userId);

    // 4. Send current online users to EVERYONE (not just the new user)
    io.emit("onlineUsers", Object.keys(onlineUsers));  // 

    // ─── Send Message ───────────────────────────────────────
    socket.on("sendMessage", async ({ receiverId, content }) => {
      try {
        console.log(`📤 Message from ${userId} to ${receiverId}: "${content}"`);

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
       const receiverSockets = onlineUsers[receiverId];
        if (receiverSockets) {
         for (const id of receiverSockets) {
         io.to(id).emit("receiveMessage", populatedMessage);
  }


        } else {
          console.log(`⚠️ Receiver ${receiverId} is offline`);
        }

        // Send back to sender as confirmation
        socket.emit("messageSent", populatedMessage);
        console.log(`✅ Message sent confirmation to sender`);

      } catch (error) {
        console.error(`❌ Error sending message:`, error);
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
      console.log(`❌ User disconnected: ${userId}`);

      // Remove from onlineUsers
      onlineUsers[userId]?.delete(socket.id);

      if (onlineUsers[userId]?.size === 0) {
      delete onlineUsers[userId];
      await User.findByIdAndUpdate(userId, { isOnline: false });
  io.emit("userOffline", userId);
}


      // Update isOnline in DB
      await User.findByIdAndUpdate(userId, { isOnline: false });

      // Broadcast offline status
      io.emit("userOffline", userId);
      
      // Broadcast updated online users list to everyone
      io.emit("onlineUsers", Object.keys(onlineUsers));  
    });
  });
};
