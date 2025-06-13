import { sendResponse } from "../utils/responseHandler.js";
import { generateRandomPassword } from "../utils/generateRandomPassword.js";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import * as argon2 from "argon2";

import {
  checkExistingUser,
  createUser,
  createAndSaveOTP,
  sendOTPEmail,
  validateOTP,
  updateUserStatus,
  deleteOTP,
} from "../services/authService.js";

export const registerAccount = async (req, res) => {
  try {
    await checkExistingUser(req.body);
    const user = await createUser(req.body);
    const otp = await createAndSaveOTP(user.email);
    await sendOTPEmail(
      "VCineP - Mã xác thực Email",
      "Mã xác nhận",
      user,
      otp,
      "Đây là mã xác nhận Email của bạn :",
      "Mã xác nhận có thời hạn trong 10 phút. Vui lòng không chia sẻ với người khác !"
    );

    const filteredUser = {
      email: user.email,
    };

    return sendResponse(res, 200, true, "Đăng ký thành công!", {
      user: filteredUser,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    return sendResponse(
      res,
      error.status || 500,
      false,
      error.message || "Không thể đăng ký"
    );
  }
};
export const loginAccount = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendResponse(
      res,
      200,
      false,
      "Vui lòng nhập đầy đủ email và password!"
    );
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 200, false, "Email hoặc mật khẩu sai !");
    }

    if (user.status === "inactive") {
      return sendResponse(res, 200, false, "Tài khoản đã bị khóa");
    }
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) {
      return sendResponse(res, 200, false, "Vui lòng nhập lại mật khẩu!");
    } else {
      const accessToken = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          phoneNumber: user.phoneNumber,
          idCinema: user.idCinema,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      return sendResponse(res, 200, true, "Đăng nhập thành công!", accessToken);
    }
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    return sendResponse(res, error.status || 500, false, "Không thể đăng nhập");
  }
};
export const checkOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendResponse(res, 400, false, "Email và OTP là bắt buộc");
    }

    const validOTP = await validateOTP(email, otp);
    if (!validOTP) {
      return sendResponse(res, 200, false, "OTP không hợp lệ hoặc đã hết hạn");
    }

    await updateUserStatus(email);
    await deleteOTP(email);

    return sendResponse(res, 200, true, "Xác thực OTP thành công");
  } catch (error) {
    console.error("Lỗi khi xác thực OTP:", error);
    return sendResponse(res, 500, false, "Lỗi trong quá trình xác thực OTP");
  }
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendResponse(res, 200, false, "Vui lòng nhập email!");
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.status !== "active") {
      return sendResponse(
        res,
        200,
        false,
        "Email không tồn tại trong hệ thống!"
      );
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    await user.save();

    await sendOTPEmail(
      "VCineP - Reset mật khẩu",
      "Reset mật khẩu",
      user,
      newPassword,
      "Đây là mật khẩu mới của bạn: ",
      "Vui lòng không chia sẻ với người khác !"
    );

    return sendResponse(
      res,
      200,
      true,
      "Mật khẩu mới đã được gửi đến email của bạn!"
    );
  } catch (error) {
    console.error("Lỗi khi xử lý quên mật khẩu:", error);
    return sendResponse(
      res,
      error.status || 500,
      false,
      error.message || "Không thể xử lý yêu cầu quên mật khẩu"
    );
  }
};
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, userId } = req.body;

  if (!currentPassword || !newPassword) {
    return sendResponse(
      res,
      400,
      false,
      "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!"
    );
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng!");
    }

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await argon2.verify(user.password, currentPassword);
    if (!isValidPassword) {
      return sendResponse(
        res,
        400,
        false,
        "Mật khẩu hiện tại không chính xác!"
      );
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    const isSamePassword = await argon2.verify(user.password, newPassword);
    if (isSamePassword) {
      return sendResponse(
        res,
        400,
        false,
        "Mật khẩu mới không được trùng với mật khẩu hiện tại!"
      );
    }

    // Mã hóa và lưu mật khẩu mới
    const hashedNewPassword = await argon2.hash(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    return sendResponse(res, 200, true, "Thay đổi mật khẩu thành công!");
  } catch (error) {
    console.error("Lỗi khi thay đổi mật khẩu:", error);
    return sendResponse(
      res,
      error.status || 500,
      false,
      error.message || "Không thể thay đổi mật khẩu"
    );
  }
};
