import { sendResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";

import Ticket from "../models/TicketModel.js";
import User from "../models/UserModel.js";
import Movie from "../models/MovieModel.js";
import Showtime from "../models/ShowtimeModel.js";
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "_id username avatar gender dateOfBirth phoneNumber email role status registrationDate lastLoginDate createdAt updatedAt"
    );

    if (!users || users.length === 0) {
      return sendResponse(res, 200, false, "No users found");
    }

    return sendResponse(res, 200, true, "Users retrieved successfully", users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving users: ${error.message}`
    );
  }
};
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().select(
      "_id showtimeId seats concession totalPrice status userId code createdAt updatedAt"
    );

    if (!tickets || tickets.length === 0) {
      return sendResponse(res, 200, false, "No tickets found");
    }
    return sendResponse(
      res,
      200,
      true,
      "Tickets retrieved successfully",
      tickets
    );
  } catch (error) {
    console.error("Error in getAllTickets:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving tickets: ${error.message}`
    );
  }
};
export const getMovieRevenue = async (req, res) => {
  try {
    // Lấy tất cả phim kèm theo thông tin suất chiếu
    const movies = await Movie.aggregate([
      {
        $lookup: {
          from: "showtimes", // collection name của Showtime
          localField: "_id",
          foreignField: "movieId",
          as: "showtimes",
        },
      },
      // Unwind showtimes để có thể tiếp tục lookup với tickets
      {
        $unwind: {
          path: "$showtimes",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup để lấy thông tin vé từ mỗi suất chiếu
      {
        $lookup: {
          from: "tickets", // collection name của Ticket
          localField: "showtimes._id",
          foreignField: "showtimeId",
          as: "tickets",
        },
      },
      // Group lại theo từng phim
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          genre: { $first: "$genre" },
          duration: { $first: "$duration" },
          startDate: { $first: "$startDate" },
          endDate: { $first: "$endDate" },
          status: { $first: "$status" },
          coverImage: { $first: "$coverImage" },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: "$tickets",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.totalPrice"] },
              },
            },
          },
          totalTickets: {
            $sum: { $size: "$tickets" },
          },
        },
      },
      // Sắp xếp theo doanh thu giảm dần
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    if (!movies || movies.length === 0) {
      return sendResponse(res, 200, false, "No movies found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Movies and revenue retrieved successfully",
      movies
    );
  } catch (error) {
    console.error("Error in getMovieRevenue:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving movie revenue: ${error.message}`
    );
  }
};

// Lấy danh sách users theo cinema
export const getCinemaUsers = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    const users = await User.find({ idCinema: cinemaId }).select(
      "_id username avatar gender dateOfBirth phoneNumber email role status registrationDate lastLoginDate createdAt updatedAt"
    );

    if (!users || users.length === 0) {
      return sendResponse(res, 200, false, "No users found for this cinema");
    }

    return sendResponse(res, 200, true, "Users retrieved successfully", users);
  } catch (error) {
    console.error("Error in getCinemaUsers:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving users: ${error.message}`
    );
  }
};

// Lấy tickets theo cinema
export const getCinemaTickets = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    const tickets = await Ticket.aggregate([
      {
        $lookup: {
          from: "showtimes",
          localField: "showtimeId",
          foreignField: "_id",
          as: "showtime",
        },
      },
      {
        $unwind: "$showtime",
      },
      {
        $lookup: {
          from: "theaters",
          localField: "showtime.theaterId",
          foreignField: "_id",
          as: "theater",
        },
      },
      {
        $unwind: "$theater",
      },
      {
        $match: {
          "theater.cinemaId": new mongoose.Types.ObjectId(cinemaId),
        },
      },
      {
        $project: {
          _id: 1,
          seats: 1,
          concession: 1,
          totalPrice: 1,
          status: 1,
          userId: 1,
          code: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!tickets || tickets.length === 0) {
      return sendResponse(res, 200, false, "No tickets found for this cinema");
    }

    return sendResponse(
      res,
      200,
      true,
      "Tickets retrieved successfully",
      tickets
    );
  } catch (error) {
    console.error("Error in getCinemaTickets:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving tickets: ${error.message}`
    );
  }
};

// Lấy doanh thu phim theo cinema
export const getCinemaMovieRevenue = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    const movies = await Movie.aggregate([
      {
        $lookup: {
          from: "showtimes",
          localField: "_id",
          foreignField: "movieId",
          as: "showtimes",
        },
      },
      {
        $unwind: {
          path: "$showtimes",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "theaters",
          localField: "showtimes.theaterId",
          foreignField: "_id",
          as: "theater",
        },
      },
      {
        $unwind: "$theater",
      },
      {
        $match: {
          "theater.cinemaId": new mongoose.Types.ObjectId(cinemaId),
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "showtimes._id",
          foreignField: "showtimeId",
          as: "tickets",
        },
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          genre: { $first: "$genre" },
          duration: { $first: "$duration" },
          startDate: { $first: "$startDate" },
          endDate: { $first: "$endDate" },
          status: { $first: "$status" },
          coverImage: { $first: "$coverImage" },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: "$tickets",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.totalPrice"] },
              },
            },
          },
          totalTickets: {
            $sum: { $size: "$tickets" },
          },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    if (!movies || movies.length === 0) {
      return sendResponse(res, 200, false, "No movies found for this cinema");
    }

    return sendResponse(
      res,
      200,
      true,
      "Movies and revenue retrieved successfully",
      movies
    );
  } catch (error) {
    console.error("Error in getCinemaMovieRevenue:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving movie revenue: ${error.message}`
    );
  }
};

export const getDailyRevenueBetweenDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Initialize the match conditions object
    let matchConditions = {};

    // Filter by date range if provided
    if (startDate || endDate) {
      matchConditions["createdAt"] = {};

      if (startDate) {
        matchConditions["createdAt"]["$gte"] = new Date(startDate); // Greater than or equal to start date
      }

      if (endDate) {
        matchConditions["createdAt"]["$lte"] = new Date(endDate); // Less than or equal to end date
      }
    }

    // Aggregate tickets and group them by day
    const dailyRevenue = await Ticket.aggregate([
      { $match: matchConditions }, // Apply the date filter if provided
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date (YYYY-MM-DD)
          totalRevenue: { $sum: "$totalPrice" }, // Sum total revenue for each day
          totalTickets: { $sum: 1 }, // Count the number of tickets for each day
        },
      },
      { $sort: { _id: 1 } }, // Sort by date in ascending order
    ]);

    if (!dailyRevenue || dailyRevenue.length === 0) {
      return sendResponse(res, 200, false, "No revenue data found for the given dates");
    }

    return sendResponse(res, 200, true, "Daily revenue retrieved successfully", dailyRevenue);
  } catch (error) {
    console.error("Error in getDailyRevenueBetweenDates:", error);
    return sendResponse(
      res,
      500,
      false,
      `Error retrieving daily revenue: ${error.message}`
    );
  }
};
