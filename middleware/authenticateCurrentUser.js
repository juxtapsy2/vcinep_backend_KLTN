import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";

export const authenticateCurrentUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const requestedUserId = req.params.userId || req.body.userId; // Lấy userId từ params hoặc body request

  if (!token) {
    return sendResponse(res, 401, false, "Authorization token is missing");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    // Kiểm tra xem userId từ token có khớp với userId được yêu cầu không
    if (decodedToken.userId !== requestedUserId) {
      return sendResponse(
        res,
        403,
        false,
        "You can only modify your own account"
      );
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, "Invalid or expired token");
  }
};
