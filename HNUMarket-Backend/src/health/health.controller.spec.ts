import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

describe('HealthController', () => {
  let controller: HealthController;
  let supabaseAdminService: SupabaseAdminService;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: SupabaseAdminService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockClient),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    supabaseAdminService = module.get<SupabaseAdminService>(
      SupabaseAdminService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should return health status with healthy status', async () => {
      const result = await controller.check();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database', 'connected');
    });

    it('should return valid ISO timestamp', async () => {
      const result = await controller.check();

      expect(result.timestamp).toBeDefined();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should query settings table to verify connection', async () => {
      await controller.check();

      expect(supabaseAdminService.getClient).toHaveBeenCalled();
      expect(mockClient.from).toHaveBeenCalledWith('settings');
      expect(mockClient.from('settings').select).toHaveBeenCalledWith('count');
    });

    it('should throw HttpException when database connection fails', async () => {
      mockClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Connection failed',
                code: 'CONNECTION_ERROR',
              },
            }),
          }),
        }),
      });

      await expect(controller.check()).rejects.toThrow(HttpException);
      await expect(controller.check()).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('should handle supabase error gracefully', async () => {
      mockClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Authentication failed',
                code: '401',
              },
            }),
          }),
        }),
      });

      await expect(controller.check()).rejects.toThrow(HttpException);
    });

    it('should return connected when supabase responds successfully', async () => {
      mockClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await controller.check();

      expect(result.database).toBe('connected');
      expect(result.status).toBe('healthy');
    });

    it('should ignore PGRST116 error (no rows)', async () => {
      mockClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'No rows found',
                code: 'PGRST116',
              },
            }),
          }),
        }),
      });

      const result = await controller.check();

      expect(result.database).toBe('connected');
      expect(result.status).toBe('healthy');
    });
  });

  describe('module integration', () => {
    it('should inject SupabaseAdminService correctly', () => {
      expect(supabaseAdminService).toBeDefined();
      expect(supabaseAdminService.getClient).toBeDefined();
    });

    it('should return consistent response structure', async () => {
      const result = await controller.check();

      expect(Object.keys(result).sort()).toEqual(
        ['status', 'database', 'timestamp'].sort(),
      );
    });
  });
});
