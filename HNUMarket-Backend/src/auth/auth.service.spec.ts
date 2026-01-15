import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseAdminService: SupabaseAdminService;

  const mockSupabaseAdminService = {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn(),
          }),
        }),
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseAdminService,
          useValue: mockSupabaseAdminService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseAdminService = module.get<SupabaseAdminService>(
      SupabaseAdminService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile when found', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      };

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      const userId = 'nonexistent-user';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows returned' },
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.getProfile(userId);

      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Connection failed' },
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.getProfile(userId);

      expect(result).toBeNull();
    });

    it('should query correct table and fields', async () => {
      const userId = 'user-123';

      const fromMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: userId },
              error: null,
            }),
          }),
        }),
      });

      const getClientMock = jest.fn().mockReturnValue({
        from: fromMock,
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await service.getProfile(userId);

      expect(fromMock).toHaveBeenCalledWith('profiles');
      expect(fromMock().select).toHaveBeenCalledWith('*');
      expect(fromMock().select().eq).toHaveBeenCalledWith('id', userId);
    });

    it('should handle various user IDs', async () => {
      const testUserIds = [
        'simple-id',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000',
        'user_with_underscore',
        'user-with-dash',
      ];

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'test' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      for (const userId of testUserIds) {
        const result = await service.getProfile(userId);
        expect(result).toEqual({ id: 'test' });
      }
    });

    it('should handle profile with various roles', async () => {
      const testCases = [
        { role: 'admin' },
        { role: 'moderator' },
        { role: 'user' },
        { role: 'guest' },
        { role: null },
      ];

      for (const testCase of testCases) {
        const getClientMock = jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user-123', ...testCase },
                  error: null,
                }),
              }),
            }),
          }),
        });

        jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

        const result = await service.getProfile('user-123');
        expect(result).toHaveProperty('role', testCase.role);
      }
    });

    it('should handle empty string user ID', async () => {
      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Invalid ID' },
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.getProfile('');
      expect(result).toBeNull();
    });

    it('should log errors appropriately', async () => {
      const userId = 'user-123';
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await service.getProfile(userId);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const userId = 'admin-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'user' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });

    it('should return false when profile not found', async () => {
      const userId = 'nonexistent-user';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows' },
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });

    it('should return false when role is null', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: null },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });

    it('should handle various role values', async () => {
      const testCases = [
        { role: 'admin', expected: true },
        { role: 'user', expected: false },
        { role: 'moderator', expected: false },
        { role: 'guest', expected: false },
        { role: 'ADMIN', expected: false }, // Case sensitive
      ];

      for (const testCase of testCases) {
        const getClientMock = jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: testCase,
                  error: null,
                }),
              }),
            }),
          }),
        });

        jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

        const result = await service.isAdmin('user-123');
        expect(result).toBe(testCase.expected);
      }
    });

    it('should return false when getProfile returns null', async () => {
      const userId = 'user-123';

      jest.spyOn(service, 'getProfile').mockResolvedValue(null);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });

    it('should call getProfile with correct userId', async () => {
      const userId = 'user-123';
      const getProfileSpy = jest.spyOn(service, 'getProfile');

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await service.isAdmin(userId);

      expect(getProfileSpy).toHaveBeenCalledWith(userId);
    });

    it('should handle edge case where profile has unexpected structure', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { unexpected_field: 'value' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.isAdmin(userId);

      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should retrieve profile and check admin status in sequence', async () => {
      const userId = 'admin-123';
      const mockProfile = {
        id: userId,
        email: 'admin@example.com',
        role: 'admin',
      };

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const profile = await service.getProfile(userId);
      const isAdmin = await service.isAdmin(userId);

      expect(profile).toEqual(mockProfile);
      expect(isAdmin).toBe(true);
    });

    it('should handle concurrent profile requests', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockProfiles = userIds.map((id) => ({
        id,
        email: `${id}@example.com`,
        role: 'user',
      }));

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProfiles[0],
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const results = await Promise.all(
        userIds.map((id) => service.getProfile(id)),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('error handling', () => {
    it('should handle null error object gracefully', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: userId },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      const result = await service.getProfile(userId);
      expect(result).toBeDefined();
    });

    it('should handle database timeout', async () => {
      const userId = 'user-123';

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(
                new Error('Database timeout'),
              ),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      // Service should handle the error gracefully
      await expect(service.getProfile(userId)).rejects.toThrow();
    });
  });
});
