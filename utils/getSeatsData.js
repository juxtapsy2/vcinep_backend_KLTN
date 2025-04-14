import SeatStatus from "../models/SeatStatusModel.js";
import Price from "../models/PriceModel.js";
export const getSeatsData = async (showtimeId) => {
  try {
    // Lấy bảng giá đang active
    const activePrice = await Price.findOne({ isActive: true });
    if (!activePrice) {
      throw new Error("No active price configuration found");
    }

    const seats = await SeatStatus.find({ showtimeId })
      .populate({
        path: "seatId",
        select: "seatNumber row column type",
      })
      .populate({
        path: "showtimeId",
        select: "price",
      })
      .lean();

    return seats.map((seat) => ({
      id: seat._id,
      userId: seat.IdUser,
      row: seat.seatId.row,
      col: seat.seatId.column,
      status: seat.status,
      price:
        seat.seatId.type === "vip"
          ? seat.showtimeId.price + activePrice.vipRegularDiff
          : seat.showtimeId.price,
      type: seat.seatId.type,
    }));
  } catch (error) {
    console.error("Error fetching seats data:", error);
    throw new Error("Failed to fetch seats data");
  }
};
