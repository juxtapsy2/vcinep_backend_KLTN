import Movie from "../models/MovieModel.js";
import Cinema from "../models/CinemaModel.js";
import Showtime from "../models/ShowtimeModel.js";
import Theater from "../models/TheaterModel.js";
import { sendResponse } from "../utils/responseHandler.js";

export const getAllActiveMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ status: "active" });
    return sendResponse(
      res,
      200,
      true,
      "Fetched active movies successfully",
      movies
    );
  } catch (error) {
    console.error("Error in getAllActiveMovies:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
export const getActiveCinemasByMovieId = async (req, res) => {
  const { movieId } = req.params;

  try {
    // Lấy tất cả các showtime của bộ phim có status là 'active'
    const showtimes = await Showtime.find({
      movieId,
      status: "active",
    }).populate({
      path: "theaterId",
      model: "Theater",
      populate: {
        path: "cinemaId",
        model: "Cinema",
      },
    });

    // Lọc ra các rạp từ các showtime và loại bỏ các rạp trùng lặp
    const activeCinemas = [];
    const seenCinemaIds = new Set();

    for (const showtime of showtimes) {
      const cinema = showtime.theaterId.cinemaId;
      if (
        cinema &&
        cinema.status === "active" &&
        !seenCinemaIds.has(cinema._id.toString())
      ) {
        activeCinemas.push(cinema);
        seenCinemaIds.add(cinema._id.toString());
      }
    }

    return sendResponse(
      res,
      200,
      true,
      "Fetched active cinemas successfully",
      activeCinemas
    );
  } catch (error) {
    console.error("Error in getActiveCinemasByMovieId:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

export const getShowDatesByMovieAndCinema = async (req, res) => {
  const { movieId, cinemaId } = req.body;

  // Nếu movieId hoặc cinemaId là null thì không xử lý
  if (!movieId || !cinemaId) {
    return sendResponse(res, 400, false, "Movie ID and Cinema ID are required");
  }

  try {
    // Tìm tất cả các showtime có movieId và theaterId thuộc cinemaId
    const showtimes = await Showtime.find({
      movieId,
      status: "active",
    }).populate({
      path: "theaterId",
      model: "Theater",
      match: { cinemaId },
    });

    // Tạo một mảng chứa showDate và idShowtime
    const showDateDetails = [];

    showtimes.forEach((showtime) => {
      if (showtime.theaterId && showtime.showDate) {
        // Chuyển đổi showDate về kiểu Date nếu cần
        const showDate = new Date(showtime.showDate);
        if (!isNaN(showDate)) {
          showDateDetails.push({
            idShowtime: showtime._id,
            showDate: showDate.toISOString().split("T")[0],
          });
        }
      }
    });

    // Loại bỏ các bản ghi trùng lặp dựa trên `showDate`
    const uniqueShowDateDetails = Array.from(
      new Map(showDateDetails.map((item) => [item.showDate, item])).values()
    );

    return sendResponse(
      res,
      200,
      true,
      "Fetched show dates successfully",
      uniqueShowDateDetails
    );
  } catch (error) {
    console.error("Error in getShowDatesByMovieAndCinema:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
export const getShowtimesByMovieCinemaDate = async (req, res) => {
  const { movieId, cinemaId, showDate } = req.body;

  // Kiểm tra input
  if (!movieId || !cinemaId || !showDate) {
    return sendResponse(
      res,
      400,
      false,
      "Movie ID, Cinema ID, and Show Date are required"
    );
  }

  try {
    // Tìm tất cả các showtime có movieId, ngày chiếu khớp và theater thuộc cinemaId
    const showtimes = await Showtime.find({
      movieId,
      showDate: new Date(showDate),
      status: "active",
    }).populate({
      path: "theaterId",
      model: "Theater",
      match: { cinemaId },
    });

    // Tạo mảng chứa idShowtime và showTime
    const showtimeDetails = [];

    showtimes.forEach((showtime) => {
      if (showtime.theaterId) {
        showtimeDetails.push({
          idShowtime: showtime._id,
          showTime: showtime.showTime,
        });
      }
    });

    return sendResponse(
      res,
      200,
      true,
      "Fetched showtimes successfully",
      showtimeDetails
    );
  } catch (error) {
    console.error("Error in getShowtimesByMovieCinemaDate:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
