import mongoose from "mongoose";
import { sendResponse } from "../utils/responseHandler.js";
import Theater from "../models/TheaterModel.js";
import Showtime from "../models/ShowtimeModel.js";
import Movie from "../models/MovieModel.js";
import Cinema from "../models/CinemaModel.js";
import SeatStatus from "../models/SeatStatusModel.js";
import Price from "../models/PriceModel.js";

import moment from "moment"; // Import moment.js để làm việc với ngày tháng dễ dàng hơn

export const calculatePricesForMultipleShowtimes = async (
  showTimes,
  showDate
) => {
  try {
    // Lấy cấu hình giá active
    const activePrice = await Price.findOne({ isActive: true });
    if (!activePrice) {
      throw new Error("No active price configuration found");
    }

    // Chuyển đổi showDate string thành Date object
    const showDateObj =
      showDate instanceof Date ? showDate : new Date(showDate);

    // Xác định ngày trong tuần (0 = Chủ nhật, 1-6 = Thứ 2 đến Thứ 7)
    const dayOfWeek = showDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Map qua mảng showTimes để tính giá cho từng suất chiếu
    const priceMap = showTimes.map((showTime) => {
      const hour = parseInt(showTime.split(":")[0]);
      const isAfter17 = hour >= 17;

      let basePrice;
      if (isWeekend) {
        basePrice = isAfter17 ? activePrice.type4Price : activePrice.type3Price;
      } else {
        basePrice = isAfter17 ? activePrice.type2Price : activePrice.type1Price;
      }

      return {
        showTime,
        price: basePrice,
      };
    });

    return priceMap;
  } catch (error) {
    throw new Error(`Error calculating ticket prices: ${error.message}`);
  }
};

