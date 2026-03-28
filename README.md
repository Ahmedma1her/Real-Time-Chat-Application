# 💬 Real-Time Chat Application (Backend)

A scalable backend service for a real-time chat application built with Node.js, Express, and MongoDB.
This project demonstrates authentication, authorization, clean architecture, and real-time communication using Socket.IO.

---

## 🚀 Project Purpose

This project was developed as a Graduation Project to demonstrate full-stack backend development skills including:

- RESTful API design
- Authentication & Authorization
- Database modeling
- Real-time communication
- Clean architecture principles

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication

- JWT (JSON Web Token)
- bcrypt (Password Hashing)

### Real-Time Communication

- Socket.IO

### Tools

- Postman (API Testing)
- MongoDB Compass

---

## ✨ Features

### 🔐 Authentication

- User Registration
- User Login
- Secure password hashing using bcrypt
- JWT-based authentication

### 🛡️ Authorization

- Role-based access control (Admin / User)

### 💬 Chat System

- One-to-one messaging
- Real-time messaging using Socket.IO
- Typing indicators
- Online / Offline user status
- Message persistence (stored in database)

---

## 🧠 System Architecture

The project follows the **MVC pattern**:

- **Models** → Handle database structure (User, Message, Conversation)
- **Controllers** → Handle business logic
- **Routes** → Define API endpoints

### Additional Concepts:

- Middleware for authentication
- Centralized error handling
- Environment-based configuration

---

## 🔄 Application Flow

1. User registers or logs in
2. Server returns a JWT token
3. Client stores and uses the token for authenticated requests
4. Client establishes a Socket.IO connection using the token
5. Users can:
   - Send messages
   - Receive messages in real-time
   - See typing indicators
   - Track online/offline users

---

## 🔌 API Endpoints (Example)

### Auth

- `POST /api/auth/register` → Register new user
- `POST /api/auth/login` → Login user

### Users

- `GET /api/users` → Get all users (excluding current user)

### Conversations

- `GET /api/conversations` → Get all conversations for logged-in user

### Messages

- `GET /api/messages/:conversationId` → Get messages for a conversation

---

## ⚡ Socket Events

### Client → Server

- `sendMessage` → Send a message
- `typing` → Notify typing
- `stopTyping` → Stop typing

### Server → Client

- `receiveMessage` → Receive new message
- `messageSent` → Confirm message sent
- `userOnline` → User comes online
- `userOffline` → User goes offline
- `onlineUsers` → List of online users
- `userTyping` → Typing indicator
- `userStopTyping` → Stop typing indicator

---

## 🗄️ Database Design

### Users

- username
- email
- password
- role
- isOnline

### Conversations

- participants (array of user IDs)

### Messages

- sender
- receiver
- conversationId
- content
- timestamps

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## ▶️ How to Run the Project

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# Navigate into the project
cd your-repo-name

# Install dependencies
npm install

# Run the server
npm run dev
```

---

## 🧪 Testing

- Use Postman to test API endpoints
- Use multiple clients (or browser tabs) to test real-time chat

---

## 📈 Future Improvements

- Group chat support
- Message status (Delivered / Seen)
- File sharing (images, videos)
- Push notifications
- Pagination for messages

---

## 👨‍💻 Author

Developed by **Ahmed Maher**
Graduation Project – Full Stack Development Track

---

## ⭐ Final Note

This project focuses on building a **real-world backend system** that combines REST APIs with real-time communication, making it a strong portfolio project for backend and full-stack roles.
