import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";

export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);
  if (!token) {
    return sendResponse(res, 401, false, "Authorization token is missing");
  }
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decodedToken;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, "Invalid or expired token");
  }
};