export const getShowtimeByMovie = async (req, res) => {
  try {
    const { slug, showDate, address, cinemaId } = req.body;

    if (!slug || !showDate) {
      return sendResponse(
        res,
        400,
        false,
        "Missing required fields: slug and showDate"
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(showDate)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid date format. Please use YYYY-MM-DD format"
      );
    }

    const date = new Date(showDate);
    if (isNaN(date.getTime())) {
      return sendResponse(res, 400, false, "Invalid date value");
    }

    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return sendResponse(
        res,
        200,
        true,
        "Successfully retrieved showtimes",
        []
      );
    }

    const cinemas = await Cinema.find({
      status: "active",
      ...(cinemaId && { _id: cinemaId }),
      ...(address && { address: { $regex: address, $options: "i" } }),
    }).select("name address phoneNumber email");

    if (!cinemas.length) {
      return sendResponse(
        res,
        200,
        true,
        "Successfully retrieved showtimes",
        []
      );
    }

    const theaters = await Theater.find({
      cinemaId: { $in: cinemas.map((cinema) => cinema._id) },
      status: "active",
    });

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const showtimes = await Showtime.find({
      movieId: movie._id,
      theaterId: { $in: theaters.map((theater) => theater._id) },
      showDate: { $gte: startOfDay, $lte: endOfDay },
      status: "active",
    }).populate({ path: "theaterId", select: "name type" });

    const result = cinemas
      .map((cinema) => {
        const cinemaTheaters = theaters.filter((theater) =>
          theater.cinemaId.equals(cinema._id)
        );
        const cinemaShowtimes = showtimes.filter((showtime) =>
          cinemaTheaters.some((theater) =>
            theater._id.equals(showtime.theaterId._id)
          )
        );

        if (cinemaShowtimes.length > 0) {
          return {
            cinema: {
              name: cinema.name,
              address: cinema.address,
              phoneNumber: cinema.phoneNumber,
              email: cinema.email,
            },
            showtimes: cinemaShowtimes.map((showtime) => ({
              id: showtime._id,
              showDate: showtime.showDate,
              showTime: showtime.showTime,
              theater: {
                name: showtime.theaterId.name,
                type: showtime.theaterId.type,
              },
              availableSeats: showtime.availableSeats,
              price: showtime.price,
              status: showtime.status,
            })),
          };
        }
      })
      .filter(Boolean);

    return sendResponse(
      res,
      200,
      true,
      "Successfully retrieved showtimes",
      result.length ? result : []
    );
  } catch (error) {
    console.error("Error in getShowtimeByMovie:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
export const addNewShowtime = async (req, res) => {
  try {
    const { theaterId, movieId, showDate, showTime, status, price, type } =
      req.body;
    price = 9999;
    const theater = await Theater.findById(theaterId).populate("cinemaId");
    if (!theater) {
      return sendResponse(res, 404, false, "Theater not found");
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendResponse(res, 404, false, "Movie not found");
    }

    // Tạo ngày từ showDate và giữ nguyên ngày không thay đổi timezone
    const [year, month, day] = showDate.split("-");
    const formattedShowDate = new Date(Date.UTC(year, month - 1, day));

    // Lấy thời gian hiện tại
    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );

    if (formattedShowDate < todayUTC) {
      return sendResponse(res, 400, false, "Show date cannot be in the past");
    }

    // Kiểm tra xem có suất chiếu nào trùng không
    const existingShowtime = await Showtime.findOne({
      theaterId: theater._id,
      showDate: formattedShowDate,
      showTime,
    }).populate("movieId");

    if (existingShowtime) {
      return sendResponse(
        res,
        400,
        false,
        "Showtime already exists in this theater",
        {
          conflict: {
            cinema: theater.cinemaId.name,
            theater: theater.name,
            movie: existingShowtime.movieId.title,
            time: showTime,
            date: showDate,
          },
        }
      );
    }

    const newShowtime = new Showtime({
      theaterId,
      movieId,
      showDate: formattedShowDate,
      showTime,
      status,
      type,
      availableSeats: theater.capacity,
      price,
    });

    await newShowtime.save();

    return sendResponse(
      res,
      201,
      true,
      "New showtime added successfully",
      newShowtime
    );
  } catch (error) {
    console.error("Error in addNewShowtime:", error);
    return sendResponse(res, 500, false, "Error adding new showtime");
  }
};

export const getMovieShowDates = async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug) {
      return sendResponse(res, 400, false, "Missing required field: slug");
    }

    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return sendResponse(
        res,
        200,
        true,
        "Successfully retrieved show dates",
        []
      );
    }

    const cinemas = await Cinema.find({ status: "active" });
    if (!cinemas.length) {
      return sendResponse(
        res,
        200,
        true,
        "Successfully retrieved show dates",
        []
      );
    }

    const theaters = await Theater.find({
      cinemaId: { $in: cinemas.map((c) => c._id) },
      status: "active",
    });

    const showtimes = await Showtime.find({
      movieId: movie._id,
      theaterId: { $in: theaters.map((t) => t._id) },
      status: "active",
    }).select("showDate");

    const showDates = [
      ...new Set(
        showtimes.map(
          (showtime) => new Date(showtime.showDate).toISOString().split("T")[0]
        )
      ),
    ].sort();

    return sendResponse(
      res,
      200,
      true,
      "Successfully retrieved show dates",
      showDates
    );
  } catch (error) {
    console.error("Error in getMovieShowDates:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
export const getShowtimeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findById(id)
      .populate({
        path: "theaterId",
        populate: { path: "cinemaId", select: "name address ticketPrices" },
        select: "name type cinemaId",
      })
      .populate({
        path: "movieId",
        select:
          "slug title description genre classification duration format director actors language coverImage rating views startDate status",
      });

    if (!showtime || showtime.status !== "active") {
      return sendResponse(res, 404, false, "Showtime not found or inactive");
    }

    const responseData = {
      movieInfo: { ...showtime.movieId.toObject() },
      showInfo: {
        idCinema: showtime.theaterId.cinemaId._id,
        nameCinema: showtime.theaterId.cinemaId.name,
        addressCinema: showtime.theaterId.cinemaId.address,
        ticketPricesCinema: showtime.theaterId.cinemaId.ticketPrices,
        idTheater: showtime.theaterId._id,
        typeTheater: showtime.theaterId.type,
        nameTheater: showtime.theaterId.name,
        idShowtime: showtime._id,
        showtimeDate: showtime.showDate,
        showtimeTime: showtime.showTime,
        priceShowtime: showtime.price,
      },
    };

    return sendResponse(
      res,
      200,
      true,
      "Successfully retrieved showtime detail",
      responseData
    );
  } catch (error) {
    console.error("Error in getShowtimeDetail:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
export const getAllShowtimes = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const { movieId, cinemaId, fromDate, toDate } = req.body;

    let pipeline = [
      {
        $match: {
          status: "active",
          ...(movieId && { movieId: new mongoose.Types.ObjectId(movieId) }),
        },
      },
      {
        $lookup: {
          from: "theaters",
          localField: "theaterId",
          foreignField: "_id",
          as: "theater",
        },
      },
      {
        $unwind: {
          path: "$theater",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie",
        },
      },
      {
        $unwind: {
          path: "$movie",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cinemas",
          localField: "theater.cinemaId",
          foreignField: "_id",
          as: "cinema",
        },
      },
      {
        $unwind: {
          path: "$cinema",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Filter by cinemaId
    if (cinemaId) {
      pipeline.push({
        $match: {
          "theater.cinemaId": new mongoose.Types.ObjectId(cinemaId),
        },
      });
    }

    // Filter by date range
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);

      pipeline.push({
        $match: { showDate: dateFilter },
      });
    }

    // Project fields
    pipeline.push({
      $project: {
        _id: 0,
        idShowTime: "$_id",
        idTheaterId: "$theaterId",
        idMovie: "$movieId",
        idCinema: "$theater.cinemaId",
        showDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$showDate",
          },
        },
        showTime: 1,
        type: 1,
        availableSeats: 1,
        price: 1,
        nameMovie: "$movie.title",
        nameCinema: "$cinema.name",
        nameTheater: "$theater.name",
        status: 1,
        createdAt: 1, // Thêm trường createdAt vào projection
      },
    });

    // Sắp xếp theo createdAt giảm dần (mới nhất trước)
    pipeline.push({
      $sort: { createdAt: -1 },
    });

    // Execute query without pagination to get total count
    const totalShowtimes = await Showtime.aggregate(pipeline);
    const total = totalShowtimes.length;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute query with pagination
    const showtimes = await Showtime.aggregate(pipeline);

    return sendResponse(
      res,
      200,
      true,
      showtimes.length
        ? "Lấy danh sách suất chiếu thành công"
        : "Không có suất chiếu nào trong hệ thống",
      {
        showtimes,
        totalShowtimes: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Error in getAllShowtimes:", error);
    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      error.message
    );
  }
};
export const addMultipleShowtimes = async (req, res) => {
  try {
    const { movieId, showTime, showDate, status, type } = req.body;

    // Tính giá cho tất cả các suất chiếu
    const priceCalculations = await calculatePricesForMultipleShowtimes(
      showTime,
      showDate,
      type
    );

    // Tạo map để tra cứu giá nhanh theo showTime
    const priceMap = Object.fromEntries(
      priceCalculations.map((item) => [item.showTime, item.price])
    );

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendResponse(res, 404, false, "Movie not found");
    }

    const cinemas = await Cinema.find({ status: "active" });
    if (!cinemas.length) {
      return sendResponse(res, 404, false, "No active cinemas found");
    }

    const [year, month, day] = showDate.split("-");
    const formattedShowDate = new Date(Date.UTC(year, month - 1, day));

    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    if (formattedShowDate < todayUTC) {
      return sendResponse(res, 400, false, "Show date cannot be in the past");
    }

    const showtimeAllocations = [];
    const conflicts = [];

    for (const cinema of cinemas) {
      const theaters = await Theater.find({
        cinemaId: cinema._id,
        status: "active",
      });

      for (const time of showTime) {
        let foundTheater = false;
        let conflictsForThisTime = [];

        for (const theater of theaters) {
          const existingShowtime = await Showtime.findOne({
            theaterId: theater._id,
            showDate: formattedShowDate,
            showTime: time,
          }).populate("movieId");

          if (!existingShowtime) {
            // Lấy giá từ priceMap cho suất chiếu cụ thể
            const price = priceMap[time];

            showtimeAllocations.push({
              theaterId: theater._id,
              movieId,
              showDate: formattedShowDate,
              showTime: time,
              status,
              type,
              availableSeats: theater.capacity,
              price,
            });
            foundTheater = true;
            break;
          } else {
            conflictsForThisTime.push({
              cinema: cinema.name,
              theater: theater.name,
              movie: existingShowtime.movieId.title,
              time: time,
              date: showDate,
            });
          }
        }

        if (!foundTheater) {
          conflicts.push(...conflictsForThisTime);
        }
      }
    }

    if (conflicts.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "No available theaters found for some showtimes",
        {
          message: "Schedule conflicts found",
          conflicts: conflicts,
        }
      );
    }

    const createdShowtimes = [];
    for (const allocation of showtimeAllocations) {
      const newShowtime = new Showtime(allocation);
      await newShowtime.save();
      createdShowtimes.push(newShowtime);
    }

    return sendResponse(
      res,
      201,
      true,
      "Multiple showtimes added successfully",
      createdShowtimes
    );
  } catch (error) {
    console.error("Error in addMultipleShowtimes:", error);
    return sendResponse(res, 500, false, "Error adding showtimes");
  }
};
export const addMultipleShowtimesTheater = async (req, res) => {
  try {
    const { movieId, showTime, showDate, status, type, theaterId } = req.body;
    // Tính giá cho tất cả các suất chiếu
    const priceCalculations = await calculatePricesForMultipleShowtimes(
      showTime,
      showDate,
      type
    );

    // Tạo map để tra cứu giá nhanh theo showTime
    const priceMap = Object.fromEntries(
      priceCalculations.map((item) => [item.showTime, item.price])
    );
    // Validate movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendResponse(res, 404, false, "Movie not found");
    }

    // Validate theater exists and is active
    const theater = await Theater.findOne({
      _id: theaterId,
      status: "active",
    });
    if (!theater) {
      return sendResponse(res, 404, false, "Theater not found or inactive");
    }

    // Format and validate show date
    const [year, month, day] = showDate.split("-");
    const formattedShowDate = new Date(Date.UTC(year, month - 1, day));

    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    if (formattedShowDate < todayUTC) {
      return sendResponse(res, 400, false, "Show date cannot be in the past");
    }

    // Check conflicts for all showtimes
    const conflicts = [];
    const showtimeAllocations = [];

    for (const time of showTime) {
      const existingShowtime = await Showtime.findOne({
        theaterId,
        showDate: formattedShowDate,
        showTime: time,
      }).populate("movieId");

      if (existingShowtime) {
        conflicts.push({
          theater: theater.name,
          movie: existingShowtime.movieId.title,
          time,
          date: showDate,
        });
      } else {
        const price = priceMap[time];
        showtimeAllocations.push({
          theaterId,
          movieId,
          showDate: formattedShowDate,
          showTime: time,
          status,
          type,
          availableSeats: theater.capacity,
          price,
        });
      }
    }

    // Return conflicts if any found
    if (conflicts.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "Scheduling conflicts found for the selected theater",
        {
          message: "Schedule conflicts found",
          conflicts,
        }
      );
    }

    // Create all showtimes if no conflicts
    const createdShowtimes = [];
    for (const allocation of showtimeAllocations) {
      const newShowtime = new Showtime(allocation);
      await newShowtime.save();
      createdShowtimes.push(newShowtime);
    }

    return sendResponse(
      res,
      201,
      true,
      "Multiple showtimes added successfully",
      createdShowtimes
    );
  } catch (error) {
    console.error("Error in addMultipleShowtimes:", error);
    return sendResponse(res, 500, false, "Error adding showtimes");
  }
};
export const deleteShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    if (!showtimeId) {
      return sendResponse(
        res,
        400,
        false,
        "Missing required field: showtimeId"
      );
    }

    // Xóa các bản ghi SeatStatus liên quan đến suất chiếu
    const seatStatusDeletionResult = await SeatStatus.deleteMany({
      showtimeId,
    });

    // Xóa suất chiếu
    const showtimeDeletionResult = await Showtime.findByIdAndDelete(showtimeId);

    if (!showtimeDeletionResult) {
      return sendResponse(
        res,
        404,
        false,
        "Showtime not found or already deleted"
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Showtime and related data deleted successfully",
      {
        deletedShowtime: showtimeDeletionResult,
        deletedSeatStatuses: seatStatusDeletionResult.deletedCount,
      }
    );
  } catch (error) {
    console.error("Error in deleteShowtime:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
