const ApiResponse = require('../../utils/ApiResponse');

describe('ApiResponse Utility Tests', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      ApiResponse.success(mockRes, data, 'Success message');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Success message',
          data,
          timestamp: expect.any(String)
        })
      );
    });

    it('should use custom status code', () => {
      ApiResponse.success(mockRes, null, 'Custom', 202);
      expect(mockRes.status).toHaveBeenCalledWith(202);
    });
  });

  describe('created', () => {
    it('should return 201 status', () => {
      const data = { id: 1 };
      ApiResponse.created(mockRes, data, 'Resource created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resource created',
          data
        })
      );
    });
  });

  describe('error', () => {
    it('should return error response', () => {
      ApiResponse.error(mockRes, 'Error message', 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error message',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('badRequest', () => {
    it('should return 400 status', () => {
      ApiResponse.badRequest(mockRes, 'Bad request');
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('unauthorized', () => {
    it('should return 401 status', () => {
      ApiResponse.unauthorized(mockRes, 'Unauthorized');
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forbidden', () => {
    it('should return 403 status', () => {
      ApiResponse.forbidden(mockRes, 'Forbidden');
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('notFound', () => {
    it('should return 404 status', () => {
      ApiResponse.notFound(mockRes, 'Not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('paginated', () => {
    it('should return paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 20,
        totalPages: 2
      };

      ApiResponse.paginated(mockRes, data, pagination, 'Success');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Success',
          data,
          pagination: expect.objectContaining(pagination)
        })
      );
    });
  });
});
