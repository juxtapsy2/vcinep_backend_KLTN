import { sendResponse } from "../utils/responseHandler.js";
import Theater from "../models/TheaterModel.js";
import SeatStatus from "../models/SeatStatusModel.js";
import Showtime from "../models/ShowtimeModel.js";
import Seat from "../models/SeatModel.js";
export const addNewSeatStatus = async (req, res) => {
  try {
    const { showtimeId, seatId, status } = req.body;
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      return sendResponse(res, 404, false, "Showtime not found");
    }
    const existingSeat = await Seat.findById(seatId);
    if (!existingSeat) {
      return sendResponse(res, 404, false, "Seat not found");
    }
    const existingSeatStatus = await SeatStatus.findOne({
      showtimeId,
      seatId,
    });
    if (existingSeatStatus) {
      return sendResponse(
        res,
        400,
        false,
        "Seat status already exists for this showtime and seat"
      );
    }
    const validStatuses = ["available", "reserved", "holding"];
    if (!validStatuses.includes(status)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid status. Must be one of: available, reserved, holding"
      );
    }
    const newSeatStatus = await SeatStatus.create({
      showtimeId,
      seatId,
      status,
    });
    return sendResponse(
      res,
      201,
      true,
      "New seat status added successfully",
      newSeatStatus
    );
  } catch (error) {
    console.error("Error in addNewSeatStatus:", error);

    if (error.code === 11000) {
      return sendResponse(res, 400, false, "Duplicate seat status information");
    }

    return sendResponse(
      res,
      500,
      false,
      "Error adding new seat status: " + error.message
    );
  }
};
export const addMultipleSeatStatuses = async (req, res) => {
  try {
    const { showtimeId, seatStatuses } = req.body;
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      return sendResponse(res, 404, false, "Showtime not found");
    }
    const statusesWithShowtime = seatStatuses.map((status) => ({
      ...status,
      showtimeId,
    }));

    const newStatuses = await SeatStatus.insertMany(statusesWithShowtime, {
      ordered: false,
    });

    return sendResponse(
      res,
      201,
      true,
      "Seat statuses added successfully",
      newStatuses
    );
  } catch (error) {
    console.error("Error in addMultipleSeatStatuses:", error);

    if (error.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        "Some seat statuses have duplicate information"
      );
    }

    return sendResponse(
      res,
      500,
      false,
      "Error adding seat statuses: " + error.message
    );
  }
};
export const getAllSeatsForShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    // Check if showtime exists and get its price
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return sendResponse(res, 404, false, "Showtime not found");
    }

    // Get all seat statuses for this showtime with populated seat information
    const seatStatuses = await SeatStatus.find({ showtimeId }).populate({
      path: "seatId",
      select: "seatNumber row column type",
    });

    // Transform the data into the required format
    const formattedSeats = seatStatuses.map((seatStatus) => {
      const baseSeatPrice = showtime.price;
      const seatPrice =
        seatStatus.seatId.type === "vip" ? baseSeatPrice + 5000 : baseSeatPrice;

      return {
        seatId: seatStatus.seatId._id,
        seatStatusId: seatStatus._id,
        idUser: seatStatus.IdUser || null,
        seatNumber: seatStatus.seatId.seatNumber,
        row: seatStatus.seatId.row,
        column: seatStatus.seatId.column,
        seatStatus: seatStatus.status,
        priceSeat: seatPrice,
        typeSeat: seatStatus.seatId.type,
      };
    });

    return sendResponse(
      res,
      200,
      true,
      "Seats retrieved successfully",
      formattedSeats
    );
  } catch (error) {
    console.error("Error in getAllSeatsForShowtime:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error retrieving seats: " + error.message
    );
  }
};
export const updateSeatStatusToHolding = async (req, res) => {
  try {
    const { seatStatusId, userId } = req.body;

    // Tìm ghế với status là available
    const seatStatus = await SeatStatus.findOne({
      _id: seatStatusId,
      status: "available",
    });

    if (!seatStatus) {
      return sendResponse(
        res,
        200,
        false,
        "Ghế này đã được một người dùng khác đặt trước ! Vui lòng chọn ghế khác !"
      );
    }
    // Cập nhật trạng thái ghế
    seatStatus.status = "holding";
    seatStatus.IdUser = userId;
    await seatStatus.save();
    return sendResponse(
      res,
      200,
      true,
      "Seat status updated successfully",
      seatStatus
    );
  } catch (error) {
    console.error("Error in updateSeatStatusToHolding:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error updating seat status: " + error.message
    );
  }
};
export const updateHoldingToAvailable = async (req, res) => {
  try {
    const { seatStatusId, userId } = req.body;

    // Tìm ghế với status holding và userId match
    const seatStatus = await SeatStatus.findOne({
      _id: seatStatusId,
      status: "holding",
      IdUser: userId, // Kiểm tra userId match
    });

    if (!seatStatus) {
      return sendResponse(
        res,
        404,
        false,
        "Seat not found or you don't have permission to release this seat"
      );
    }

    // Cập nhật trạng thái ghế về available
    seatStatus.status = "available";
    seatStatus.IdUser = null;
    seatStatus.holdingTimeout = null;

    await seatStatus.save();

    return sendResponse(
      res,
      200,
      true,
      "Seat released successfully",
      seatStatus
    );
  } catch (error) {
    console.error("Error in updateHoldingToAvailable:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error releasing seat: " + error.message
    );
  }
};
export const releaseAllHoldingSeats = async (req, res) => {
  try {
    const { userId } = req.body;

    // Tìm tất cả ghế đang holding của userId này
    const holdingSeats = await SeatStatus.find({
      status: "holding",
      IdUser: userId,
    });

    if (holdingSeats.length === 0) {
      return sendResponse(
        res,
        200,
        true,
        "No holding seats found for this user"
      );
    }

    // Cập nhật tất cả ghế về trạng thái available
    const updatePromises = holdingSeats.map(async (seat) => {
      seat.status = "available";
      seat.IdUser = null;
      seat.holdingTimeout = null;
      return seat.save();
    });

    await Promise.all(updatePromises);

    return sendResponse(
      res,
      200,
      true,
      `Successfully released ${holdingSeats.length} seats`,
      {
        releasedSeatsCount: holdingSeats.length,
        releasedSeats: holdingSeats,
      }
    );
  } catch (error) {
    console.error("Error in releaseAllHoldingSeats:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error releasing seats: " + error.message
    );
  }
};
export const updateHoldingToReserved = async (req, res) => {
  try {
    const { seatStatusId, userId } = req.body;

    // Tìm ghế với status là holding
    const seatStatus = await SeatStatus.findOne({
      _id: seatStatusId,
      status: "holding",
    });

    if (!seatStatus) {
      return sendResponse(
        res,
        404,
        false,
        "Seat not found or not in holding status"
      );
    }

    // Kiểm tra userId có match với người giữ ghế
    if (seatStatus.IdUser?.toString() !== userId) {
      return sendResponse(
        res,
        403,
        false,
        "This seat is being held by another user"
      );
    }

    // Cập nhật trạng thái ghế
    seatStatus.status = "reserved";
    seatStatus.holdingTimeout = null;

    await seatStatus.save();

    return sendResponse(
      res,
      200,
      true,
      "Seat status updated from holding to reserved successfully",
      seatStatus
    );
  } catch (error) {
    console.error("Error in updateHoldingToReserved:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error updating seat status: " + error.message
    );
  }
};
export const updateAvailableToReserved = async (req, res) => {
  try {
    const { seatStatusId, userId } = req.body;

    // Tìm ghế với status là available
    const seatStatus = await SeatStatus.findOne({
      _id: seatStatusId,
      status: "available",
    });

    if (!seatStatus) {
      return sendResponse(res, 404, false, "Seat not found or not available");
    }

    // Cập nhật trạng thái ghế
    seatStatus.status = "reserved";
    seatStatus.IdUser = userId;

    await seatStatus.save();

    return sendResponse(
      res,
      200,
      true,
      "Seat status updated from available to reserved successfully",
      seatStatus
    );
  } catch (error) {
    console.error("Error in updateAvailableToReserved:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error updating seat status: " + error.message
    );
  }
};
export const updateMultipleToReserved = async (req, res) => {
  try {
    const { seatStatusIds, userId } = req.body;

    if (!Array.isArray(seatStatusIds) || seatStatusIds.length === 0) {
      return sendResponse(res, 400, false, "Invalid seat status IDs");
    }

    // Tìm tất cả ghế với status là available hoặc holding
    const seatStatuses = await SeatStatus.find({
      _id: { $in: seatStatusIds },
      status: { $in: ["available", "holding"] },
    });

    if (seatStatuses.length !== seatStatusIds.length) {
      return sendResponse(
        res,
        404,
        false,
        "Some seats not found or already reserved"
      );
    }

    // Kiểm tra nếu ghế đang holding thì phải match userId
    const invalidHoldingSeats = seatStatuses.filter(
      (seat) => seat.status === "holding" && seat.IdUser?.toString() !== userId
    );

    if (invalidHoldingSeats.length > 0) {
      return sendResponse(
        res,
        403,
        false,
        "Some seats are being held by another user"
      );
    }

    // Cập nhật tất cả ghế
    const updatePromises = seatStatuses.map((seat) => {
      seat.status = "reserved";
      seat.IdUser = userId;
      seat.holdingTimeout = null;
      return seat.save();
    });

    await Promise.all(updatePromises);

    return sendResponse(
      res,
      200,
      true,
      "All seats updated to reserved successfully",
      seatStatuses
    );
  } catch (error) {
    console.error("Error in updateMultipleToReserved:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error updating seat statuses: " + error.message
    );
  }
};
