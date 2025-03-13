import express from "express";
import {
  addNewMovie,
  getMovieBySlug,
  getNowShowingMovies,
  getComingSoonMovies,
  getAllMoviesAdmin,
  getNowShowingMoviesAdmin,
  getComingSoonMoviesAdmin,
  deleteMovie,
  getEndedMoviesAdmin,
  getTopRatedMovies,
  getActiveMovies,
  updateMovieBySlug,
} from "../controller/Movie.js";
import Movie from "../models/MovieModel.js";
import { authenticateAdmin } from "../middleware/authenticateAdmin.js";

const router = express.Router();
router.get("/active", getActiveMovies);

/**
 * API them mot phim moi
 * @route  PUT /api/movie
 * @description Quản trị viên thêm một phim mới vào hệ thống
 * @access Manager.
 * @author TheVi
 */
router.post("/", addNewMovie);
/**
 * API lấy movie by slug
 * @route  GET /api/movie/getMovieBySlug/:slug
 * @description Người dùng lấy thông tin phim bằng slug
 * @access Public
 * @author TheVi
 */
router.get("/getMovieBySlug/:slug", getMovieBySlug);
/**
 * API lấy movie đang chiếu
 * @route  GET /api/movie/now-showing
 * @description Người dùng lấy danh sách tất cả phim đang chiêu
 * @access Public
 * @author TheVi
 */
router.get("/now-showing", getNowShowingMovies);
/**
 * API lấy movie sắp chiếu
 * @route  GET /api/movie/coming-soon
 * @description Người dùng lấy danh sách tất cả phim sắp chiếu
 * @access Public
 * @author TheVi
 */
router.get("/coming-soon", getComingSoonMovies);
/**
 * API lấy tất cả các phim (sắp xếp theo ngày tạo mới nhất)
 * @route  GET /api/movie/all
 * @description Người dùng lấy danh sách tất cả các phim
 * @access Public
 * @author TheVi
 */
router.post("/all", getAllMoviesAdmin);
/**
 * API lấy phim đang chiếu
 * @route  GET /api/admin/movie/now-showing
 * @description Quản trị viên lấy danh sách các phim đang chiếu
 * @access Admin
 * @author TheVi
 */
router.post("/now-showing-admin", getNowShowingMoviesAdmin);

/**
 * API lấy phim sắp chiếu
 * @route  GET /api/admin/movie/coming-soon
 * @description Quản trị viên lấy danh sách các phim sắp chiếu
 * @access Admin
 * @author TheVi
 */
router.post("/coming-soon-admin", getComingSoonMoviesAdmin);

/**
 * API lấy phim đã chiếu
 * @route  GET /api/admin/movie/ended
 * @description Quản trị viên lấy danh sách các phim đã chiếu
 * @access Admin
 * @author TheVi
 */
router.post("/ended", getEndedMoviesAdmin);
router.delete("/:id", deleteMovie);
/**
 * API lấy top 4 phim có rating cao nhất
 * @route  GET /api/movie/top-rated
 * @description Người dùng lấy danh sách 4 phim có rating cao nhất
 * @access Public
 * @author TheVi
 */
router.get("/top-rated", getTopRatedMovies);
/**
 * API cập nhật thông tin phim theo slug
 * @route PATCH /api/movie/:slug
 * @description Cập nhật thông tin phim theo slug
 * @access Manager
 * @author TheVi
 */
router.patch("/:slug", updateMovieBySlug);
export default router;
