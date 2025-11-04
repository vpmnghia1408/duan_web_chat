"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Users,
  UserPlus,
  Check,
  X,
  Moon,
  Sun,
  Clock,
  Search,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "@/lib/axios";
import Logout from "@/components/auth/Logout";

interface SidebarProps {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  user: any;
}

export default function Sidebar({
  selectedChat,
  onSelectChat,
  isDark,
  onToggleDark,
  user,
}: SidebarProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 📥 Lấy danh sách bạn bè và lời mời
  const fetchFriends = async () => {
    try {
      const resFriends = await api.get("/friends");
      const accepted = resFriends.data.filter(
        (f: any) => f.status === "accepted"
      );
      setFriends(accepted);

      const resPending = await api.get("/friends/pending");
      const pending = resPending.data;
      const sent = pending.filter((f: any) => f.sender._id === user._id);
      const received = pending.filter((f: any) => f.receiver._id === user._id);

      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn:", err);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchFriends();

    // ✅ Kết nối socket và lắng nghe realtime
    const socket = io("http://localhost:5001", {
      query: { userId: user._id },
    });

    socket.on("new_friend_request", (data) => {
      console.log("📥 Có lời mời kết bạn mới:", data);
      setReceivedRequests((prev) => [...prev, data.request]);
    });

    socket.on("friend_request_accepted", () => {
      fetchFriends();
    });

    return () => socket.disconnect();
  }, [user]);

  // ➕ Gửi lời mời kết bạn
  const handleAddFriend = async () => {
    if (!username.trim()) return alert("Nhập username người cần kết bạn!");
    try {
      const res = await api.post("/friends/request", { username });
      const { request } = res.data;
      alert("✅ Đã gửi lời mời kết bạn!");
      setUsername("");
      setSentRequests((prev) => [...prev, request]);
    } catch (err: any) {
      alert("❌ " + (err.response?.data?.message || "Lỗi hệ thống"));
    }
  };

  // 🤝 Chấp nhận lời mời
  const handleAccept = async (friendId: string) => {
    try {
      await api.put(`/friends/respond/${friendId}`, { action: "accept" });
      alert("🤝 Đã chấp nhận lời mời!");
      fetchFriends();
    } catch (err) {
      console.error("Lỗi chấp nhận:", err);
    }
  };

  // 🚫 Từ chối lời mời
  const handleReject = async (friendId: string) => {
    try {
      await api.put(`/friends/respond/${friendId}`, { action: "reject" });
      alert("🚫 Đã từ chối lời mời!");
      fetchFriends();
    } catch (err) {
      console.error("Lỗi từ chối:", err);
    }
  };

  // ❌ Hủy lời mời đã gửi
  const handleCancel = async (friendId: string) => {
    try {
      await api.delete(`/friends/cancel/${friendId}`);
      alert("❌ Đã hủy lời mời!");
      setSentRequests((prev) => prev.filter((r) => r._id !== friendId));
    } catch (err) {
      console.error("Lỗi khi hủy:", err);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const friend = f.sender._id === user._id ? f.receiver : f.sender;
    return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 🧭 UI Giao diện (giữ nguyên từ bản đẹp)
  return (
    <div
      className={`w-80 flex flex-col transition-colors duration-200 ${
        isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 border-b ${
          isDark ? "border-gray-800" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle
              className={`w-6 h-6 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            />
            <h1 className="text-xl font-bold">Chats</h1>
          </div>
          <button
            onClick={onToggleDark}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${
              isDark
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bạn bè..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
              isDark
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Add friend section */}
      <div
        className={`p-4 border-b ${
          isDark ? "border-gray-800" : "border-gray-200"
        }`}
      >
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập username..."
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              isDark
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          <button
            onClick={handleAddFriend}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Received requests */}
        {receivedRequests.length > 0 && (
          <div
            className={`p-4 border-b ${
              isDark ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <h3
              className={`font-semibold mb-3 text-sm flex items-center gap-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Lời mời kết bạn ({receivedRequests.length})
            </h3>
            <div className="space-y-2">
              {receivedRequests.map((r) => (
                <div
                  key={r._id}
                  className={`p-3 rounded-xl transition-colors ${
                    isDark
                      ? "bg-gray-800 hover:bg-gray-750"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {r.sender.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">
                        {r.sender.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r._id)}
                      className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleReject(r._id)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      <X className="w-3 h-3" />
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent requests */}
        {sentRequests.length > 0 && (
          <div
            className={`p-4 border-b ${
              isDark ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <h3
              className={`font-semibold mb-3 text-sm flex items-center gap-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              Đã gửi lời mời ({sentRequests.length})
            </h3>
            <div className="space-y-2">
              {sentRequests.map((r) => (
                <div
                  key={r._id}
                  className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                    isDark ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {r.receiver.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{r.receiver.username}</span>
                  </div>
                  <button
                    onClick={() => handleCancel(r._id)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div className="p-4">
          <h3
            className={`font-semibold mb-3 text-sm flex items-center gap-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Bạn bè ({filteredFriends.length})
          </h3>
          {filteredFriends.length > 0 ? (
            <div className="space-y-1">
              {filteredFriends.map((f) => {
                const friend =
                  f.sender._id === user._id ? f.receiver : f.sender;
                const isSelected = selectedChat === friend._id;
                return (
                  <div
                    key={f._id}
                    onClick={() => onSelectChat(friend._id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : isDark
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-11 h-11 bg-gradient-to-br ${
                            isSelected
                              ? "from-white/20 to-white/10"
                              : "from-indigo-400 to-purple-400"
                          } rounded-full flex items-center justify-center text-white font-semibold`}
                        >
                          {friend.username[0].toUpperCase()}
                        </div>
                        {friend.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {friend.username}
                        </p>
                        <p
                          className={`text-xs ${
                            isSelected
                              ? "text-white/80"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {friend.status === "online"
                            ? "Đang hoạt động"
                            : "Không hoạt động"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              className={`text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              } text-center py-8`}
            >
              {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`p-4 border-t ${
          isDark ? "border-gray-800" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {user?.username || "User"}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Đang hoạt động
              </p>
            </div>
          </div>
          <Logout />
        </div>
      </div>
    </div>
  );
}
