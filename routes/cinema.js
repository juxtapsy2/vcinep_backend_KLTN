import express from "express";
import {
  addNewCinema,
  getAllCinemas,
  getCinemaBySlug,
  getActiveCinemas,
  getAllCinemasCustom,
  getCinemaById,
  getCinemaSlugById,
  getShowtimesByCinemaId,
  updateCinema,
  deleteCinema,
} from "../controller/Cinema.js";
const router = express.Router();
router.get("/active", getActiveCinemas);

/**
 * API them mot Rap moi
 * @route  POST /api/cinema
 * @description Quản trị viên thêm một rạp mới vào hệ thống
 * @access Manager.
 * @author TheVi
 */

router.post("/", addNewCinema);
/**
 * API lay tat ca cac rap
 * @route  GET /api/cinema
 * @description Nguoi dung co the lay thong tin de xem tat ca cac rap
 * @access Public.
 * @author TheVi
 */
router.post("/all", getAllCinemas);
/**
 * API lay thong tin cua mot rap theo slug
 * @route  GET /api/cinema/getCinemaBySlug/:slug
 * @description Nguoi dung co the lay thong tin cua mot rap
 * @access Public.
 * @author TheVi
 */
router.get("/getCinemaBySlug/:slug", getCinemaBySlug);
router.get("/custom", getAllCinemasCustom); // Lấy tất cả rạp (_id, name)

/**
 * API lấy thông tin một cinema theo ID
 * @route GET /api/cinema/:id
 * @description Người dùng có thể lấy thông tin của một cinema (nếu status là "active")
 * @access Public
 */
router.get("/:id", getCinemaById);
router.get("/slug/:id", getCinemaSlugById);
/**
 * API cập nhật thông tin cinema
 * @route PATCH /api/cinema/:id
 * @description Quản trị viên có thể cập nhật thông tin của một cinema
 * @access Manager
 * @author TheVi
 */
router.patch("/:id", updateCinema);
/**
 * API lấy suất chiếu theo ID rạp
 * @route GET /api/cinema/:cinemaId/showtimes
 * @description Lấy tất cả suất chiếu và thông tin phim của một rạp
 * @access Public
 */
router.get("/:cinemaId/showtimes", getShowtimesByCinemaId);

/**
 * API xóa rạp (chuyển status thành inactive)
 * @route DELETE /api/cinema/:id
 * @description Quản trị viên có thể xóa một rạp bằng cách chuyển trạng thái thành inactive
 * @access Manager
 * @author TheVi
 */
router.delete("/:id", deleteCinema);
export default router;
