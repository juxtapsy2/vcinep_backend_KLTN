import express from "express";
import {
  getCurrentPrice,
  addNewPrice,
  updatePrice,
  deletePrice,
  getPriceHistory,
} from "../controller/Price.js";

const router = express.Router();

/**
 * API lấy cấu hình giá hiện tại
 * @route GET /api/price/current
 * @description Lấy cấu hình giá đang active
 * @access Public
 */
router.get("/current", getCurrentPrice);

/**
 * API thêm cấu hình giá mới
 * @route POST /api/price
 * @description Thêm cấu hình giá mới (tự động set active)
 * @access Private (Admin only)
 */
router.post("/", addNewPrice);

/**
 * API cập nhật cấu hình giá
 * @route PUT /api/price/:id
 * @description Cập nhật thông tin cấu hình giá
 * @access Private (Admin only)
 */
router.put("/:id", updatePrice);

/**
 * API xóa cấu hình giá
 * @route DELETE /api/price/:id
 * @description Xóa cấu hình giá (nếu xóa active sẽ active cấu hình mới nhất)
 * @access Private (Admin only)
 */
router.delete("/:id", deletePrice);

/**
 * API lấy lịch sử giá
 * @route GET /api/price/history
 * @description Lấy toàn bộ lịch sử cấu hình giá
 * @access Private (Admin only)
 */
router.get("/history", getPriceHistory);

export default router;
