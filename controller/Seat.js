import { sendResponse } from "../utils/responseHandler.js";
import Seat from "../models/SeatModel.js";
import Theater from "../models/TheaterModel.js";
export const addNewSeat = async (req, res) => {
  try {
    const { theaterId, type, seatNumber, row, column } = req.body;

    // Kiểm tra xem theater có tồn tại không
    const existingTheater = await Theater.findById(theaterId);
    if (!existingTheater) {
      return sendResponse(res, 404, false, "Theater not found");
    }

    // Kiểm tra xem ghế đã tồn tại trong theater này chưa (theo row và column)
    const existingSeatByPosition = await Seat.findOne({
      theaterId,
      row,
      column,
    });
    if (existingSeatByPosition) {
      return sendResponse(
        res,
        400,
        false,
        "A seat already exists at this position in the theater"
      );
    }
    // Kiểm tra xem số ghế đã tồn tại trong theater này chưa
    const existingSeatByNumber = await Seat.findOne({
      theaterId,
      seatNumber,
    });
    if (existingSeatByNumber) {
      return sendResponse(
        res,
        400,
        false,
        "Seat number already exists in this theater"
      );
    }

    // Kiểm tra số lượng ghế không vượt quá capacity của theater
    const currentSeatsCount = await Seat.countDocuments({ theaterId });
    if (currentSeatsCount >= existingTheater.capacity) {
      return sendResponse(
        res,
        400,
        false,
        "Cannot add more seats. Theater capacity limit reached"
      );
    }

    // Validate seat type
    const validTypes = ["standard", "vip", "couple", "accessible"];
    if (!validTypes.includes(type)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid seat type. Must be one of: standard, vip, couple, accessible"
      );
    }

    // Tạo ghế mới
    const newSeat = await Seat.create({
      theaterId,
      type,
      seatNumber,
      row,
      column,
    });

    return sendResponse(res, 201, true, "New seat added successfully", newSeat);
  } catch (error) {
    console.error("Error in addNewSeat:", error);

    if (error.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        "Duplicate seat information. Please check seat number, row, and column"
      );
    }

    return sendResponse(
      res,
      500,
      false,
      "Error adding new seat: " + error.message
    );
  }
};
export const addMultipleSeats = async (req, res) => {
  try {
    const { theaterId, seats } = req.body;

    // Kiểm tra xem theater có tồn tại không
    const existingTheater = await Theater.findById(theaterId);
    if (!existingTheater) {
      return sendResponse(res, 404, false, "Theater not found");
    }

    // Kiểm tra số lượng ghế không vượt quá capacity
    const currentSeatsCount = await Seat.countDocuments({ theaterId });
    if (currentSeatsCount + seats.length > existingTheater.capacity) {
      return sendResponse(
        res,
        400,
        false,
        "Cannot add seats. Would exceed theater capacity"
      );
    }

    // Thêm theaterId vào mỗi seat object
    const seatsWithTheaterId = seats.map((seat) => ({
      ...seat,
      theaterId,
    }));

    // Tạo nhiều ghế cùng lúc
    const newSeats = await Seat.insertMany(seatsWithTheaterId, {
      ordered: false,
    });

    return sendResponse(res, 201, true, "Seats added successfully", newSeats);
  } catch (error) {
    console.error("Error in addMultipleSeats:", error);

    if (error.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        "Some seats have duplicate information. Please check seat numbers, rows, and columns"
      );
    }

    return sendResponse(
      res,
      500,
      false,
      "Error adding seats: " + error.message
    );
  }
};
export const getSeatsByTheaterId = async (req, res) => {
  try {
    const { theaterId } = req.params;
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return sendResponse(res, 404, false, "Rạp chiếu không tồn tại");
    }
    const seats = await Seat.find({ theaterId })
      .select("-createdAt -updatedAt")
      .sort({ row: 1, column: 1 });
    return sendResponse(
      res,
      200,
      true,
      seats.length > 0
        ? "Lấy danh sách ghế thành công"
        : "Không có ghế nào trong rạp",
      seats
    );
  } catch (error) {
    console.error("Lỗi trong getSeatsByTheaterId:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};

export const updateSeatType = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { type } = req.body; // Loại ghế muốn cập nhật: "standard" hoặc "vip"

    // Kiểm tra loại ghế hợp lệ
    if (!["standard", "vip"].includes(type)) {
      return sendResponse(res, 400, false, "Invalid seat type");
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return sendResponse(res, 404, false, "Seat not found");
    }

    seat.type = type;
    await seat.save();

    return sendResponse(
      res,
      200,
      true,
      `Seat updated to ${type} successfully`,
      seat
    );
  } catch (error) {
    console.error("Error in updateSeatType:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Xóa ghế
export const deleteSeat = async (req, res) => {
  try {
    const { seatId } = req.params;

    const seat = await Seat.findByIdAndDelete(seatId);
    if (!seat) {
      return sendResponse(res, 404, false, "Seat not found");
    }

    return sendResponse(res, 200, true, "Seat deleted successfully");
  } catch (error) {
    console.error("Error in deleteSeat:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
