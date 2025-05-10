import express from "express";
import {
  getUserById,
  updateAvatar,
  getAllUsers,
  deleteUser,
  reactivateUser,
  updateUserInfo,
  createUser,
  updateUserStatus,
} from "../controller/User.js";
import { authenticateCurrentUser } from "../middleware/authenticateCurrentUser.js";
import { authenticateAdmin } from "../middleware/authenticateAdmin.js";
const router = express.Router();

/**
 * API lấy thông tin người dùng theo ID
 * @route GET /api/user/:id
 * @description Người dùng lấy thông tin của mình
 * @access User, Staff, Manager, Administrator.
 * @author TheVi
 */
router.get("/:id", getUserById);

/**
 * API người dùng update avatar
 * @route PUT /api/user/avatar
 * @description Người dùng update avatar của minh
 * @access User, Staff, Manager, Administrator.
 * @author TheVi
 */
router.patch("/avatar", authenticateCurrentUser, updateAvatar);

/**
 * API lấy danh sách tất cả user (có tìm kiếm theo username và phân trang)
 * @route POST /api/user/list
 * @description Quản trị viên lấy danh sách tất cả user
 * @access Administrator
 * @body { page, limit, username }
 * @author TheVi
 */
router.post("/list", getAllUsers);

/**
 * API xóa user (cập nhật trạng thái thành inactive)
 * @route DELETE /api/user/:id
 * @description Quản trị viên xóa user bằng cách cập nhật trạng thái thành inactive
 * @access Administrator
 * @param {String} id - ID của user cần xóa
 * @author TheVi
 */
router.delete("/:id", deleteUser);
router.patch("/:id/reactivate", reactivateUser);
/**
 * API cập nhật thông tin cá nhân
 * @route PATCH /api/user/info
 * @description Người dùng cập nhật thông tin cá nhân
 * @access User, Staff, Manager, Administrator
 * @body { username, avatar, gender, dateOfBirth, phoneNumber }
 * @example PATCH /api/user/info { username: "newname" }
 */
router.patch("/info", updateUserInfo);

router.post("/new", authenticateAdmin, createUser);
router.post("/status/:id", authenticateAdmin, updateUserStatus);

export default router;
