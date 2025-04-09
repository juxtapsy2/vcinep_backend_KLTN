import express from "express";
import {
  addNewBlog,
  getBlogBySlug,
  updateBlogBySlug,
  deleteBlogBySlug,
  getAllBlogs,
  incrementBlogView,
} from "../controller/Blog.js";
const router = express.Router();
/**
 * @route POST /api/blogs
 * @description Thêm blog mới
 * @access Public
 */
router.post("/", addNewBlog);
/**
 * @route GET /api/blogs/:slug
 * @description Lấy blog chi tiết bằng slug
 * @access Public
 */
router.get("/:slug", getBlogBySlug);
/**
 * @route PUT /api/blogs/:slug
 * @description Cập nhật blog theo slug
 * @access Public
 */
router.patch("/:slug", updateBlogBySlug);
/**
 * @route DELETE /api/blogs/:slug
 * @description Xóa blog theo slug
 * @access Public
 */
router.delete("/:slug", deleteBlogBySlug);
/**
 * @route GET /api/blogs
 * @description Lấy tất cả blogs
 * @access Public
 */
router.post("/all", getAllBlogs);
router.put("/:slug/increment-view", incrementBlogView);
export default router;
