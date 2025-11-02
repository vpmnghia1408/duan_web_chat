import { Message } from "../models/Message.js";

// 📨 Gửi tin nhắn
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, imgUrl } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      imgUrl,
    });

    const populatedMsg = await message.populate([
      { path: "senderId", select: "username displayName" },
      { path: "receiverId", select: "username displayName" },
    ]);

    return res.status(201).json(populatedMsg);
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 📜 Lấy lịch sử chat giữa 2 user
export const getMessages = async (req, res) => {
  try {
    // ✅ Đúng tên param trong route
    const { receiverId } = req.params;
    const currentUserId = req.user._id;

    // 🔍 Lấy tin nhắn giữa 2 người (dù ai gửi)
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId },
        { senderId: receiverId, receiverId: currentUserId },
      ],
    })
      .populate("senderId", "username displayName")
      .populate("receiverId", "username displayName")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
