import Comment from "../models/CommentModel.js";
import { sendResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";
// Thêm một bình luận mới
export const getComments = async (req, res) => {
  try {
    const { 
      content, 
      movieId, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10,
      isRootOnly = false // Thêm tham số mới để lựa chọn
    } = req.body;

    // Build filter object
    const filter = { 
      status: "active"
    };

    // Thêm điều kiện chỉ lấy bình luận gốc nếu được yêu cầu
    if (isRootOnly) {
      filter.parentComment = null;
    }

    // Các filter khác giữ nguyên...
    if (content) {
      filter.content = { $regex: content, $options: "i" };
    }

    if (movieId) {
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return sendResponse(res, 400, false, "ID phim không hợp lệ");
      }
      filter.movie = new mongoose.Types.ObjectId(movieId);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    // Aggregation pipeline giữ nguyên
    const comments = await Comment.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "movies",
          localField: "movie",
          foreignField: "_id",
          as: "movieData"
        }
      },
      { $unwind: "$movieData" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: "$userData" },
      {
        $project: {
          _id: 1,
          parentComment: 1, // Thêm trường này để biết bình luận có phải là reply không
          "movieData._id": 1,
          "movieData.title": 1,
          "userData.username": 1,
          "userData.avatar": 1,
          content: 1,
          createdAt: 1
        }
      }
    ]);

    const totalComments = await Comment.countDocuments(filter);

    // Format response thêm thông tin parentComment
    const formattedComments = comments.map(comment => ({
      commentId: comment._id,
      movieId: comment.movieData._id,
      movieTitle: comment.movieData.title,
      username: comment.userData.username,
      userAvatar: comment.userData.avatar,
      content: comment.content,
      createdAt: comment.createdAt,
      isRootComment: !comment.parentComment
    }));

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalComments / limit),
      totalComments: totalComments,
      commentsPerPage: parseInt(limit)
    };

    return sendResponse(res, 200, true, "Lấy danh sách bình luận thành công", {
      comments: formattedComments,
      pagination
    });
  } catch (error) {
    console.error("Lỗi trong getComments:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ");
  }
};
export const addComment = async (req, res) => {
  try {
    const { movie, user, content, parentComment } = req.body;

    if (!movie || !user || !content) {
      return sendResponse(res, 400, false, "Thiếu thông tin bắt buộc");
    }

    // Tạo object chứa dữ liệu comment
    const commentData = {
      movie,
      user,
      content,
    };

    // Chỉ thêm parentComment vào nếu nó có giá trị và hợp lệ
    if (parentComment && parentComment !== "null" && parentComment !== "") {
      try {
        // Kiểm tra xem parentComment có phải là ObjectId hợp lệ không
        if (mongoose.Types.ObjectId.isValid(parentComment)) {
          commentData.parentComment = new mongoose.Types.ObjectId(
            parentComment
          );
        }
      } catch (error) {
        console.error("Lỗi chuyển đổi parentComment:", error);
      }
    }

    const newComment = new Comment(commentData);
    await newComment.save();

    return sendResponse(
      res,
      201,
      true,
      "Thêm bình luận thành công",
      newComment
    );
  } catch (error) {
    console.error("Lỗi trong addComment:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ");
  }
};
// Sửa bình luận
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content, status },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      return sendResponse(res, 404, false, "Không tìm thấy bình luận");
    }

    return sendResponse(
      res,
      200,
      true,
      "Cập nhật bình luận thành công",
      updatedComment
    );
  } catch (error) {
    console.error("Lỗi trong updateComment:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ");
  }
};

const deleteCommentAndChildren = async (commentId) => {
  const childComments = await Comment.find({ parentComment: commentId });

  for (const child of childComments) {
    await deleteCommentAndChildren(child._id);
  }
  await Comment.findByIdAndDelete(commentId);
};

// API xóa bình luận
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const commentExists = await Comment.findById(id);
    if (!commentExists) {
      return sendResponse(res, 404, false, "Không tìm thấy bình luận");
    }

    await deleteCommentAndChildren(id);
    return sendResponse(
      res,
      200,
      true,
      "Xóa bình luận và các bình luận con thành công"
    );
  } catch (error) {
    console.error("Lỗi trong deleteComment:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ");
  }
};
export const getCommentsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return sendResponse(res, 400, false, "Thiếu ID phim");
    }

    const comments = await Comment.find({ movie: movieId, status: "active" })
      .populate("user", "name email avatar username") // Lấy thêm thông tin người dùng
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất

    if (!comments || comments.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không có bình luận nào cho phim này"
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Lấy danh sách bình luận thành công",
      comments
    );
  } catch (error) {
    console.error("Lỗi trong getCommentsByMovie:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ");
  }
};
