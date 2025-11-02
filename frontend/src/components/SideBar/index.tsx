import { useEffect, useState } from "react";
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

      // ✅ cập nhật ngay phía người gửi
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

  return (
    <div
      className={`w-64 p-4 flex flex-col border-r ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">FRIENDS</h2>
        <button
          onClick={onToggleDark}
          className="px-2 py-1 text-xs border rounded"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Ô nhập username */}
      <div className="flex gap-2 mb-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập username..."
          className="flex-1 border rounded px-2 text-sm"
        />
        <button
          onClick={handleAddFriend}
          className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
        >
          +
        </button>
      </div>

      {/* Lời mời nhận được */}
      {receivedRequests.length > 0 && (
        <>
          <h3 className="font-semibold mb-2 text-sm">📥 Lời mời bạn nhận</h3>
          {receivedRequests.map((r) => (
            <div
              key={r._id}
              className="flex justify-between items-center mb-2 text-sm"
            >
              <span>{r.sender.username}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAccept(r._id)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                  Chấp nhận
                </button>
                <button
                  onClick={() => handleReject(r._id)}
                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Lời mời đã gửi */}
      {sentRequests.length > 0 && (
        <>
          <h3 className="font-semibold mb-2 mt-3 text-sm">
            📤 Lời mời bạn đã gửi
          </h3>
          {sentRequests.map((r) => (
            <div
              key={r._id}
              className="flex justify-between items-center mb-2 text-sm"
            >
              <span>{r.receiver.username}</span>
              <button
                onClick={() => handleCancel(r._id)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Hủy
              </button>
            </div>
          ))}
        </>
      )}

      {/* Danh sách bạn bè */}
      <h3 className="font-semibold mt-4 mb-2 text-sm">👥 Danh sách bạn bè</h3>
      {friends.length > 0 ? (
        friends.map((f) => {
          const friend = f.sender._id === user._id ? f.receiver : f.sender;
          return (
            <div
              key={f._id}
              onClick={() => onSelectChat(friend._id)}
              className={`p-2 rounded cursor-pointer text-sm ${
                selectedChat === friend._id
                  ? "bg-blue-600 text-white"
                  : isDark
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-200"
              }`}
            >
              {friend.username}
            </div>
          );
        })
      ) : (
        <p className="text-xs text-gray-500">Chưa có bạn bè nào</p>
      )}

      {/* Footer */}
      <div
        className={`mt-auto text-center text-xs py-3 border-t ${
          isDark
            ? "border-gray-700 text-gray-400"
            : "border-gray-200 text-gray-600"
        }`}
      >
        <p>
          Đăng nhập: <span className="font-semibold">{user?.username}</span>
        </p>
        <div className="mt-2">
          <Logout />
        </div>
      </div>
    </div>
  );
}
