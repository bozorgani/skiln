const sendResponse = (res, { statusCode = 200, success = true, message, data }) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};

module.exports = sendResponse;

