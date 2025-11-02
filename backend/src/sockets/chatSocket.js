import { Message } from "../models/Message.js";
import Friend from "../models/friendModel.js";

export const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Khi user join phòng riêng của họ
    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      console.log(`✅ User ${userId} joined room ${userId}`);
    });

    // Khi gửi tin nhắn
    socket.on(
      "sendMessage",
      async ({ senderId, receiverId, content, imgUrl }) => {
        try {
          if (!senderId || !receiverId || !content) {
            socket.emit("errorMessage", "Thiếu dữ liệu tin nhắn!");
            return;
          }

          // 🔒 Kiểm tra có phải bạn bè không
          const isFriend = await Friend.findOne({
            $or: [
              { sender: senderId, receiver: receiverId, status: "accepted" },
              { sender: receiverId, receiver: senderId, status: "accepted" },
            ],
          });

          if (!isFriend) {
            socket.emit("errorMessage", "Hai người chưa phải bạn bè!");
            return;
          }

          // 💾 Lưu tin nhắn vào DB
          const message = await Message.create({
            senderId,
            receiverId,
            content,
            imgUrl,
          });

          // 🧠 Populate thông tin người gửi & người nhận
          const populatedMsg = await message.populate([
            { path: "senderId", select: "username displayName" },
            { path: "receiverId", select: "username displayName" },
          ]);

          // 📡 Gửi tin nhắn realtime cho cả 2 bên
          io.to(senderId.toString()).emit("receiveMessage", populatedMsg);
          io.to(receiverId.toString()).emit("receiveMessage", populatedMsg);

          console.log(`💬 Tin nhắn từ ${senderId} → ${receiverId}: ${content}`);
        } catch (error) {
          console.error("❌ Lỗi gửi tin nhắn:", error);
          socket.emit("errorMessage", "Lỗi server khi gửi tin nhắn!");
        }
      }
    );

    // Khi ngắt kết nối
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
};
