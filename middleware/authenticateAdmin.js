import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";

export const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Try authenticating admin with token:", token);
  if (!token) {
    console.log("Authorization token is missing");
    return sendResponse(res, 401, false, "Authorization token is missing");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    console.log("Decoded Token:", decodedToken); // Debug log

    if (decodedToken.role !== "Administrator"  && decodedToken.role !== "Admin") {
      console.log("Access denied. Role is:", decodedToken.role); // Debug log
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required"
      );
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error); // Debug log
    // Send a 404 instead of 401 for invalid or expired token
    return sendResponse(res, 404, false, "Token not found or expired");
  }
};
