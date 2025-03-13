import express from "express";
import {
  createConcession,
  getAllActiveConcessions,
  deleteConcession,
} from "../controller/Concession.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

const router = express.Router();

/**
 * API tạo mới đồ uống/thức ăn
 * @route POST /api/concession
 * @description Quản trị viên thêm một món đồ uống/thức ăn mới vào hệ thống
 * @access Manager
 * @author TheVi
 */
router.post("/", createConcession);

/**
 * API lấy tất cả đồ uống/thức ăn đang active
 * @route GET /api/concession
 * @description Người dùng có thể xem danh sách tất cả đồ uống/thức ăn đang được bán
 * @access Public
 * @author TheVi
 */
router.get("/", authenticateUser, getAllActiveConcessions);
/**
 * API xóa đồ uống/thức ăn
 * @route DELETE /api/concession/:id
 * @description Quản trị viên xóa một món đồ uống/thức ăn theo ID
 * @access Manager
 * @author TheVi
 */
router.delete("/:id", authenticateUser, deleteConcession);
export default router;
