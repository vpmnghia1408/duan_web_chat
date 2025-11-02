import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { chatSocket } from "./sockets/chatSocket.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

// Gắn io vào app để controller có thể truy cập
app.set("io", io);

// Lưu map userId ↔ socketId
const userSockets = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSockets.set(userId, socket.id);
    socket.join(userId); // để có thể io.to(userId).emit()
  }

  socket.on("disconnect", () => {
    if (userId) userSockets.delete(userId);
  });
});

// =======================
// 🧩 MIDDLEWARES
// =======================
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// =======================
// 🌐 ROUTES
// =======================
app.use("/api/auth", authRoute);
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);

// =======================
// ⚙️ DATABASE & SERVER START
// =======================
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server (Express + Socket.IO) đang chạy trên cổng ${PORT}`);
  });
});

// =======================
// 💬 SOCKET.IO CHAT SETUP
// =======================
chatSocket(io);
