import Blog from "../models/BlogModel.js";
import { sendResponse } from "../utils/responseHandler.js";

// Thêm một blog mới
export const addNewBlog = async (req, res) => {
  try {
    const { title, content, coverImage, status } = req.body;

    const newBlog = new Blog({
      title,
      content,
      coverImage,
      status,
    });
    await newBlog.save();
    return sendResponse(res, 200, true, "Blog created successfully", newBlog);
  } catch (error) {
    console.error("Error in addNewBlog:", error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return sendResponse(
        res,
        400,
        false,
        "Slug already exists, please choose a different title"
      );
    }
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(
        res,
        400,
        false,
        "Validation error",
        validationErrors
      );
    }

    return sendResponse(res, 500, false, "Internal server error");
  }
};
// Lấy blog chi tiết bằng slug
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return sendResponse(res, 404, false, "Blog not found");
    }
    return sendResponse(res, 200, true, "Fetched blog successfully", blog);
  } catch (error) {
    console.error("Error in getBlogBySlug:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
// Cập nhật blog
export const updateBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const updates = req.body;

    const updatedBlog = await Blog.findOneAndUpdate({ slug }, updates, {
      new: true,
    });

    if (!updatedBlog) {
      return sendResponse(res, 404, false, "Blog not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Blog updated successfully",
      updatedBlog
    );
  } catch (error) {
    console.error("Error in updateBlogBySlug:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
// Xóa blog
export const deleteBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const deletedBlog = await Blog.findOneAndDelete({ slug });

    if (!deletedBlog) {
      return sendResponse(res, 404, false, "Blog not found");
    }
    return sendResponse(
      res,
      200,
      true,
      "Blog deleted successfully",
      deletedBlog
    );
  } catch (error) {
    console.error("Error in deleteBlogBySlug:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
// Lấy tất cả blogs
export const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTitle = req.body.title || "";

    // Tạo query filter nếu có tìm kiếm theo tiêu đề
    let query = {};
    if (searchTitle) {
      query.title = { $regex: searchTitle, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);
    return sendResponse(
      res,
      200,
      true,
      blogs.length > 0
        ? "Lấy danh sách tất cả các blog thành công"
        : "Không có blog nào trong hệ thống",
      {
        blogs,
        totalBlogs,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getAllBlogs:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
