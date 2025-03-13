import express from "express";
import {
  registerAccount,
  checkOTP,
  loginAccount,
  forgotPassword,
  changePassword,
} from "../controller/Auth.js";
import { sendResponse } from "../utils/responseHandler.js";
import { authenticateCurrentUser } from "../middleware/authenticateCurrentUser.js";
import { authenticateAdmin } from "../middleware/authenticateAdmin.js";

const router = express.Router();
/**
 * API đăng ký người dùng
 * @route POST /api/auth/register
 * @description Tạo một tài khoản mới
 * @access Public
 * @author TheVi
 */
router.post("/register", registerAccount);
/**
 * API xác thực OTP
 * @route POST /api/auth/checkOTP
 * @description Xác thực OTP
 * @access Public
 * @author TheVi
 */
router.post("/checkOTP", checkOTP);
/**
 * API đăng nhập
 * @route POST /api/auth/login
 * @description Người dùng đăng nhập
 * @access Public
 * @author TheVi
 */
router.post("/login", loginAccount);
/**
 * API quên mật khẩu
 * @route POST /api/auth/forget
 * @description Người dùng quên mật khẩu và gửi mật khẩu mới về mail
 * @access Public
 * @author TheVi
 */
router.post("/forget", forgotPassword);
/**
 * API thay đổi mật khẩu
 * @route POST /api/auth/change-password
 * @description Người dùng thay đổi mật khẩu
 * @access Private
 * @author TheVi
 */
router.post("/change-password", authenticateCurrentUser, changePassword);

router.get("/auth-admin", authenticateAdmin, (req, res) => {
  res.status(200).json({ role: req.user.role });
});

export default router;
