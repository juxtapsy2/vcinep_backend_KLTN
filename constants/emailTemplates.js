export const registrationEmail = (
  username,
  otp,
  title,
  content,
  additionalInfo
) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; color: #333;">
  <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #ff6b6b 0%, #d9534f 100%); border-radius: 10px 10px 0 0;">
    <img src="https://res.cloudinary.com/dhs93uix6/image/upload/v1726922159/LogoVCineP_merhsk.png" alt="VCineP Logo" style="width: 180px; margin-bottom: 15px;">
    <h1 style="color: #ffffff; font-size: 28px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">${title}</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);">
    <p style="font-size: 18px; margin-bottom: 25px;">Xin chào <strong style="color: #d9534f;">${username}</strong>,</p>
    <p style="font-size: 16px; color: #555; margin-bottom: 25px; line-height: 1.8;">
      ${content}
    </p>
    <div style="text-align: center; margin: 35px 0;">
      <span style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #d9534f 100%); color: #ffffff; font-size: 28px; font-weight: bold; padding: 15px 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(217, 83, 79, 0.3);">
        ${otp}
      </span>
    </div>
    <p style="font-size: 16px; color: #555; margin-bottom: 25px; line-height: 1.8;">
      ${additionalInfo}
    </p>
    <p style="font-size: 16px; margin-bottom: 15px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    <p style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">Trân trọng,</p>
    <p style="font-size: 18px; font-weight: bold; color: #d9534f; margin-bottom: 0;">Đội ngũ hỗ trợ VCineP</p>
  </div>
  <div style="text-align: center; padding: 25px; background-color: #f1f3f5; color: #6c757d; font-size: 14px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 10px;">Bạn nhận được email này vì đã sử dụng dịch vụ của VCineP.</p>
    <p style="margin: 0 0 10px;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ <a href="mailto:support@vcinep.com" style="color: #d9534f; text-decoration: none; font-weight: bold;">support@vcinep.com</a></p>
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VCineP, All rights reserved.</p>
  </div>
</div>
`;
