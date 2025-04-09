import mongoose from "mongoose";
import Price from "../models/PriceModel.js";
import { sendResponse } from "../utils/responseHandler.js";
// Lấy giá vé hiện tại
export const getCurrentPrice = async (req, res) => {
  try {
    const currentPrice = await Price.findOne({ isActive: true });
    if (!currentPrice) {
      return sendResponse(
        res,
        404,
        false,
        "No active price configuration found"
      );
    }
    return sendResponse(
      res,
      200,
      true,
      "Price retrieved successfully",
      currentPrice
    );
  } catch (error) {
    console.error("Error in getCurrentPrice:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error retrieving price: " + error.message
    );
  }
};
// Thêm cấu hình giá mới
export const addNewPrice = async (req, res) => {
  try {
    const { type1Price, type2Price, type3Price, type4Price, vipRegularDiff } =
      req.body;

    // Kiểm tra dữ liệu đầu vào
    if (
      !type1Price ||
      !type2Price ||
      !type3Price ||
      !type4Price ||
      !vipRegularDiff
    ) {
      return sendResponse(res, 400, false, "All price fields are required");
    }
    // Tạo cấu hình giá mới
    const newPrice = await Price.create({
      type1Price,
      type2Price,
      type3Price,
      type4Price,
      vipRegularDiff,
      isActive: true,
    });
    return sendResponse(
      res,
      201,
      true,
      "New price configuration added successfully",
      newPrice
    );
  } catch (error) {
    console.error("Error in addNewPrice:", error);
    if (error.name === "ValidationError") {
      return sendResponse(
        res,
        400,
        false,
        "Validation Error: " + error.message
      );
    }
    return sendResponse(
      res,
      500,
      false,
      "Error adding new price: " + error.message
    );
  }
};

// Cập nhật giá
export const updatePrice = async (req, res) => {
  try {
    const { type1Price, type2Price, type3Price, type4Price, vipRegularDiff } =
      req.body;
    const { id } = req.params;

    const updatedPrice = await Price.findByIdAndUpdate(
      id,
      {
        type1Price,
        type2Price,
        type3Price,
        type4Price,
        vipRegularDiff,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPrice) {
      return sendResponse(res, 404, false, "Price configuration not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Price updated successfully",
      updatedPrice
    );
  } catch (error) {
    console.error("Error in updatePrice:", error);
    if (error.name === "ValidationError") {
      return sendResponse(
        res,
        400,
        false,
        "Validation Error: " + error.message
      );
    }
    return sendResponse(
      res,
      500,
      false,
      "Error updating price: " + error.message
    );
  }
};

// Xóa cấu hình giá
export const deletePrice = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPrice = await Price.findByIdAndDelete(id);

    if (!deletedPrice) {
      return sendResponse(res, 404, false, "Price configuration not found");
    }

    // Nếu xóa cấu hình đang active, active cấu hình gần nhất
    if (deletedPrice.isActive) {
      const latestPrice = await Price.findOne().sort({ createdAt: -1 });
      if (latestPrice) {
        latestPrice.isActive = true;
        await latestPrice.save();
      }
    }

    return sendResponse(
      res,
      200,
      true,
      "Price configuration deleted successfully"
    );
  } catch (error) {
    console.error("Error in deletePrice:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error deleting price: " + error.message
    );
  }
};

// Lấy lịch sử giá
export const getPriceHistory = async (req, res) => {
  try {
    const prices = await Price.find().sort({ createdAt: -1 });
    return sendResponse(
      res,
      200,
      true,
      "Price history retrieved successfully",
      prices
    );
  } catch (error) {
    console.error("Error in getPriceHistory:", error);
    return sendResponse(
      res,
      500,
      false,
      "Error retrieving price history: " + error.message
    );
  }
};
