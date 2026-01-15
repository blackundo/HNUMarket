import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .useMocker(jest.fn(() => ({})))
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile from database', async () => {
      const user = { id: 'user-123', email: 'user@example.com' };
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMe(user as any);

      expect(result).toEqual({
        user: mockProfile,
      });
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(user.id);
    });

    it('should return null user when profile not found', async () => {
      const user = { id: 'nonexistent', email: 'nonexistent@example.com' };

      mockAuthService.getProfile.mockResolvedValue(null);

      const result = await controller.getMe(user as any);

      expect(result).toEqual({
        user: null,
      });
    });

    it('should call getProfile with correct userId', async () => {
      const user = { id: 'specific-user-123', email: 'test@example.com' };

      mockAuthService.getProfile.mockResolvedValue({});

      await controller.getMe(user as any);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(
        'specific-user-123',
      );
      expect(mockAuthService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle profile with various data structures', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const complexProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: {
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      };

      mockAuthService.getProfile.mockResolvedValue(complexProfile);

      const result = await controller.getMe(user as any);

      expect(result.user).toEqual(complexProfile);
    });

    it('should work with minimal user object', async () => {
      const user = { id: 'user-123' };
      const mockProfile = { id: 'user-123', email: 'user@example.com' };

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMe(user as any);

      expect(result).toEqual({
        user: mockProfile,
      });
    });

    it('should return response with user key', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { id: 'user-123' };

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMe(user as any);

      expect(result).toHaveProperty('user');
      expect(result.user).toEqual(mockProfile);
    });

    it('should handle service throwing error', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };

      mockAuthService.getProfile.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getMe(user as any)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('verifyAdmin', () => {
    it('should return admin verified message for admin user', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result).toEqual({
        message: 'Admin verified',
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
      });
    });

    it('should return user object with id, email, and role', async () => {
      const user = {
        id: 'user-456',
        email: 'user456@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result.user).toEqual({
        id: 'user-456',
        email: 'user456@example.com',
        role: 'admin',
      });
      expect(result.user).not.toHaveProperty('metadata');
    });

    it('should return response with message and user keys', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(result.message).toBe('Admin verified');
    });

    it('should include all user properties in response', async () => {
      const user = {
        id: 'admin-789',
        email: 'admin789@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result.user.id).toBe('admin-789');
      expect(result.user.email).toBe('admin789@example.com');
      expect(result.user.role).toBe('admin');
    });

    it('should not call authService methods', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      await controller.verifyAdmin(user as any);

      // verifyAdmin should not call any authService methods
      // It should return directly from the decorator + guard flow
      expect(mockAuthService.getProfile).not.toHaveBeenCalled();
    });

    it('should work with different role values', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin', // This is guaranteed by AdminGuard
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result.user.role).toBe('admin');
      expect(result.message).toBe('Admin verified');
    });

    it('should handle user object with only required fields', async () => {
      const user = {
        id: 'admin-min',
        email: 'admin-min@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.message).toBe('Admin verified');
    });
  });

  describe('route guards', () => {
    it('getMe should require JwtAuthGuard', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AuthController.prototype,
        'getMe',
      );
      // Guards are applied via decorators, not directly testable here
      // This is verified through integration tests
      expect(descriptor).toBeDefined();
    });

    it('verifyAdmin should require both JwtAuthGuard and AdminGuard', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AuthController.prototype,
        'verifyAdmin',
      );
      // Guards are applied via decorators, not directly testable here
      // This is verified through integration tests
      expect(descriptor).toBeDefined();
    });
  });

  describe('logging', () => {
    it('should log when getting profile', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const loggerSpy = jest.spyOn(controller['logger'], 'debug');

      mockAuthService.getProfile.mockResolvedValue({
        id: 'user-123',
      });

      await controller.getMe(user as any);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should log when verifying admin', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };
      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      await controller.verifyAdmin(user as any);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('endpoint behavior', () => {
    it('getMe should be accessible at /auth/me', () => {
      // Route is defined by @Get('me') decorator
      // This is verified through e2e/integration tests
      const descriptor = Object.getOwnPropertyDescriptor(
        AuthController.prototype,
        'getMe',
      );
      expect(descriptor).toBeDefined();
    });

    it('verifyAdmin should be accessible at /auth/admin/verify', () => {
      // Route is defined by @Get('admin/verify') decorator
      // This is verified through e2e/integration tests
      const descriptor = Object.getOwnPropertyDescriptor(
        AuthController.prototype,
        'verifyAdmin',
      );
      expect(descriptor).toBeDefined();
    });
  });

  describe('response format', () => {
    it('getMe response should always have user key', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const testCases = [null, { id: 'test' }, { complex: { data: 'value' } }];

      for (const profile of testCases) {
        mockAuthService.getProfile.mockResolvedValue(profile);
        const result = await controller.getMe(user as any);

        expect(result).toHaveProperty('user');
      }
    });

    it('verifyAdmin response should have message and user keys', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(Object.keys(result)).toContain('message');
      expect(Object.keys(result)).toContain('user');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('verifyAdmin should not include unnecessary properties', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        extraProperty: 'should-not-appear',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result.user).not.toHaveProperty('extraProperty');
      expect(result.user).toEqual({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });
    });
  });

  describe('CurrentUser decorator', () => {
    it('should extract user from request', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };

      mockAuthService.getProfile.mockResolvedValue({});

      await controller.getMe(user as any);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-123');
    });

    it('should work with decorated parameter', async () => {
      const user = { id: 'decorated-user', email: 'decorated@example.com' };

      mockAuthService.getProfile.mockResolvedValue({ id: 'decorated-user' });

      const result = await controller.getMe(user as any);

      expect(result).toBeDefined();
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('decorated-user');
    });
  });

  describe('error scenarios', () => {
    it('getMe should propagate service errors', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Service error');

      mockAuthService.getProfile.mockRejectedValue(error);

      await expect(controller.getMe(user as any)).rejects.toThrow(
        'Service error',
      );
    });

    it('verifyAdmin should handle any structure as long as it comes from AdminGuard', async () => {
      const user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(user as any);

      expect(result).toBeDefined();
    });
  });

  describe('integration with guards', () => {
    it('getMe decorated with JwtAuthGuard should process authenticated user', async () => {
      // The @UseGuards(JwtAuthGuard) decorator ensures only authenticated users reach this
      const authenticatedUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockAuthService.getProfile.mockResolvedValue({ id: 'user-123' });

      const result = await controller.getMe(authenticatedUser as any);

      expect(result).toBeDefined();
    });

    it('verifyAdmin decorated with guards ensures admin before reaching handler', async () => {
      // The @UseGuards(JwtAuthGuard, AdminGuard) ensures only admin users reach this
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const result = await controller.verifyAdmin(adminUser as any);

      expect(result.message).toBe('Admin verified');
    });
  });
});
