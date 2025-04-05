import express from "express";
import { addNewTicket, getTicketsByShowtime } from "../controller/Ticket.js";
import {
  checkTicketExist,
  getTicketsByUserId,
  sendTicketEmail,
  getAllTickets,
  getTicketById,
  checkTicketCancelled,
  cancelTicket,
} from "../controller/Ticket.js"; // Thêm import controller checkTicketExist
import { authenticateUser } from "../middleware/authenticateUser.js";
const router = express.Router();

/**
 * API thêm một vé mới
 * @route  POST /api/ticket
 * @description Người dùng thêm một vé mới vào hệ thống
 * @access Public
 * @author TheVi
 */
router.post("/", authenticateUser, addNewTicket);

/**
 * API kiểm tra xem vé đã tồn tại chưa
 * @route  POST /api/ticket/check-exist
 * @description Kiểm tra vé đã tồn tại cho user và showtime
 * @access Public
 * @author TheVi
 */
router.post("/check-exist", authenticateUser, checkTicketExist); // Thêm route check-exist
/**
 * API lấy danh sách vé của một người dùng theo userId
 * @route  GET /api/ticket/user/:userId
 * @description Lấy danh sách vé cho một người dùng dựa trên userId
 * @access Private (Yêu cầu xác thực người dùng)
 */
router.get("/user/:userId", authenticateUser, getTicketsByUserId);
router.post("/sendmail", authenticateUser, sendTicketEmail);
/**
 * API lấy danh sách tất cả vé
 * @route  GET /api/ticket
 * @description Lấy danh sách tất cả vé (có tìm kiếm theo code và phân trang)
 * @access Private (Yêu cầu xác thực người dùng)
 */
router.post("/all", getAllTickets); // Route cho getAllTickets
/**
 * API lấy vé theo ticketId
 * @route  GET /api/ticket/:ticketId
 * @description Lấy thông tin vé dựa trên ticketId
 * @access Private (Yêu cầu xác thực người dùng)
 */
router.get("/:ticketId", getTicketById);
/**
 * API kiểm tra trạng thái hủy của vé
 * @route GET /api/ticket/check-cancelled/:ticketId
 * @access Private
 */
router.get(
  "/check-cancelled/:ticketId",

  checkTicketCancelled
);

/**
 * API hủy vé
 * @route PUT /api/ticket/cancel/:ticketId
 * @access Private
 */
router.put("/cancel/:ticketId", cancelTicket);

/**
 * API lấy vé theo showtimeId
 * @route  GET /api/ticket/:showtimeId
 * @description Lấy thông tin vé dựa trên showtimeId
 * @access Private (Yêu cầu xác thực người dùng)
 */
router.get("/showtime/:showtimeId", getTicketsByShowtime);
export default router;
