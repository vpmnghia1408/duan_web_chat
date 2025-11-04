"use client";

import { useState, useEffect, useRef } from "react";
import { socket } from "@/services/socket";
import api from "@/lib/axios";
import { MessageCircle, Send } from "lucide-react";

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

    socket.emit("join", user._id);

    const handleReceiveMessage = (msg: any) => {
      const sender = msg.senderId._id || msg.senderId;
      const receiver = msg.receiverId._id || msg.receiverId;

      if (sender === selectedChat || receiver === selectedChat) {
        setMessages((prev) => {
          if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.off("receiveMessage");
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedChat, user?._id]);

  // ✅ Cuộn xuống cuối khi có tin nhắn mới
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
      socket.emit("sendMessage", newMsg);
      setMessage("");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    }
  };

  // 💤 Nếu chưa chọn chat
  if (!selectedChat) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <MessageCircle
            className={`w-20 h-20 mx-auto mb-4 ${
              isDark ? "text-gray-700" : "text-gray-300"
            }`}
          />
          <h3
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Chọn một cuộc trò chuyện
          </h3>
          <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Chọn bạn bè từ danh sách để bắt đầu nhắn tin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b backdrop-blur-sm ${
          isDark
            ? "bg-gray-900/95 border-gray-800"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
              {friendInfo?.username?.[0]?.toUpperCase() || "?"}
            </div>
            {friendInfo?.status === "online" && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h2 className="font-semibold">
              {friendInfo?.username || "Đang tải..."}
            </h2>
            <p
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {friendInfo?.status === "online"
                ? "Đang hoạt động"
                : "Không hoạt động"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isOwn = (msg.senderId._id || msg.senderId) === user._id;
          const showAvatar =
            idx === 0 ||
            (messages[idx - 1].senderId._id || messages[idx - 1].senderId) !==
              (msg.senderId._id || msg.senderId);

          return (
            <div
              key={msg._id || Math.random()}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 max-w-md ${
                  isOwn ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isOwn && (
                  <div
                    className={`w-8 h-8 flex-shrink-0 ${
                      showAvatar ? "" : "invisible"
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {friendInfo?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      isOwn
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
                        : isDark
                        ? "bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                  {msg.createdAt && (
                    <span
                      className={`text-[10px] mt-1 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div
        className={`p-4 border-t backdrop-blur-sm ${
          isDark
            ? "bg-gray-900/95 border-gray-800"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className={`flex-1 rounded-xl px-4 py-3 text-sm border transition-colors ${
              isDark
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          <button
            onClick={handleSend}
            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
