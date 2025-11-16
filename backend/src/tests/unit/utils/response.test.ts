import {
  successResponse,
  errorResponse,
  paginatedResponse,
  createSuccessResponse,
  createErrorResponse
} from '../../../utils/response';

describe('Response Utils', () => {
  let mockRes: any;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('successResponse', () => {
    it('应该返回成功响应', () => {
      const data = { message: 'Success' };
      const message = '操作成功';

      successResponse(mockRes, data, message);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: '操作成功',
        data: { message: 'Success' },
        timestamp: expect.any(String)
      });
    });

    it('应该使用默认消息和状态码', () => {
      const data = { result: 'ok' };

      successResponse(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: '操作成功',
        data: { result: 'ok' },
        timestamp: expect.any(String)
      });
    });

    it('应该接受自定义状态码', () => {
      const data = { id: 1 };
      const message = 'Created';

      successResponse(mockRes, data, message, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 201,
        message: 'Created',
        data: { id: 1 },
        timestamp: expect.any(String)
      });
    });
  });

  describe('errorResponse', () => {
    it('应该返回错误响应', () => {
      const message = 'Something went wrong';
      const statusCode = 400;

      errorResponse(mockRes, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 400,
        message: 'Something went wrong',
        data: undefined,
        timestamp: expect.any(String)
      });
    });

    it('应该使用默认状态码和消息', () => {
      errorResponse(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 500,
        message: '操作失败',
        data: undefined,
        timestamp: expect.any(String)
      });
    });

    it('应该包含错误详情', () => {
      const error = { field: 'email', issue: 'invalid format' };

      errorResponse(mockRes, 'Validation error', 400, error);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 400,
        message: 'Validation error',
        data: { field: 'email', issue: 'invalid format' },
        timestamp: expect.any(String)
      });
    });
  });

  describe('paginatedResponse', () => {
    it('应该返回分页响应', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };

      paginatedResponse(mockRes, items, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: '获取数据成功',
        data: {
          items,
          pagination
        },
        timestamp: expect.any(String)
      });
    });

    it('应该接受自定义消息和状态码', () => {
      const items = [];
      const pagination = {
        page: 2,
        pageSize: 5,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: true
      };
      const message = 'Custom message';

      paginatedResponse(mockRes, items, pagination, message, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 201,
        message: 'Custom message',
        data: {
          items: [],
          pagination
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('应该创建成功响应对象', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Custom success';

      const response = createSuccessResponse(data, message);

      expect(response).toEqual({
        success: true,
        code: 200,
        message: 'Custom success',
        data: { id: 1, name: 'Test' },
        timestamp: expect.any(String)
      });
    });

    it('应该使用默认值', () => {
      const response = createSuccessResponse();

      expect(response).toEqual({
        success: true,
        code: 200,
        message: '操作成功',
        data: undefined,
        timestamp: expect.any(String)
      });
    });

    it('应该接受自定义状态码', () => {
      const data = { created: true };
      const response = createSuccessResponse(data, 'Created', 201);

      expect(response.code).toBe(201);
      expect(response.message).toBe('Created');
      expect(response.data).toBe(data);
    });
  });

  describe('createErrorResponse', () => {
    it('应该创建错误响应对象', () => {
      const message = 'Custom error';
      const statusCode = 400;
      const error = { details: 'Validation failed' };

      const response = createErrorResponse(message, statusCode, error);

      expect(response).toEqual({
        success: false,
        code: 400,
        message: 'Custom error',
        data: { details: 'Validation failed' },
        timestamp: expect.any(String)
      });
    });

    it('应该使用默认值', () => {
      const response = createErrorResponse();

      expect(response).toEqual({
        success: false,
        code: 500,
        message: '操作失败',
        data: undefined,
        timestamp: expect.any(String)
      });
    });

    it('应该只接受消息参数', () => {
      const response = createErrorResponse('Server error');

      expect(response).toEqual({
        success: false,
        code: 500,
        message: 'Server error',
        data: undefined,
        timestamp: expect.any(String)
      });
    });
  });

  describe('时间戳验证', () => {
    it('所有响应都应该包含有效的时间戳', () => {
      const data = { test: true };

      successResponse(mockRes, data);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );

      errorResponse(mockRes, 'Test error');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );

      const successObj = createSuccessResponse(data);
      expect(successObj.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const errorObj = createErrorResponse('Test error');
      expect(errorObj.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});