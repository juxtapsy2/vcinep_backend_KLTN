import { sendResponse } from "../utils/responseHandler.js";
import Concession from "../models/ConcessionModel.js";

// Tạo mới đồ uống/thức ăn
export const createConcession = async (req, res) => {
  try {
    const { name, description, price, size, image } = req.body;

    // Kiểm tra xem tên đã tồn tại chưa
    const existingConcession = await Concession.findOne({ name: name });
    if (existingConcession) {
      return sendResponse(
        res,
        400,
        false,
        "Concession item with this name already exists"
      );
    }

    // Tạo mới
    const newConcession = await Concession.create({
      name,
      description,
      price,
      size,
      image,
    });

    return sendResponse(
      res,
      201,
      true,
      "New concession item created successfully",
      newConcession
    );
  } catch (error) {
    console.error("Error in createConcession:", error);

    if (error.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        "Concession item with this name already exists"
      );
    }

    return sendResponse(
      res,
      500,
      false,
      "Error creating concession item: " + error.message
    );
  }
};

// Lấy tất cả đồ uống/thức ăn có trạng thái active
export const getAllActiveConcessions = async (req, res) => {
  try {
    const concessions = await Concession.find({ status: "active" }).sort({
      createdAt: -1,
    }); // Sắp xếp theo thời gian tạo mới nhất

    return sendResponse(
      res,
      200,
      true,
      "Active concession items retrieved successfully",
      concessions
    );
  } catch (error) {
    console.error("Error in getAllActiveConcessions:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error retrieving concession items: " + error.message
    );
  }
};
// Xóa đồ uống/thức ăn
export const deleteConcession = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem món có tồn tại không
    const concession = await Concession.findById(id);
    if (!concession) {
      return sendResponse(res, 404, false, "Concession item not found");
    }

    // Xóa món
    await Concession.findByIdAndDelete(id);

    return sendResponse(res, 200, true, "Concession item deleted successfully");
  } catch (error) {
    console.error("Error in deleteConcession:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error deleting concession item: " + error.message
    );
  }
};
