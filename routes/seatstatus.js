import express from "express";
import {
  addNewSeatStatus,
  addMultipleSeatStatuses,
  getAllSeatsForShowtime,
  updateHoldingToReserved,
  updateAvailableToReserved,
  updateSeatStatusToHolding,
  updateHoldingToAvailable,
  releaseAllHoldingSeats,
  updateMultipleToReserved,
} from "../controller/SeatStatus.js";

const router = express.Router();

/**
 * API thêm trạng thái ghế mới
 * @route POST /api/seat-status
 * @description Thêm trạng thái cho một ghế trong một suất chiếu
 * @access Manager
 * @author TheVi
 */
router.post("/", addNewSeatStatus);

/**
 * API thêm nhiều trạng thái ghế
 * @route POST /api/seat-status/multiple
 * @description Thêm trạng thái cho nhiều ghế trong một suất chiếu
 * @access Manager
 * @author TheVi
 */
router.post("/multiple", addMultipleSeatStatuses);

/**
 * API lấy tất cả ghế của một suất chiếu
 * @route GET /api/seat-status/showtime/:showtimeId
 * @description Lấy thông tin tất cả ghế của một suất chiếu cụ thể
 * @access Public
 * @author TheVi
 */
router.get("/showtime/:showtimeId", getAllSeatsForShowtime);
/**
 * API cập nhật trạng thái ghế thành holding
 * @route PUT /api/seat-status/holding
 * @description Cập nhật trạng thái ghế từ available thành holding
 * @access Private
 */
router.patch("/holding", updateSeatStatusToHolding);
/**
 * API giải phóng ghế đang holding
 * @route PUT /api/seat-status/release-holding
 * @description Cập nhật trạng thái ghế từ holding về available (chỉ người holding mới được giải phóng)
 * @access Private
 */
router.patch("/release-holding", updateHoldingToAvailable);
/**
 * API giải phóng tất cả ghế đang holding của một user
 * @route PUT /api/seat-status/release-all-holding
 * @description Cập nhật tất cả ghế đang holding của một user về available
 * @access Private
 */
router.patch("/release-all-holding", releaseAllHoldingSeats);
/**
 * API cập nhật trạng thái ghế từ holding sang reserved
 * @route PUT /api/seat-status/holding-to-reserved
 * @description Cập nhật trạng thái ghế từ holding sang reserved
 * @access Private
 */
router.patch("/holding-to-reserved", updateHoldingToReserved);
/**
 * API cập nhật trạng thái ghế từ available sang reserved
 * @route PUT /api/seat-status/available-to-reserved
 * @description Cập nhật trạng thái ghế từ available sang reserved
 * @access Private
 */
router.patch("/available-to-reserved", updateAvailableToReserved);
router.patch("/update-multiple-reserved", updateMultipleToReserved);

export default router;
