import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db.js";
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import movieRoute from "./routes/movie.js";
import cinemaRoute from "./routes/cinema.js";
import showtimeRoute from "./routes/showtime.js";
import theaterRoute from "./routes/theater.js";
import seatRoute from "./routes/seat.js";
import seatStatusRoute from "./routes/seatstatus.js";
import concessionRotue from "./routes/concession.js";
import paymentRoute from "./routes/payment.js";
import ticketRoute from "./routes/ticket.js";
import ratingRoute from "./routes/rating.js";
import commentRouter from "./routes/comment.js";
import blogRouter from "./routes/blog.js";
import quickTicketRouter from "./routes/quickticket.js";
import statisticalRouter from "./routes/statistical.js";
import { Server } from "socket.io";
import { GoogleGenerativeAI } from "@google/generative-ai";

import SeatStatus from "./models/SeatStatusModel.js";
import { createServer } from "node:http";
dotenv.config();
connectDB();
const app = express();
const server = createServer(app);
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/movie", movieRoute);
app.use("/api/cinema", cinemaRoute);
app.use("/api/showtime", showtimeRoute);
app.use("/api/theater", theaterRoute);
app.use("/api/seat", seatRoute);
app.use("/api/seatStatus", seatStatusRoute);
app.use("/api/concession", concessionRotue);
app.use("/api/payment", paymentRoute);
app.use("/api/ticket", ticketRoute);
app.use("/api/quickticket", quickTicketRouter);
app.use("/api/rating", ratingRoute);
app.use("/api/comment", commentRouter);
app.use("/api/statistical", statisticalRouter);
app.use("/api/blog", blogRouter);
// Tích hợp Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyBAZma1Jz_NIZQtD7UposRjE-b7u6IxjN8");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/gemini/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);
    res.status(200).json({ response: result.response.text() });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Error generating content" });
  }
});
app.get("/", (req, res) => {
  res.send("Hello world!");
});
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Chat
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("A user connected to chat:", socket.id);

  socket.on("join-chat", (chatRoom) => {
    socket.join(chatRoom);
    socket.currentRoom = chatRoom;

    if (!rooms.has(chatRoom)) {
      rooms.set(chatRoom, []);
    }
    // Gửi danh sách phòng chỉ cho nhân viên
    io.emit("room-list", Array.from(rooms.keys()));
    // Cập nhật tin nhắn khi chuyển giữa các phòng
    socket.emit("loadMessages", rooms.get(chatRoom) || []);
    console.log(`User joined room: ${chatRoom}`);
  });

  socket.on("sendMessage", ({ room, message }) => {
    if (!room || !rooms.has(room)) return;
    const chatMessage = {
      text: message.text,
      sender: message.sender,
      room: room,
    };
    rooms.get(room).push(chatMessage);
    io.to(room).emit("receiveMessage", chatMessage);
    // [Test only!!]
    // Colorful console.log message content
    console.log(`\x1b[36mRoom ${socket.currentRoom}\x1b[0m - \x1b[33m${message.sender}\x1b[0m said: \x1b[32m${message.text}\x1b[0m`);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

// Seats
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  let currentRoom = null;

  socket.on("join-room", (showtimeId) => {
    if (!showtimeId) return;

    // Leave previous room if exists
    if (currentRoom) {
      socket.leave(currentRoom);
      const previousRoomClients = rooms.get(currentRoom);
      if (previousRoomClients) {
        previousRoomClients.delete(socket.id);
        if (previousRoomClients.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }

    // Join new room
    socket.join(showtimeId);
    currentRoom = showtimeId;

    if (!rooms.has(showtimeId)) {
      rooms.set(showtimeId, new Set());
    }
    rooms.get(showtimeId).add(socket.id);
    console.log(`Socket ${socket.id} joined room ${showtimeId}`);
  });

  socket.on(
    "update-seats-to-holding",
    async ({ selectedSeats, userId, showtimeId }) => {
      if (!showtimeId || !rooms.has(showtimeId) || showtimeId !== currentRoom)
        return;

      try {
        await SeatStatus.updateMany(
          {
            _id: { $in: selectedSeats },
            showtimeId,
            status: { $ne: "reserved" }, // Prevent updating reserved seats
          },
          { $set: { status: "holding", IdUser: userId } }
        );

        const updatedSeats = await getSeatsData(showtimeId);
        io.to(showtimeId).emit("seat-status-updated", updatedSeats);
      } catch (error) {
        console.error("Error updating seats to holding:", error);
      }
    }
  );

  socket.on("release-all-seats", async ({ userId, showtimeId }) => {
    if (!showtimeId || !rooms.has(showtimeId) || showtimeId !== currentRoom)
      return;

    try {
      await SeatStatus.updateMany(
        {
          IdUser: userId,
          status: "holding",
          showtimeId,
        },
        { $set: { status: "available", IdUser: null } }
      );

      const updatedSeats = await getSeatsData(showtimeId);
      io.to(showtimeId).emit("seat-status-updated", updatedSeats);
    } catch (error) {
      console.error("Error releasing seats:", error);
    }
  });

  socket.on("seat-select", async ({ seatId, status, userId, showtimeId }) => {
    if (!showtimeId || !rooms.has(showtimeId) || showtimeId !== currentRoom)
      return;

    try {
      const seat = await SeatStatus.findOne({ _id: seatId, showtimeId });
      if (!seat || seat.status === "reserved") return;

      const updatedSeat = await SeatStatus.findOneAndUpdate(
        {
          _id: seatId,
          showtimeId,
          status: { $ne: "reserved" },
        },
        { status, IdUser: status === "holding" ? userId : null },
        { new: true }
      );

      if (updatedSeat) {
        const updatedSeats = await getSeatsData(showtimeId);
        io.to(showtimeId).emit("seat-status-updated", updatedSeats);
      }
    } catch (error) {
      console.error("Error updating seat status:", error);
    }
  });

  socket.on("get-seats", async (showtimeId) => {
    if (!showtimeId || !rooms.has(showtimeId) || showtimeId !== currentRoom)
      return;

    try {
      const seats = await getSeatsData(showtimeId);
      socket.emit("seats-initialized", seats);
    } catch (error) {
      console.error("Error fetching initial seats:", error);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const roomClients = rooms.get(currentRoom);
      roomClients.delete(socket.id);
      if (roomClients.size === 0) {
        rooms.delete(currentRoom);
      }
      console.log(`Socket ${socket.id} left room ${currentRoom}`);
    }
  });
});
// Hàm helper để lấy dữ liệu ghế
async function getSeatsData(showtimeId) {
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
}
const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên PORT: ${PORT}`);
});
