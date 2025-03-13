import express from "express";
import {
  addComment,
  updateComment,
  deleteComment,
  getCommentsByMovie,
} from "../controller/Comment.js";

const router = express.Router();

/**
 * @route POST /api/comments
 * @description Thêm một bình luận mới
 * @access Public
 */
router.post("/", addComment);

/**
 * @route PUT /api/comments/:id
 * @description Cập nhật một bình luận
 * @access Public
 */
router.put("/:id", updateComment);

/**
 * @route DELETE /api/comments/:id
 * @description Xóa một bình luận
 * @access Public
 */
router.delete("/:id", deleteComment);

/**
 * @route GET /api/comments/movie/:movieId
 * @description Lấy danh sách bình luận theo phim
 * @access Public
 */
router.get("/movie/:movieId", getCommentsByMovie);

export default router;
