import express from "express";

import {
  getAllActiveMovies,
  getActiveCinemasByMovieId,
  getShowDatesByMovieAndCinema,
  getShowtimesByMovieCinemaDate,
} from "../controller/QuickTicket.js";

const router = express.Router();

/**
 * @route GET /api/movies
 * @description Lấy tất cả phim có trạng thái active
 * @access Public
 */
router.get("/movie", getAllActiveMovies);
/**
 * @route GET /api/cinemas/active/:movieId
 * @description Lấy tất cả các rạp active chiếu phim dựa trên id của phim
 * @access Public
 */
router.get("/cinema/:movieId", getActiveCinemasByMovieId);
/**
 * @route POST /api/showtimes/dates
 * @description Lấy tất cả ngày chiếu và idShowtime theo movieId và cinemaId
 * @access Public
 */
router.post("/showtime/dates", getShowDatesByMovieAndCinema);
/**
 * @route POST /api/showtimes/times
 * @description Lấy tất cả giờ chiếu kèm idShowtime theo movieId, cinemaId, và showDate
 * @access Public
 */
router.post("/showtime/times", getShowtimesByMovieCinemaDate);
export default router;
