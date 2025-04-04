import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db.js";
import { getSeatsData } from "./utils/getSeatsData.js";
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
import geminiRoute from "./routes/gemini.js";
import blogRouter from "./routes/blog.js";
import quickTicketRouter from "./routes/quickticket.js";
import statisticalRouter from "./routes/statistical.js";
import { Server } from "socket.io";
import SeatStatus from "./models/SeatStatusModel.js";
import { createServer } from "node:http";
// import { getSeatsData } from "./utils/getSeatsData.js";
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
app.use("/api/gemini", geminiRoute);
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
const unreadMessages = new Map();

io.on("connection", (socket) => {
  console.log("A user connected to chat:", socket.id);

  socket.on("join-chat", (chatRoom) => {
    socket.join(chatRoom);
    socket.currentRoom = chatRoom;

    if (!rooms.has(chatRoom)) {
      rooms.set(chatRoom, []);
    }
    // Gửi danh sách phòng (chỉ cho nhân viên)
    io.emit("room-list", Array.from(rooms.keys()));
    // Cập nhật tin nhắn khi chuyển giữa các phòng
    socket.emit("loadMessages", rooms.get(chatRoom) || []);
    // Khi nhân viên vào phòng, reset số tin chưa đọc
    if (unreadMessages.has(chatRoom)) {
      unreadMessages.set(chatRoom, 0);
      io.emit("unread-messages", Object.fromEntries(unreadMessages));
    }
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

    // Cập nhật số lượng tin nhắn chưa đọc
    if (!unreadMessages.has(room)) {
      unreadMessages.set(room, 0);
    }
    unreadMessages.set(room, unreadMessages.get(room) + 1);
    // Gửi tin chưa đọc cho nhân viên
    io.emit("unread-messages", Object.fromEntries(unreadMessages));

    // Nếu là tin nhắn đầu tiên, reply tự động
    if (rooms.get(room).length === 1 && message.sender !== "Employee") {
      setTimeout(() => {
        const autoReply = {
          text: "Xin chào, VCineP có thể giúp gì cho bạn?",
          sender: "Employee",
          room: room,
          timestamp: Date.now(),
        };
        rooms.get(room).push(autoReply);
        io.to(room).emit("receiveMessage", autoReply);
      }, 1000); // Gửi sau 1 giây
    }
    io.to(room).emit("receiveMessage", chatMessage);
    // Cập nhật danh sách phòng trong trường hợp tin nhắn đến từ 1 người dùng mới
    io.emit("room-list", Array.from(rooms.keys()));
    // [For test only!!]
    // Đọc nội dung tin nhắn trong console.log (highlighted)
    console.log(
      `\x1b[36mRoom ${socket.currentRoom}\x1b[0m - \x1b[33m${
        message.sender ? message.sender : "Guest"
      }\x1b[0m said: \x1b[32m${message.text}\x1b[0m`
    );
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected from chat.`);
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

const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên PORT: ${PORT}`);
});
