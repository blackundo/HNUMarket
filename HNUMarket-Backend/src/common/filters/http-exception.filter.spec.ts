import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };

    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should catch HttpException and return formatted response', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle NotFoundException with correct status', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
        }),
      );
    });

    it('should return INTERNAL_SERVER_ERROR for unknown exceptions', () => {
      const exception = new Error('Unknown error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should extract message from exception response object', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: [] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });

    it('should handle string response from HttpException', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad request',
        }),
      );
    });

    it('should include valid ISO timestamp in response', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(new Date(callArgs.timestamp).toISOString()).toBe(
        callArgs.timestamp,
      );
    });

    it('should log error with stack trace', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should log unknown exceptions without stack', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = { message: 'Unknown' };

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        `HTTP ${HttpStatus.INTERNAL_SERVER_ERROR} - Internal server error`,
        '',
      );
      loggerSpy.mockRestore();
    });

    it('should handle exceptions with nested error objects', () => {
      const exception = new HttpException(
        {
          message: 'Nested error',
          nested: { detail: 'Some detail' },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Nested error',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it('should return default message when no message in response', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
        }),
      );
    });
  });

  describe('response format', () => {
    it('should always include statusCode, message, and timestamp', () => {
      const exception = new BadRequestException('Test');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('timestamp');
      expect(Object.keys(response).length).toBe(3);
    });

    it('should match HTTP status codes correctly', () => {
      const testCases = [
        [new BadRequestException('Bad'), HttpStatus.BAD_REQUEST],
        [new NotFoundException('Not found'), HttpStatus.NOT_FOUND],
        [
          new HttpException('Forbidden', HttpStatus.FORBIDDEN),
          HttpStatus.FORBIDDEN,
        ],
      ];

      testCases.forEach(([exception, expectedStatus]) => {
        filter.catch(exception, mockArgumentsHost);
        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });
});
