// Theater Controller
import { sendResponse } from "../utils/responseHandler.js";
import Theater from "../models/TheaterModel.js";
import Cinema from "../models/CinemaModel.js";
import Seat from "../models/SeatModel.js";
export const addNewTheater = async (req, res) => {
  try {
    const {
      cinemaId,
      type,
      name,
      status,
      capacity,
      screenSize,
      soundSystem,
      rows,
      columns,
    } = req.body;
    const existingCinema = await Cinema.findById(cinemaId);
    if (!existingCinema) {
      return sendResponse(res, 404, false, "Cinema not found");
    }
    const existingTheater = await Theater.findOne({
      cinemaId: cinemaId,
      name: name,
    });
    if (existingTheater) {
      return sendResponse(
        res,
        400,
        false,
        "Theater name already exists in this cinema"
      );
    }
    const newTheater = await Theater.create({
      cinemaId,
      type,
      name,
      status,
      capacity,
      screenSize,
      soundSystem,
      rows,
      columns,
    });
    const seats = [];
    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(65 + i);
      for (let j = 1; j <= columns; j++) {
        seats.push({
          theaterId: newTheater._id,
          type: type === "VIP" ? "vip" : "standard",
          seatNumber: `${rowLetter}${j}`,
          row: rowLetter,
          column: j,
          status: "active",
        });
      }
    }
    await Seat.insertMany(seats);
    return sendResponse(
      res,
      201,
      true,
      "New theater and seats added successfully",
      newTheater
    );
  } catch (error) {
    console.error("Error in addNewTheater:", error);
    if (error.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        "Theater with this name already exists in this cinema"
      );
    }
    return sendResponse(
      res,
      500,
      false,
      "Error adding new theater: " + error.message
    );
  }
};
export const getTheatersByCinemaSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cinema = await Cinema.findOne({ slug });
    if (!cinema) {
      return sendResponse(res, 404, false, "Cinema not found");
    }

    const theaters = await Theater.find({ cinemaId: cinema._id });

    if (theaters.length === 0) {
      return sendResponse(res, 404, false, "No theaters found for this cinema");
    }

    return sendResponse(
      res,
      200,
      true,
      "Theaters retrieved successfully",
      theaters
    );
  } catch (error) {
    console.error("Error in getTheatersByCinemaSlug:", error);

    return sendResponse(
      res,
      500,
      false,
      "Error retrieving theaters: " + error.message
    );
  }
};
export const getTheaterById = async (req, res) => {
  try {
    const { id } = req.params;
    const theater = await Theater.findById(id);
    if (!theater) {
      return sendResponse(res, 404, false, "Không tìm thấy phòng chiếu");
    }
    return sendResponse(
      res,
      200,
      true,
      "Lấy thông tin phòng chiếu thành công",
      theater
    );
  } catch (error) {
    console.error("Lỗi trong getTheaterById:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;

    const theater = await Theater.findById(id);
    if (!theater) {
      return sendResponse(res, 404, false, "Không tìm thấy phòng chiếu");
    }
    await Seat.deleteMany({ theaterId: id });
    await Theater.findByIdAndDelete(id);
    return sendResponse(
      res,
      200,
      true,
      "Xóa phòng chiếu và tất cả ghế thành công"
    );
  } catch (error) {
    console.error("Lỗi trong deleteTheater:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getTheatersByCinemaId = async (req, res) => {
  try {
    const { cinemaId } = req.params;
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return sendResponse(res, 404, false, "Không tìm thấy rạp chiếu");
    }

    const theaters = await Theater.find(
      { cinemaId, status: "active" },
      "_id name"
    );
    if (theaters.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không có phòng chiếu nào đang hoạt động"
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Danh sách các phòng chiếu đang hoạt động được lấy thành công",
      theaters
    );
  } catch (error) {
    console.error("Lỗi trong getActiveTheatersByCinemaId:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
