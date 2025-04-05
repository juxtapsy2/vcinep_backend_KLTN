import mongoose from "mongoose";
import { sendResponse } from "../utils/responseHandler.js";
import Ticket from "../models/TicketModel.js";
import Showtime from "../models/ShowtimeModel.js";
import User from "../models/UserModel.js";
import Movie from "../models/MovieModel.js";
import Theater from "../models/TheaterModel.js";
import Cinema from "../models/CinemaModel.js";
import { sendMail } from "../utils/sendMail.js"; // Giả sử bạn đã có utility function gửi mail
import { ticketEmailTemplate } from "../constants/ticketEmailTemplate.js";
import QRCode from "qrcode";
const generateQRCode = async (ticket) => {
  const qrData = {
    code: ticket.code,
    movie: ticket.movie.title,
    showtime: `${new Date(ticket.showDate).toLocaleDateString()} ${
      ticket.showTime
    }`,
    theater: `${ticket.theater.name} - ${ticket.theater.cinemaId.name}`,
    seats: ticket.seats,
    totalPrice: ticket.totalPrice,
  };

  // Tạo QR code dưới dạng base64
  return await QRCode.toDataURL(JSON.stringify(qrData));
};
export const addNewTicket = async (req, res) => {
  try {
    const { showtimeId, seats, concession, totalPrice, status, userId, code } =
      req.body;
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      return sendResponse(res, 404, false, "Showtime not found");
    }
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendResponse(res, 404, false, "User not found");
    }
    const newTicket = await Ticket.create({
      showtimeId,
      seats,
      concession,
      totalPrice,
      status,
      userId,
      code,
    });
    return sendResponse(
      res,
      201,
      true,
      "New ticket added successfully",
      newTicket
    );
  } catch (error) {
    console.error("Error in addNewTicket:", error);
    if (error.name === "ValidationError") {
      return sendResponse(
        res,
        400,
        false,
        "Validation Error: " + error.message
      );
    }
    return sendResponse(
      res,
      500,
      false,
      "Error adding new ticket: " + error.message
    );
  }
};
export const checkTicketExist = async (req, res) => {
  try {
    const { userId, showtimeId } = req.body;
    if (!userId || !showtimeId) {
      return sendResponse(
        res,
        400,
        false,
        "Missing required parameters: userId or showtimeId"
      );
    }
    const existingTicket = await Ticket.findOne({ userId, showtimeId });
    if (existingTicket) {
      return sendResponse(
        res,
        200,
        true,
        "Ticket already exists",
        existingTicket
      );
    }
    return sendResponse(
      res,
      200,
      true,
      "No ticket found for this user and showtime",
      existingTicket
    );
  } catch (error) {
    console.error("Error in checkTicketExist:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error checking ticket existence: " + error.message
    );
  }
};
export const getTicketsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const tickets = await Ticket.find({ userId })
      .populate({
        path: "showtimeId",
        populate: [
          {
            path: "movieId",
            select: "title coverImage",
          },
          {
            path: "theaterId",
            populate: {
              path: "cinemaId",
              select: "name address coverImage",
            },
            select: "name",
          },
        ],
        select: "showDate showTime",
      })
      .populate({
        path: "userId",
        select: "username phoneNumber email",
      })
      .select("_id seats concession totalPrice code createdAt isCancelled")
      .sort({ createdAt: -1 });

    if (!tickets.length) {
      return res.status(200).json({
        success: true,
        message: "No tickets found for this user",
        data: [],
      });
    }

    // Định dạng dữ liệu bao gồm _id
    const formattedTickets = tickets.map((ticket) => ({
      ticketId: ticket._id, // ID của vé
      movieTitle: ticket.showtimeId?.movieId?.title || "N/A",
      coverImageMovie: ticket.showtimeId?.movieId?.coverImage || "",
      nameCinema: ticket.showtimeId?.theaterId?.cinemaId?.name || "N/A",
      addressCinema: ticket.showtimeId?.theaterId?.cinemaId?.address || "N/A",
      nameTheater: ticket.showtimeId?.theaterId?.name || "N/A",
      showDate: ticket.showtimeId?.showDate || "N/A",
      showTime: ticket.showtimeId?.showTime || "N/A",
      codeTicket: ticket.code || "N/A",
      isCancelled: ticket.isCancelled || false,
      seatTicket: ticket.seats || "N/A",
      concessionTicket: ticket.concession || "N/A",
      totalPrice: ticket.totalPrice || 0,
      paymentDate: ticket.createdAt || "N/A", // Ngày thanh toán
      username: ticket.userId?.username || "N/A",
      phoneNumber: ticket.userId?.phoneNumber || "N/A",
      emailUser: ticket.userId?.email || "N/A",
    }));

    return res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: formattedTickets,
    });
  } catch (error) {
    console.error("Error in getTicketsByUserId:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving tickets: " + error.message,
    });
  }
};
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate({
        path: "showtimeId",
        populate: [
          {
            path: "movieId",
            select: "title coverImage",
          },
          {
            path: "theaterId",
            populate: {
              path: "cinemaId",
              select: "name address coverImage",
            },
            select: "name",
          },
        ],
        select: "showDate showTime",
      })
      .populate({
        path: "userId",
        select: "username phoneNumber email",
      })
      .select("_id seats concession totalPrice code createdAt");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Định dạng dữ liệu
    const formattedTicket = {
      ticketId: ticket._id, // ID của vé
      movieTitle: ticket.showtimeId?.movieId?.title || "N/A",
      coverImageMovie: ticket.showtimeId?.movieId?.coverImage || "",
      nameCinema: ticket.showtimeId?.theaterId?.cinemaId?.name || "N/A",
      addressCinema: ticket.showtimeId?.theaterId?.cinemaId?.address || "N/A",
      nameTheater: ticket.showtimeId?.theaterId?.name || "N/A",
      showDate: ticket.showtimeId?.showDate || "N/A",
      showTime: ticket.showtimeId?.showTime || "N/A",
      codeTicket: ticket.code || "N/A",
      seatTicket: ticket.seats || "N/A",
      concessionTicket: ticket.concession || "N/A",
      totalPrice: ticket.totalPrice || 0,
      paymentDate: ticket.createdAt || "N/A", // Ngày thanh toán
      username: ticket.userId?.username || "N/A",
      phoneNumber: ticket.userId?.phoneNumber || "N/A",
      emailUser: ticket.userId?.email || "N/A",
    };

    return res.status(200).json({
      success: true,
      message: "Ticket retrieved successfully",
      data: formattedTicket,
    });
  } catch (error) {
    console.error("Error in getTicketById:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving ticket: " + error.message,
    });
  }
};

