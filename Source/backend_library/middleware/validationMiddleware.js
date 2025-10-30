const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');

// Gộp chuỗi validation và xử lý kết quả trong một helper
const validate = (rules = []) => {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formatted = errors
          .array()
          .map(e => ({ field: e.path, message: e.msg }));

        // Sử dụng response API chuẩn hóa với status 400 để phù hợp với các test hiện có
        return ApiResponse.badRequest(res, 'Xác thực thất bại', formatted);
      }
      next();
    }
  ];
};

module.exports = { validate };
