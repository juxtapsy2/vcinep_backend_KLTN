import express from "express";
import {
  addNewShowtime,
  getShowtimeByMovie,
  getMovieShowDates,
  getShowtimeDetail,
  getAllShowtimes,
  addMultipleShowtimes,
  addMultipleShowtimesTheater,
  deleteShowtime,
  getFullShowtimesByDate,
} from "../controller/ShowTime.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
const router = express.Router();

/**
 * API them mot suất chiếu mới
 * @route  POST /api/showtime
 * @description Quản trị viên, Quản lý thêm một suất chiếu mới
 * @access Manager, Admin
 * @author TheVi
 */
router.post("/", addNewShowtime);

/**
 * API lấy suất chiếu theo phim
 * @route GET /api/showtime/movie
 * @description Lấy danh sách suất chiếu của một bộ phim theo các tiêu chí
 * @params {
 *   slug: slug của phim,
 *   showDate: ngày chiếu (YYYY-MM-DD),
 *   address: địa chỉ rạp (không bắt buộc),
 *   cinemaId: id của rạp (không bắt buộc)
 * }
 * @access Public
 */
router.post("/movie", getShowtimeByMovie);
/**
 * API lấy các ngày chiếu của một bộ phim
 * @route POST /api/showtime/movie/dates
 * @description Lấy danh sách các ngày chiếu của một bộ phim theo slug
 * @access Public
 */
router.post("/movie/dates", getMovieShowDates);
/**
 * API lấy thông tin chi tiết của suất chiếu (Phim, Rạp,....)
 * @route POST /api/showtime/detail/:id
 * @description Lấy thông tin chi tiết của suất chiếu (Phim, Rạp,....)
 * @access Public
 */
router.get("/detail/:id", authenticateUser, getShowtimeDetail);
router.post("/list", getAllShowtimes);
router.post("/multiple", addMultipleShowtimes);
router.post("/multiplebytheater", addMultipleShowtimesTheater);
router.delete("/:showtimeId", authenticateUser, deleteShowtime);
//Add by The Vi 14/4/2024
router.post("/getFullShowtimesByDate", getFullShowtimesByDate);

export default router;
