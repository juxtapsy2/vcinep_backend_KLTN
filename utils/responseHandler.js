export const sendResponse = (res, status, success, message, data = null) => {
  const response = {
    status,
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(status).json(response);
};
