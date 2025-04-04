import SeatStatus from "../models/SeatStatusModel.js";
export const getSeatsData = async (showtimeId) => {
  try {
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
          ? seat.showtimeId.price + 20000
          : seat.showtimeId.price,
      type: seat.seatId.type,
    }));
  } catch (error) {
    console.error("Error fetching seats data:", error);
    throw new Error("Failed to fetch seats data");
  }
};
