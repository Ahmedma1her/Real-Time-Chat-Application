require("dotenv").config();

const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 8000;

const app = express();


// DB
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

// middlewares
app.use(cors());
// added cors as it enables the backend to receive requests from different origins (frontend server)// still need to search more about it but understood the concept
app.use(express.json());




// Routes
const authRouter=require("./routes/authRoutes")

const messageRouter = require("./routes/messageRoutes");

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
















app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
