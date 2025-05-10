import express from "express";
import {
  getAllTickets,
  getAllUsers,
  getMovieRevenue,
  getCinemaTickets,
  getCinemaUsers,
  getCinemaMovieRevenue,
  getTicketsBetweenDates
} from "../controller/Statistical.js"; // Import tất cả controller liên quan
const router = express.Router();

//Lấy tất cả vé để thống kê
router.get("/ticket", getAllTickets);
router.get("/user", getAllUsers);
router.get("/movie-revenue", getMovieRevenue);
router.get("/ticket/between-dates", getTicketsBetweenDates);

// Tất cả routes đều yêu cầu theaterId và xác thực quyền quản lý rạp
router.get("/:cinemaId/tickets", getCinemaTickets);
router.get("/:cinemaId/users", getCinemaUsers);
router.get("/:cinemaId/movie-revenue", getCinemaMovieRevenue);

export default router;
