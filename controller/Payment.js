import crypto from "crypto";
import https from "https";
import { sendResponse } from "../utils/responseHandler.js";
import { frontendURL } from "../constants/constants.js";

export const paymentMomo = async (req, res) => {
  try {
    const {
      orderInfo,
      amount,
      userId,
      showtimeId,
      movieId,
      selectedSeats,
      concessions,
      payment,
    } = req.body;

    if (!orderInfo || !amount) {
      return sendResponse(
        res,
        400,
        false,
        "Missing required parameters orderInfo or amount"
      );
    }
    const extraData = Buffer.from(
      JSON.stringify({
        showtimeId,
        userId,
        selectedSeats,
        movieId,
        amount,
        concessions,
        payment,
      })
    ).toString("base64");
    // const expireTime = new Date();
    // expireTime.setMinutes(expireTime.getMinutes() + 5);
    const config = {
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      partnerCode: "MOMO",
      redirectUrl: `${frontendURL}/thankyou`,
      ipnUrl: "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b",
      requestType: "payWithMethod",
      orderGroupId: "",
      autoCapture: true,
      lang: "vi",
      extraData,
    };
    const orderId = config.partnerCode + new Date().getTime();
    const requestId = orderId;
    const rawSignature = [
      `accessKey=${config.accessKey}`,
      `amount=${amount}`,
      `extraData=${config.extraData}`,
      `ipnUrl=${config.ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${config.partnerCode}`,
      `redirectUrl=${config.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${config.requestType}`,
      // `requestExpireTime=${expireTime.getTime()}`, // Thêm requestExpireTime vào signature
    ].join("&");
    const signature = crypto
      .createHmac("sha256", config.secretKey)
      .update(rawSignature)
      .digest("hex");
    const requestBody = JSON.stringify({
      partnerCode: config.partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: config.redirectUrl,
      ipnUrl: config.ipnUrl,
      lang: config.lang,
      requestType: config.requestType,
      autoCapture: config.autoCapture,
      extraData: config.extraData,
      orderGroupId: config.orderGroupId,
      // requestExpireTime: expireTime.getTime(), // Thêm requestExpireTime vào request body

      signature,
    });
    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };
    // Send request
    const momoRequest = https.request(options, (momoRes) => {
      let responseData = "";
      momoRes.setEncoding("utf8");
      momoRes.on("data", (chunk) => {
        responseData += chunk;
      });
      momoRes.on("end", () => {
        const responseBody = JSON.parse(responseData);
        return sendResponse(
          res,
          momoRes.statusCode,
          responseBody.resultCode === 0,
          responseBody.message,
          responseBody
        );
      });
    });
    momoRequest.on("error", (error) => {
      console.error("Error in paymentMomo:", error);
      return sendResponse(res, 500, false, "Error processing payment");
    });
    momoRequest.write(requestBody);
    momoRequest.end();
  } catch (error) {
    console.error("Error in paymentMomo:", error);
    return sendResponse(res, 500, false, "Error processing payment");
  }
};