export const sendTicketEmail = async (req, res) => {
  const { showtimeId, seats, concession, totalPrice, userId, code } = req.body;

  // Kiểm tra thông tin bắt buộc
  if (!showtimeId || !userId || !totalPrice) {
    return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc!");
  }

  try {
    // Lấy thông tin người dùng
    const user = await User.findById(userId); // Lấy thông tin người dùng từ User model
    if (!user) {
      return sendResponse(res, 404, false, "Không tìm thấy người dùng");
    }

    // Lấy thông tin suất chiếu từ Showtime model
    const showtime = await Showtime.findById(showtimeId)
      .populate({
        path: "movieId",
      })
      .populate({
        path: "theaterId",
        populate: {
          path: "cinemaId", // Populate the cinemaId within the theater
          select: "name", // Select only the name field from the Cinema model
        },
      });

    if (!showtime) {
      return sendResponse(res, 404, false, "Không tìm thấy suất chiếu");
    }

    // Tạo thông tin vé (không lưu vào cơ sở dữ liệu)
    const ticket = {
      showtimeId,
      seats,
      concession,
      totalPrice,
      userId,
      code,
      movie: showtime.movieId,
      theater: showtime.theaterId,
      showDate: showtime.showDate,
      showTime: showtime.showTime,
    };
    const qrCode = await generateQRCode(ticket);
    // Gửi email với thông tin vé
    const html = ticketEmailTemplate(ticket, user, qrCode);
    await sendMail(
      user.email,
      "VCineP - Thông tin vé xem phim của bạn",
      "Chi tiết vé xem phim",
      html
    );

    // Phản hồi thành công
    return sendResponse(res, 200, true, "Vé đã được gửi qua email thành công!");
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return sendResponse(res, 500, false, "Lỗi khi gửi email vé");
  }
};
export const getAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get parameters from query instead of body for GET request
    const {
      code = "",
      movieId = null,
      cinemaId = null,
      showDate = null, // Changed from startDate
    } = req.body;

    // Create pipeline for aggregation
    const pipeline = [
      // First match stage for code filtering
      {
        $match: code ? { code: { $regex: code.trim(), $options: "i" } } : {},
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "showtimes",
          localField: "showtimeId",
          foreignField: "_id",
          as: "showtime",
        },
      },
      { $unwind: "$showtime" },
      {
        $lookup: {
          from: "movies",
          localField: "showtime.movieId",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $lookup: {
          from: "theaters",
          localField: "showtime.theaterId",
          foreignField: "_id",
          as: "theater",
        },
      },
      { $unwind: "$theater" },
      {
        $lookup: {
          from: "cinemas",
          localField: "theater.cinemaId",
          foreignField: "_id",
          as: "cinema",
        },
      },
      { $unwind: "$cinema" },
    ];

    // Add filtering conditions
    const matchConditions = {};

    if (movieId) {
      matchConditions["movie._id"] = new mongoose.Types.ObjectId(movieId);
    }

    if (cinemaId) {
      matchConditions["cinema._id"] = new mongoose.Types.ObjectId(cinemaId);
    }

    if (showDate) {
      // Convert showDate string to Date object and set time to start of day
      const date = new Date(showDate);
      date.setUTCHours(0, 0, 0, 0);

      // Create end of day date
      const nextDate = new Date(date);
      nextDate.setUTCHours(23, 59, 59, 999);

      matchConditions["showtime.showDate"] = {
        $gte: date,
        $lte: nextDate,
      };
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const tickets = await Ticket.aggregate(pipeline);

    // Format results
    const formattedTickets = tickets.map((ticket) => ({
      _id: ticket._id,
      movieTitle: ticket.movie?.title || "N/A",
      coverImageMovie: ticket.movie?.coverImage || "",
      nameCinema: ticket.cinema?.name || "N/A",
      addressCinema: ticket.cinema?.address || "N/A",
      nameTheater: ticket.theater?.name || "N/A",
      showDate: ticket.showtime?.showDate || "N/A",
      showTime: ticket.showtime?.showTime || "N/A",
      codeTicket: ticket.code || "N/A",
      seatTicket: ticket.seats || "N/A",
      isCancelled: ticket.isCancelled || false,
      concessionTicket: ticket.concession || "N/A",
      totalPrice: ticket.totalPrice || 0,
      username: ticket.user?.username || "N/A",
      phoneNumber: ticket.user?.phoneNumber || "N/A",
      emailUser: ticket.user?.email || "N/A",
      status: ticket.status,
      createdAt: ticket.createdAt,
    }));

    // Count total tickets based on filter conditions
    const countPipeline = [...pipeline];
    countPipeline.splice(-2); // Remove skip and limit
    countPipeline.push({ $count: "total" });
    const countResult = await Ticket.aggregate(countPipeline);
    const totalTickets = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalTickets / limit);

    return res.status(200).json({
      success: true,
      message:
        tickets.length > 0 ? "Lấy danh sách vé thành công" : "Không có vé nào",
      data: {
        tickets: formattedTickets,
        totalTickets,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi trong getAllTickets:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};
export const checkTicketCancelled = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate({
        path: "showtimeId",
        select: "showDate showTime",
      })
      .select("isCancelled status showtimeId");

    if (!ticket) {
      return sendResponse(res, 404, false, "Ticket not found");
    }

    // Kiểm tra xem vé có thể hủy được không
    const showtime = ticket.showtimeId;
    const showtimeDate = new Date(`${showtime.showDate} ${showtime.showTime}`);
    const now = new Date();
    const hoursDifference = (showtimeDate - now) / (1000 * 60 * 60);

    return sendResponse(
      res,
      200,
      true,
      "Ticket cancellation status retrieved",
      {
        isCancelled: ticket.isCancelled,
        status: ticket.status,
        canBeCancelled:
          hoursDifference > 2 &&
          !ticket.isCancelled &&
          ticket.status === "active",
      }
    );
  } catch (error) {
    console.error("Error in checkTicketCancelled:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error checking ticket cancellation: " + error.message
    );
  }
};
export const cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate({
        path: "showtimeId",
        select: "showDate showTime movieId theaterId",
        populate: [
          { path: "movieId", select: "title" },
          {
            path: "theaterId",
            select: "name cinemaId",
            populate: { path: "cinemaId", select: "name" },
          },
        ],
      })
      .populate("userId", "email");

    if (!ticket) {
      return sendResponse(res, 404, false, "Ticket not found");
    }

    // Kiểm tra xem vé đã bị hủy chưa
    if (ticket.isCancelled) {
      return sendResponse(res, 400, false, "Ticket is already cancelled");
    }
    // // Kiểm tra thời gian trước suất chiếu
    const showtime = ticket.showtimeId;
    // Cập nhật trạng thái vé
    ticket.isCancelled = true;
    // ticket.status = "inactive";
    await ticket.save();

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận hủy vé</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #E31837;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background-color: #ffffff;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .ticket-info {
              margin: 20px 0;
              border-left: 4px solid #E31837;
              padding-left: 15px;
            }
            .ticket-detail {
              margin: 10px 0;
            }
            .price {
              font-size: 20px;
              color: #E31837;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding: 20px;
              color: #666666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">VCINEP</div>
              <div>XÁC NHẬN HỦY VÉ</div>
            </div>
            <div class="content">
              <p>Kính gửi Quý khách,</p>
              <p>Vé xem phim của quý khách đã được hủy thành công. Chi tiết vé như sau:</p>
              
              <div class="ticket-info">
                <div class="ticket-detail"><strong>Phim:</strong> ${
                  showtime.movieId.title
                }</div>
                <div class="ticket-detail"><strong>Rạp:</strong> ${
                  showtime.theaterId.name
                } - ${showtime.theaterId.cinemaId.name}</div>
                <div class="ticket-detail"><strong>Suất chiếu:</strong> ${new Date(
                  showtime.showDate
                ).toLocaleDateString("vi-VN")} ${showtime.showTime}</div>
                <div class="ticket-detail"><strong>Ghế:</strong> ${
                  ticket.seats
                }</div>
                <div class="ticket-detail price">Số tiền hoàn trả: ${new Intl.NumberFormat(
                  "vi-VN",
                  { style: "currency", currency: "VND" }
                ).format(ticket.totalPrice)}</div>
              </div>

              <p>Số tiền hoàn trả sẽ được chuyển về tài khoản của quý khách trong vòng 3-5 ngày làm việc.</p>
              <p>Cảm ơn quý khách đã sử dụng dịch vụ của VCINEP.</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động. Vui lòng không trả lời email này.</p>
              <p>© 2024 VCINEP. Tất cả các quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendMail(
      ticket.userId.email,
      "Xác nhận hủy vé - VCINEP",
      "Vé của bạn đã được hủy thành công",
      emailTemplate
    );
    return sendResponse(
      res,
      200,
      true,
      "Ticket cancelled successfully",
      ticket
    );
  } catch (error) {
    console.error("Error in cancelTicket:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error cancelling ticket: " + error.message
    );
  }
};
//Add by The Vi 2025-4-05
export const getTicketsByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      return sendResponse(res, 404, false, "Showtime not found");
    }

    // Tìm tất cả tickets theo showtimeId
    const tickets = await Ticket.find({ showtimeId })
      .populate("userId", "username email") // Lấy thêm thông tin user
      .populate("showtimeId", "startTime endTime"); // Lấy thêm thông tin showtime

    return sendResponse(
      res,
      200,
      true,
      "Tickets retrieved successfully",
      tickets
    );
  } catch (error) {
    console.error("Error in getTicketsByShowtime:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error getting tickets: " + error.message
    );
  }
};
