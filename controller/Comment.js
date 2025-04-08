import Comment from "../models/CommentModel.js";
import { sendResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";
// Thêm một bình luận mới
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
// Xóa bình luận
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return sendResponse(res, 404, false, "Không tìm thấy bình luận");
    }

    return sendResponse(
      res,
      200,
      true,
      "Xóa bình luận thành công",
      deletedComment
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
