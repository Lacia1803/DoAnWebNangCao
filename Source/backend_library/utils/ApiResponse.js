/**
 * Wrapper response API chuẩn hóa
 * Đảm bảo định dạng response nhất quán trên tất cả endpoints
 */

class ApiResponse {
  /**
   * Response thành công
   * @param {Object} res - Đối tượng response của Express
   * @param {*} data - Dữ liệu response
   * @param {String} message - Thông điệp thành công
   * @param {Number} statusCode - Mã trạng thái HTTP (mặc định: 200)
   */
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Response tạo mới (201)
   * @param {Object} res - Đối tượng response của Express
   * @param {*} data - Dữ liệu tài nguyên đã tạo
   * @param {String} message - Thông điệp thành công
   */
  static created(res, data, message = 'Tạo tài nguyên thành công') {
    return this.success(res, data, message, 201);
  }

  /**
   * Response lỗi
   * @param {Object} res - Đối tượng response của Express
   * @param {String} message - Thông điệp lỗi
   * @param {Number} statusCode - Mã trạng thái HTTP (mặc định: 500)
   * @param {*} errors - Chi tiết lỗi bổ sung
   */
  static error(res, message = 'Đã xảy ra lỗi', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Response yêu cầu không hợp lệ (400)
   */
  static badRequest(res, message = 'Yêu cầu không hợp lệ', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Response không được phép (401)
   */
  static unauthorized(res, message = 'Truy cập không được phép') {
    return this.error(res, message, 401);
  }

  /**
   * Response bị cấm (403)
   */
  static forbidden(res, message = 'Truy cập bị cấm') {
    return this.error(res, message, 403);
  }

  /**
   * Response không tìm thấy (404)
   */
  static notFound(res, message = 'Không tìm thấy tài nguyên') {
    return this.error(res, message, 404);
  }

  /**
   * Response lỗi xác thực (422)
   */
  static validationError(res, errors, message = 'Xác thực thất bại') {
    return this.error(res, message, 422, errors);
  }

  /**
   * Response lỗi máy chủ nội bộ (500)
   */
  static serverError(res, message = 'Lỗi máy chủ nội bộ', error = null) {
    return this.error(res, message, 500, error);
  }

  /**
   * Response có phân trang
   * @param {Object} res - Đối tượng response của Express
   * @param {Array} data - Mảng các items
   * @param {Object} pagination - Metadata phân trang
   */
  static paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage || 1,
        itemsPerPage: pagination.itemsPerPage || 10,
        totalItems: pagination.totalItems || 0,
        totalPages: pagination.totalPages || 0
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;
