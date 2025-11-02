import User from "../models/User.js";

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ protectedRoute
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi gọi authMe:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-hashedPassword -__v");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }
    res.json(user);
  } catch (err) {
    console.error("Lỗi getUserById:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
