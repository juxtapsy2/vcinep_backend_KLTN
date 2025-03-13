import express from "express";
import {
  addNewSeat,
  getSeatsByTheaterId,
  updateSeatType,
  deleteSeat,
} from "../controller/Seat.js";
const router = express.Router();
/**
 * API thêm một ghế mới
 * @route POST /api/seat
 * @description Quản trị viên thêm một ghế mới vào rạp
 * @access Manager
 * @author TheVi
 */
router.post("/", addNewSeat);
/**
 * API lấy danh sách ghế theo ID rạp
 * @route GET /api/theater/:theaterId/seats
 * @description Lấy danh sách tất cả ghế trong một rạp cụ thể
 * @access Public
 */
router.get("/:theaterId/seats", getSeatsByTheaterId);
/**
 * API cập nhật loại ghế
 * @route PATCH /api/seat/:seatId/type
 * @description Cập nhật loại ghế thành "standard" hoặc "vip"
 * @access Manager
 */
router.patch("/:seatId/type", updateSeatType);
/**
 * API xóa ghế
 * @route DELETE /api/seat/:seatId
 * @description Xóa một ghế khỏi hệ thống
 * @access Manager
 */
router.delete("/:seatId", deleteSeat);

export default router;
