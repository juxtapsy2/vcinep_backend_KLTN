import { sendResponse } from "../utils/responseHandler.js";
import Cinema from "../models/CinemaModel.js";
import Theater from "../models/TheaterModel.js";
import Showtime from "../models/ShowtimeModel.js";
export const getShowtimesByCinemaId = async (req, res) => {
  try {
    const { cinemaId } = req.params;

    // Kiểm tra cinema có tồn tại và active
    const cinema = await Cinema.findOne({
      _id: cinemaId,
      status: "active",
    });

    if (!cinema) {
      return sendResponse(res, 404, false, "Không tìm thấy rạp hoạt động");
    }

    // Lấy danh sách theater của cinema
    const theaters = await Theater.find({
      cinemaId: cinema._id,
      status: "active",
    });

    if (!theaters.length) {
      return sendResponse(res, 404, false, "Rạp này chưa có phòng chiếu nào");
    }

    // Lấy các suất chiếu và thông tin phim
    const theaterIds = theaters.map((theater) => theater._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const showtimes = await Showtime.find({
      theaterId: { $in: theaterIds },
      status: "active",
      showDate: { $gte: today },
    })
      .populate(
        "movieId",
        "title slug genre duration format language startDate endDate coverImage rating description"
      )
      .populate("theaterId", "name type capacity")
      .sort({ showDate: 1, showTime: 1 });

    // Nhóm suất chiếu theo ngày
    const groupedShowtimes = {};
    showtimes.forEach((showtime) => {
      // Chuyển đổi showDate thành chuỗi ngày YYYY-MM-DD
      const date = new Date(showtime.showDate).toISOString().split("T")[0];

      if (!groupedShowtimes[date]) {
        groupedShowtimes[date] = [];
      }

      const showtimeObj = showtime.toObject();
      // Format lại ngày tháng để tránh lỗi
      showtimeObj.showDate = date;

      groupedShowtimes[date].push(showtimeObj);
    });

    return sendResponse(res, 200, true, "Lấy thông tin suất chiếu thành công", {
      cinema: {
        name: cinema.name,
        address: cinema.address,
      },
      showtimes: groupedShowtimes,
    });
  } catch (error) {
    console.error("Lỗi trong getShowtimesByCinemaId:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const addNewCinema = async (req, res) => {
  try {
    const {
      name,
      address,
      phoneNumber,
      email,
      screenCount,
      ticketPrices,
      pricingPolicy,
      mapLocation,
      coverImage,
      status,
    } = req.body;

    const newCinema = new Cinema({
      name,
      address,
      phoneNumber,
      email,
      screenCount,
      ticketPrices,
      pricingPolicy,
      coverImage,
      mapLocation,
      status,
    });

    await newCinema.save();

    return sendResponse(
      res,
      200,
      true,
      "New cinema added successfully",
      newCinema
    );
  } catch (error) {
    console.error("Error in addNewCinema:", error);
    return sendResponse(res, 500, false, "Error adding new cinema");
  }
};
export const getAllCinemas = async (req, res) => {
  try {
    // Lấy các tham số phân trang từ request body (hoặc dùng mặc định)
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10; // Số lượng rạp mặc định mỗi trang
    const skip = (page - 1) * limit;
    // Tùy chọn lọc nếu có thêm thông tin tìm kiếm
    const name = req.body.name || "";
    // Xây dựng query
    let query = { status: "active" }; // Chỉ lấy rạp có status là "active"
    if (name) query.name = { $regex: name, $options: "i" }; // Tìm kiếm tên rạp không phân biệt hoa thường

    // Lấy danh sách rạp với phân trang
    const cinemas = await Cinema.find(query)
      .select("-createdAt -updatedAt") // Loại bỏ các trường không cần thiết
      .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo ngày tạo
      .skip(skip)
      .limit(limit);

    // Đếm tổng số rạp phù hợp với query
    const totalCinemas = await Cinema.countDocuments(query);
    const totalPages = Math.ceil(totalCinemas / limit);

    // Trả về phản hồi
    return sendResponse(
      res,
      200,
      true,
      cinemas.length > 0
        ? "Lấy danh sách tất cả các rạp thành công"
        : "Không có rạp nào trong hệ thống",
      {
        cinemas,
        totalCinemas,
        totalPages,
        currentPage: page,
        limit,
      }
    );
  } catch (error) {
    console.error("Lỗi trong getAllCinemas:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getCinemaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cinema = await Cinema.findOne({ slug, status: "active" }).select(
      "-__v -createdAt -updatedAt"
    );
    if (!cinema) {
      return sendResponse(res, 404, false, "Không tìm thấy rạp");
    }
    return sendResponse(res, 200, true, "Lấy thông tin rạp thành công", cinema);
  } catch (error) {
    console.error("Lỗi trong getCinemaBySlug:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getActiveCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find({ status: "active" }).select("_id name");
    return sendResponse(
      res,
      200,
      true,
      cinemas.length > 0
        ? "Lấy danh sách rạp chiếu phim active thành công"
        : "Không có rạp active",
      cinemas
    );
  } catch (error) {
    console.error("Lỗi trong việc lấy danh sách rạp chiếu phim:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getAllCinemasCustom = async (req, res) => {
  try {
    const cinemas = await Cinema.find({ status: "active" }, "_id name");
    if (cinemas.length === 0) {
      return sendResponse(res, 404, false, "Không có rạp nào được tìm thấy");
    }
    return sendResponse(
      res,
      200,
      true,
      "Danh sách các rạp đang hoạt động được lấy thành công",
      cinemas
    );
  } catch (error) {
    console.error("Lỗi trong getAllActiveCinemas:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getCinemaById = async (req, res) => {
  try {
    const { id } = req.params;
    // Tìm cinema theo id và điều kiện status là "active"
    const cinema = await Cinema.findOne({ _id: id, status: "active" }).select(
      "-createdAt -updatedAt"
    );
    if (!cinema) {
      return sendResponse(
        res,
        404,
        false,
        "Cinema không tồn tại hoặc không hoạt động"
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Lấy thông tin cinema thành công",
      cinema
    );
  } catch (error) {
    console.error("Lỗi trong getCinemaById:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const getCinemaSlugById = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm rạp theo ID
    const cinema = await Cinema.findById(id).select("slug");

    if (!cinema) {
      return sendResponse(res, 404, false, "Rạp không tồn tại");
    }

    return sendResponse(res, 200, true, "Lấy slug thành công", {
      slug: cinema.slug,
    });
  } catch (error) {
    console.error("Error in getCinemaSlugById:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const updateCinema = async (req, res) => {
  try {
    const { id } = req.params; // ID của cinema cần cập nhật
    const updateData = req.body; // Dữ liệu cần cập nhật

    // Kiểm tra nếu không có thông tin cần cập nhật
    if (Object.keys(updateData).length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không có thông tin nào được gửi để cập nhật"
      );
    }

    // Cập nhật cinema
    const updatedCinema = await Cinema.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // `new` để trả về document sau khi cập nhật, `runValidators` để đảm bảo dữ liệu hợp lệ
    );

    // Kiểm tra nếu cinema không tồn tại
    if (!updatedCinema) {
      return sendResponse(res, 404, false, "Không tìm thấy cinema với ID này");
    }

    return sendResponse(
      res,
      200,
      true,
      "Cập nhật thông tin cinema thành công",
      updatedCinema
    );
  } catch (error) {
    console.error("Lỗi trong updateCinema:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};
export const deleteCinema = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm cinema theo ID
    const cinema = await Cinema.findById(id);
    if (!cinema) {
      return sendResponse(res, 404, false, "Không tìm thấy rạp");
    }

    // Kiểm tra nếu cinema đã bị inactive trước đó
    if (cinema.status === "inactive") {
      return sendResponse(res, 400, false, "Rạp đã bị vô hiệu hóa trước đó");
    }

    // Chuyển status thành "inactive"
    cinema.status = "inactive";
    await cinema.save();

    return sendResponse(
      res,
      200,
      true,
      "Xóa rạp thành công (đã chuyển sang trạng thái inactive)",
      cinema
    );
  } catch (error) {
    console.error("Lỗi trong deleteCinema:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};

export const getAllCinemaSlugs = async (req, res) => {
  try {
    const cinemas = await Cinema.find().select("id slug");
    return sendResponse(res, 200, true, "Lấy danh sách slug rạp thành công", { cinemas });
  } catch (error) {
    console.error("Error in getAllCinemaSlugs:", error);
    return sendResponse(res, 500, false, "Lỗi máy chủ nội bộ");
  }
};