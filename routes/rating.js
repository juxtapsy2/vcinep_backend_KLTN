import express from "express";
import {
  addNewRating,
  checkUserRatedMovie,
  getMovieRatingById,
} from "../controller/Rating.js";

const router = express.Router();

/**
 * @route POST /api/rating
 * @description Thêm một đánh giá mới cho phim
 * @access Public
 */
router.post("/", addNewRating);

/**
 * @route POST /api/rating/check
 * @description Kiểm tra người dùng đã đánh giá một phim chưa
 * @access Public
 */
router.post("/check", checkUserRatedMovie);
router.get("/movies/:movieId", getMovieRatingById);

export default router;
