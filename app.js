require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
  }
};
connectDB();

app.use(cors());
app.use(express.json());

const authRouter = require("./routes/authRoutes");
const messageRouter = require("./routes/messageRoutes");
const userRouter = require("./routes/userRoutes");
const conversationRouter = require("./routes/conversationRoutes");

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/users", userRouter);
app.use("/api/conversations", conversationRouter);

// Socket.io connection
const socketHandler = require("./socket/socketHandler");
socketHandler(io);

// 404 handler 
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});





server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
