import User from "../models/UserModel.js";
import OTP from "../models/OTPModel.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendMail } from "../utils/sendMail.js";
import { registrationEmail } from "../constants/emailTemplates.js";
import * as argon2 from "argon2";

export async function checkExistingUser({ email, phoneNumber }) {
  const [existingEmail, existingPhone] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ phoneNumber }),
  ]);
  if (existingEmail && existingEmail.status === "inactive") {
    await OTP.deleteMany({ email: existingEmail.email });
    await User.deleteOne({ _id: existingEmail._id });
  } else if (existingEmail) {
    throw {
      status: 200,
      message: "Email đã có người dùng!",
    };
  }

  if (existingPhone && existingPhone.status === "inactive") {
    await OTP.deleteMany({ email: existingPhone.email });
    await User.deleteOne({ _id: existingPhone._id });
  } else if (existingPhone) {
    throw {
      status: 200,
      message: "Số điện thoại đã có người dùng!",
    };
  }
}

export async function createUser(userData) {
  const hashedPassword = await argon2.hash(userData.password);

  const newUser = new User({
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    avatar: userData.avatar || "",
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth,
    phoneNumber: userData.phoneNumber,
    role: userData.role || "User",
    status: "inactive",
    registrationDate: new Date(),
  });

  try {
    return await newUser.save();
  } catch (error) {
    console.error("Error saving user:", error);
    throw { status: 500, message: "Không thể lưu thông tin người dùng" };
  }
}

export async function createAndSaveOTP(email) {
  const otp = generateOTP();
  const newOTP = new OTP({ email, otp });

  try {
    await newOTP.save();
    return otp;
  } catch (error) {
    console.error("Error saving OTP:", error);
    throw { status: 500, message: "Không thể lưu mã OTP" };
  }
}

export async function sendOTPEmail(
  subject,
  title,
  user,
  otp,
  content,
  additionalInfo
) {
  const html = registrationEmail(
    user.username,
    otp,
    title,
    content,
    additionalInfo
  );

  try {
    await sendMail(user.email, subject, `Mã OTP: ${otp}`, html);
  } catch (error) {
    console.error("Error sending email:", error);
    throw { status: 500, message: "Không thể gửi email xác thực" };
  }
}

export async function validateOTP(email, otp) {
  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
    return false;
  }
  const tenMinutes = 10 * 60 * 1000;
  if (Date.now() - otpRecord.createdAt > tenMinutes) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return false;
  }

  return true;
}

export async function updateUserStatus(email) {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 404, message: "Không tìm thấy người dùng" };
  }
  user.status = "active";
  await user.save();
}

export async function deleteOTP(email) {
  await OTP.deleteOne({ email });
}
