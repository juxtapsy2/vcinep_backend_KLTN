import express from "express";
import {
  addNewTheater,
  getTheatersByCinemaSlug,
  getTheaterById,
  getTheatersByCinemaId,
  deleteTheater, // Import the new controller
} from "../controller/Theater.js"; // Import the new controller
const router = express.Router();
/**
 * API thêm một phòng chiếu mới
 * @route  POST /api/theater
 * @description Quản trị viên thêm một phòng chiếu mới
 * @access Admin.
 * @author TheVi
 */
router.post("/", addNewTheater);
/**
 * API lấy tất cả phòng chiếu của một cinema theo slug
 * @route  GET /api/theater/cinema/:slug
 * @description Lấy tất cả phòng chiếu của một cinema thông qua slug
 * @access Public
 */
router.get("/cinema/:slug", getTheatersByCinemaSlug); // New route for getting theaters by cinema slug
/**
 * API lấy thông tin phòng chiếu theo id
 * @route  GET /api/theater/:id
 * @description Lấy thông tin chi tiết của một phòng chiếu
 * @access Public
 */
router.get("/:id", getTheaterById);

/**
 * API xóa phòng chiếu và tất cả ghế của nó
 * @route  DELETE /api/theater/:id
 * @description Xóa một phòng chiếu và tất cả ghế của nó
 * @access Admin
 */
router.delete("/:id", deleteTheater);
router.get("/:cinemaId/theaters", getTheatersByCinemaId); // Lấy tất cả phòng chiếu theo ID rạp

export default router;
