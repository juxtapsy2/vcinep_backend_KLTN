import { sendResponse } from "../utils/responseHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const getUserById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return sendResponse(res, 401, false, "Thiếu token xác thực");
    }
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      return sendResponse(
        res,
        401,
        false,
        "Token không hợp lệ hoặc đã hết hạn"
      );
    }
    if (decodedToken.userId !== req.params.id) {
      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền truy cập thông tin của người dùng này"
      );
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }
    return sendResponse(
      res,
      200,
      true,
      "Lấy thông tin người dùng thành công",
      user
    );
  } catch (error) {
    console.error("Lỗi trong getUserById:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    // Kiểm tra avatar có được gửi lên và khác rỗng
    if (!avatar || avatar.trim() === "") {
      return sendResponse(res, 400, false, "Avatar không được để trống");
    }
    // Cập nhật avatar trong database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId, // Lấy user id từ middleware auth
      { avatar: avatar },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }
    return sendResponse(
      res,
      200,
      true,
      "Cập nhật avatar thành công",
      updatedUser
    );
  } catch (error) {
    console.error("Lỗi trong updateAvatar:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
const buildUserQuery = (baseQuery, username, role, status) => {
  if (username && username.trim() !== "") {
    baseQuery.username = { $regex: username.trim(), $options: "i" }; // Tìm kiếm không phân biệt hoa thường
  }

  if (role && role.trim() !== "") {
    baseQuery.role = role.trim();
  }

  if (status && status.trim() !== "") {
    baseQuery.status = status.trim();
  }

  return baseQuery;
};
// Lấy danh sách tất cả users
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10; // Số lượng user mỗi trang
    const skip = (page - 1) * limit;

    const { username = "", role = "", status = "" } = req.body; // Nhận thêm role và status từ body

    // Xây dựng query tìm kiếm
    let query = buildUserQuery({}, username, role, status);

    // Thực hiện truy vấn
    const users = await User.find(query)
      .select("-password") // Không trả về trường password
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query); // Tổng số user khớp query
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      message:
        users.length > 0
          ? "Lấy danh sách user thành công"
          : "Không có user nào khớp với điều kiện lọc",
      data: {
        users,
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi trong getAllUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

// Xóa user (Cập nhật trạng thái thành 'inactive')
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    user.status = "inactive";
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Xóa user thành công (status chuyển thành inactive)",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi trong deleteUser:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Tìm User theo ID
    const user = await User.findById(userId);

    // Kiểm tra nếu user không tồn tại
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra nếu user đã ở trạng thái active
    if (user.status === "active") {
      return res.status(400).json({
        success: false,
        message: "User đã được kích hoạt",
      });
    }

    // Cập nhật trạng thái user thành active
    user.status = "active";
    await user.save();

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Kích hoạt lại tài khoản thành công",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi trong reactivateUser:", error);

    // Xử lý lỗi máy chủ
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    const { userId } = req.body; // Lấy userId từ body thay vì req.user
    if (!userId) {
      return sendResponse(res, 400, false, "userId là bắt buộc");
    }

    const updates = req.body;

    // Xóa các trường không được phép cập nhật
    const forbiddenFields = [
      "role",
      "password",
      "registrationDate",
      "lastLoginDate",
      "email",
    ];
    forbiddenFields.forEach((field) => delete updates[field]);

    // Kiểm tra nếu không có dữ liệu để cập nhật
    if (Object.keys(updates).length === 0) {
      return sendResponse(res, 400, false, "Không có dữ liệu để cập nhật");
    }

    // Thực hiện cập nhật thông tin
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    return sendResponse(
      res,
      200,
      true,
      "Cập nhật thông tin thành công",
      updatedUser
    );
  } catch (error) {
    console.error("Lỗi trong updateUserInfo:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
