import { sendResponse } from "../utils/responseHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import * as argon2 from "argon2";

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
function buildUserQuery(baseQuery = {}, username = "", role = "", status = "") {
  if (username) baseQuery.username = { $regex: username, $options: "i" };
  if (role) {
    if (Array.isArray(role)) {
      baseQuery.role = { $in: role };
    } else {
      baseQuery.role = role;
    }
  }
  if (status) baseQuery.status = status;
  return baseQuery;
}
// Lấy danh sách tất cả users
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10; // Số lượng user mỗi trang
    const skip = (page - 1) * limit;

    const { username = "", status = "" } = req.body;

    // Xây dựng query tìm kiếm
    let query = buildUserQuery({}, username, "User", status);

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

export const createUser = async (req, res) => {
  let { username, gender, dateOfBirth, phoneNumber, email, password, role, idCinema, } = req.body;
  
  console.log("Try creating user with data:", req.body);
  try {
    const hashedPassword = await argon2.hash(password);
    const newUser = new User({
      username,
      avatar: "",
      gender,
      dateOfBirth,
      phoneNumber,
      email,
      password: hashedPassword,
      role,
      status: "active",
      ...(idCinema && { idCinema }),  // only include if valid
    });
  
    await newUser.save();
    console.log("User saved:", username);
    return sendResponse(
      res,
      200,
      true,
      "New user added successfully",
      newUser
    );
  } catch (error) {
    console.error("Error in createUser:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `Duplicate field: ${field} already exists`
      );
    }
    // missing required fields
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return sendResponse(res, 400, false, messages.join(", "));
    }
    return sendResponse(res, 500, false, "Lỗi server");
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, idCinema } = req.body;
  console.log("Try updating user role:", id, role);

  try {
    const updateData = { role, ...(idCinema && {idCinema}) };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedUser)
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    console.log("User role updated:", id, role);
    return sendResponse(res, 200, true, "Cập nhật vai trò thành công", updatedUser);
  } catch (error) {
    console.log("Error in updateUserRole:", error);
    sendResponse(res, 500, false, "Lỗi server");
  }
};

export const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.body.params?.page) || 1;
    const limit = parseInt(req.body.params?.limit) || 10;
    const skip = (page - 1) * limit;

    const username = req.body.params?.username || "";
    const status = req.body.params?.status || "";
    let role = req.body.params?.role || "";

    if (role && typeof role === "string") {
      role = [role];
    }
    // Fallback to default
    if (!role.length) {
      role = ["Manager", "Employee"];
    }

    const query = buildUserQuery({ role: { $in: role } }, username, role, status);
    console.log("Try fetching employees with query:", query);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);
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
    console.error("Lỗi trong getEmployees:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};
