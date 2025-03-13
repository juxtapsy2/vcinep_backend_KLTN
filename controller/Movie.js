import { sendResponse } from "../utils/responseHandler.js";
import Movie from "../models/MovieModel.js";
export const addNewMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      classification,
      duration,
      format,
      genre,
      director,
      actors,
      language,
      startDate,
      endDate,
      trailer,
      coverImage,
      rating,
      views,
      status,
    } = req.body;

    const newMovie = new Movie({
      title,
      description,
      classification,
      duration,
      genre,
      format,
      director,
      actors,
      language,
      startDate,
      endDate,
      trailer,
      coverImage,
      rating,
      views,
      status,
    });

    await newMovie.save();

    return sendResponse(
      res,
      200,
      true,
      "New movie added successfully",
      newMovie
    );
  } catch (error) {
    console.error("Error in addNewMovie:", error);
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
export const getMovieBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const movie = await Movie.findOne({ slug }).select(
      " -validTo -status -createdAt -updatedAt"
    );

    if (!movie) {
      return sendResponse(res, 404, false, "Không tìm thấy phim");
    }

    return sendResponse(res, 200, true, "Lấy thông tin phim thành công", movie);
  } catch (error) {
    console.error("Lỗi trong getMovieBySlug:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getNowShowingMovies = async (req, res) => {
  try {
    const currentDate = new Date();

    const movies = await Movie.find({
      status: "active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).select("-status -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách phim đang chiếu thành công"
        : "Không có phim đang chiếu",
      movies
    );
  } catch (error) {
    console.error("Lỗi trong getNowShowingMovies:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getComingSoonMovies = async (req, res) => {
  try {
    const currentDate = new Date();

    const movies = await Movie.find({
      status: "active",
      startDate: { $gt: currentDate },
    }).select("-status -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách phim sắp chiếu thành công"
        : "Không có phim sắp chiếu",
      movies
    );
  } catch (error) {
    console.error("Lỗi trong getComingSoonMovies:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
const buildMovieQuery = (baseQuery, title) => {
  if (title && title.trim() !== "") {
    baseQuery.title = { $regex: title.trim(), $options: "i" }; // Tìm kiếm không phân biệt hoa thường
  }
  return baseQuery;
};
const addActiveStatusFilter = (query) => {
  return { ...query, status: "active" };
};
export const getAllMoviesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 2;
    const skip = (page - 1) * limit;
    const title = req.body.title || "";

    let query = buildMovieQuery({}, title);
    query = addActiveStatusFilter(query);

    const movies = await Movie.find(query)
      .select("-status -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách tất cả các phim thành công"
        : "Không có phim nào trong hệ thống",
      {
        movies,
        totalMovies,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getAllMoviesAdmin:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getNowShowingMoviesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 2;
    const skip = (page - 1) * limit;
    const title = req.body.title || "";

    let query = buildMovieQuery(
      {
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      },
      title
    );
    query = addActiveStatusFilter(query);

    const movies = await Movie.find(query)
      .select("-status -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách các phim đang chiếu thành công"
        : "Không có phim nào đang chiếu",
      {
        movies,
        totalMovies,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getNowShowingMoviesAdmin:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getComingSoonMoviesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 2;
    const skip = (page - 1) * limit;
    const title = req.body.title || "";

    let query = buildMovieQuery({ startDate: { $gt: new Date() } }, title);
    query = addActiveStatusFilter(query);

    const movies = await Movie.find(query)
      .select("-status -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách các phim sắp chiếu thành công"
        : "Không có phim nào sắp chiếu",
      {
        movies,
        totalMovies,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getComingSoonMoviesAdmin:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getEndedMoviesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 2;
    const skip = (page - 1) * limit;
    const title = req.body.title || "";

    let query = buildMovieQuery({ endDate: { $lt: new Date() } }, title);
    query = addActiveStatusFilter(query);

    const movies = await Movie.find(query)
      .select("-status -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách các phim đã chiếu thành công"
        : "Không có phim nào đã chiếu",
      {
        movies,
        totalMovies,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getEndedMoviesAdmin:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;

    // Kiểm tra xem phim có tồn tại không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendResponse(res, 404, false, "Phim không tồn tại");
    }

    // Cập nhật status thành "inactive"
    movie.status = "inactive";
    await movie.save();

    return sendResponse(
      res,
      200,
      true,
      "Xóa phim thành công (status chuyển thành inactive)",
      movie
    );
  } catch (error) {
    console.error("Lỗi trong deleteMovie:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getTopRatedMovies = async (req, res) => {
  try {
    const currentDate = new Date();
    const topMovies = await Movie.find({
      status: "active",
      endDate: { $gte: currentDate },
    })
      .sort({ rating: -1 })
      .limit(4)
      .select("-status -createdAt -updatedAt"); // Loại bỏ các trường không cần thiết
    return sendResponse(
      res,
      200,
      true,
      topMovies.length > 0
        ? "Lấy top 4 phim có rating cao nhất thành công"
        : "Không có phim nào thỏa mãn điều kiện",
      topMovies
    );
  } catch (error) {
    console.error("Lỗi trong getTopRatedMovies:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getActiveMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ status: "active" }).select("_id title");
    return sendResponse(
      res,
      200,
      true,
      movies.length > 0
        ? "Lấy danh sách phim active thành công"
        : "Không có phim active",
      movies
    );
  } catch (error) {
    console.error("Lỗi trong việc lấy danh sách phim:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const updateMovieBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;
    // Xóa các trường không cho phép cập nhật trực tiếp
    delete updateData.slug;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    // Tìm và cập nhật phim
    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return sendResponse(res, 404, false, "Không tìm thấy phim");
    }

    // Cập nhật từng trường dữ liệu được gửi lên
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        movie[key] = updateData[key];
      }
    });

    // Lưu các thay đổi
    await movie.save();

    return sendResponse(res, 200, true, "Cập nhật phim thành công", movie);
  } catch (error) {
    console.error("Lỗi trong updateMovieBySlug:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendResponse(
        res,
        400,
        false,
        "Lỗi xác thực dữ liệu",
        validationErrors
      );
    }

    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
