import mongoose from "mongoose";

import Rating from "../models/RatingModel.js";
import Movie from "../models/MovieModel.js";
import { sendResponse } from "../utils/responseHandler.js";

export const addNewRating = async (req, res) => {
  try {
    const { movie, user, score } = req.body;

    if (!movie || !user || score === undefined) {
      return sendResponse(
        res,
        400,
        false,
        "Thiếu thông tin cần thiết: movie, user, hoặc score"
      );
    }

    // Kiểm tra movie có tồn tại không
    const movieExists = await Movie.findById(movie);
    if (!movieExists) {
      return sendResponse(res, 404, false, "Không tìm thấy phim");
    }

    // Kiểm tra đánh giá đã tồn tại
    const existingRating = await Rating.findOne({
      movieId: movie,
      userId: user,
    });
    if (existingRating) {
      return sendResponse(res, 400, false, "Bạn đã đánh giá phim này trước đó");
    }

    // Tạo mới đánh giá
    const newRating = new Rating({
      movieId: movie,
      userId: user,
      rating: score,
    });

    await newRating.save();

    // Tính toán rating mới
    const ratings = await Rating.aggregate([
      { $match: { movieId: new mongoose.Types.ObjectId(movie) } },
      {
        $group: {
          _id: "$movieId",
          averageRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = ratings[0]?.averageRating || 0;
    const roundedRating = Math.round(averageRating * 10) / 10; // Làm tròn đến 1 chữ số thập phân

    // Cập nhật rating của phim
    const updatedMovie = await Movie.findByIdAndUpdate(
      movie,
      {
        $set: { rating: roundedRating },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedMovie) {
      throw new Error("Không thể cập nhật rating của phim");
    }

    return sendResponse(res, 200, true, "Đánh giá phim thành công", {
      rating: newRating,
      updatedMovie,
    });
  } catch (error) {
    console.error("Lỗi trong addNewRating:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};

export const checkUserRatedMovie = async (req, res) => {
  try {
    const { movie, user } = req.body; // Lấy user và movie từ body

    const rating = await Rating.findOne({ movieId: movie, userId: user });

    if (!rating) {
      return sendResponse(res, 200, false, "Người dùng chưa đánh giá phim này");
    }

    return sendResponse(
      res,
      200,
      true,
      "Người dùng đã đánh giá phim này",
      rating
    );
  } catch (error) {
    console.error("Lỗi trong checkUserRatedMovie:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getMovieRatingById = async (req, res) => {
  try {
    const { movieId } = req.params; // Lấy movieId từ URL params

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return sendResponse(res, 400, false, "ID phim không hợp lệ");
    }

    // Tìm phim theo ID
    const movie = await Movie.findById(movieId).select("title rating");

    if (!movie) {
      return sendResponse(res, 404, false, "Không tìm thấy phim");
    }
    return sendResponse(
      res,
      200,
      true,
      "Lấy thông tin điểm đánh giá của phim thành công",
      { movie }
    );
  } catch (error) {
    console.error("Lỗi trong getMovieRatingById:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
