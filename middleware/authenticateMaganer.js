import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";
export const authenticateManager = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return sendResponse(res, 401, false, "Authorization token is missing");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    if (decodedToken.role !== "Manager") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Manager role required"
      );
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, "Invalid or expired token");
  }
};
