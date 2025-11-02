"use client";

import { useState, useEffect, useRef } from "react";
import { socket } from "@/services/socket";
import api from "@/lib/axios";

interface ChatAreaProps {
  selectedChat: string | null;
  isDark: boolean;
  user: any;
}

export default function ChatArea({
  selectedChat,
  isDark,
  user,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [friendInfo, setFriendInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 📨 Lấy tin nhắn cũ + thông tin người bạn đang chat
  useEffect(() => {
    if (!selectedChat || !user) return;

    const fetchData = async () => {
      try {
        const [msgRes, userRes] = await Promise.all([
          api.get(`/messages/${selectedChat}`),
          api.get(`/users/${selectedChat}`),
        ]);

        setMessages(msgRes.data || []);
        setFriendInfo(userRes.data || null);
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
      }
    };

    fetchData();
  }, [selectedChat, user]);

  // 🔌 Socket realtime — join room + nhận tin nhắn
  useEffect(() => {
    if (!user?._id) return;

    // Join 1 lần cho user
    socket.emit("join", user._id);

    const handleReceiveMessage = (msg: any) => {
      const sender = msg.senderId._id || msg.senderId;
      const receiver = msg.receiverId._id || msg.receiverId;

      // Chỉ thêm nếu tin nhắn thuộc cuộc chat hiện tại
      if (sender === selectedChat || receiver === selectedChat) {
        setMessages((prev) => {
          // tránh thêm trùng (so sánh theo _id)
          if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    // Dọn listener cũ trước khi gắn mới
    socket.off("receiveMessage");
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedChat, user?._id]);

  // ✅ Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🚀 Gửi tin nhắn
  const handleSend = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    const newMsg = {
      senderId: user._id,
      receiverId: selectedChat,
      content: message,
    };

    try {
      // Gửi qua socket, backend sẽ lưu và emit lại cho cả 2 người
      socket.emit("sendMessage", newMsg);
      setMessage("");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header chat */}
      <div
        className={`p-4 border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <h2 className="font-semibold text-sm">
          {friendInfo ? friendInfo.username : "Chọn người để trò chuyện"}
        </h2>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id || Math.random()}
            className={`flex ${
              (msg.senderId._id || msg.senderId) === user._id
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                (msg.senderId._id || msg.senderId) === user._id
                  ? "bg-blue-600 text-white rounded-br-none"
                  : isDark
                  ? "bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-none"
                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
              }`}
            >
              <p className="text-sm break-words">{msg.content}</p>
              {msg.createdAt && (
                <span className="text-[10px] opacity-70 block mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Nhập tin nhắn */}
      {selectedChat && (
        <div
          className={`${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          } border-t p-4`}
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm border focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-100 border-gray-200 text-gray-900"
              }`}
            />
            <button
              onClick={handleSend}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
