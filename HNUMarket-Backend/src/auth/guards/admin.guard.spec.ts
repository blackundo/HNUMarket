import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { SupabaseAdminService } from '../../common/supabase/supabase-admin.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
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
        AdminGuard,
        {
          provide: SupabaseAdminService,
          useValue: mockSupabaseAdminService,
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    supabaseAdminService = module.get<SupabaseAdminService>(
      SupabaseAdminService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow admin user to proceed', async () => {
      const mockRequest: any = {
        user: { id: 'admin-user-123', email: 'admin@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user.role).toBe('admin');
    });

    it('should deny non-admin user', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'user@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user not authenticated', async () => {
      const mockRequest = {
        user: null,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should throw ForbiddenException when user has no id', async () => {
      const mockRequest = {
        user: { email: 'no-id@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should handle database error', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Error verifying admin access',
      );
    });

    it('should attach role to user object when admin', async () => {
      const mockRequest: any = {
        user: { id: 'admin-123', email: 'admin@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      await guard.canActivate(mockContext);

      expect(mockRequest.user).toEqual({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should throw error message when profile role is not admin', async () => {
      const mockRequest = {
        user: { id: 'moderator-123', email: 'mod@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'moderator' },
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Admin access required',
      );
    });

    it('should query correct table and fields', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const fromMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const getClientMock = jest.fn().mockReturnValue({
        from: fromMock,
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await guard.canActivate(mockContext);

      expect(fromMock).toHaveBeenCalledWith('profiles');
      expect(fromMock().select).toHaveBeenCalledWith('role');
      expect(fromMock().select().eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should handle multiple admin checks', async () => {
      const mockRequest1 = {
        user: { id: 'admin-1', email: 'admin1@example.com' },
      };

      const mockRequest2 = {
        user: { id: 'user-1', email: 'user@example.com' },
      };

      const mockContext1 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest1),
        }),
      } as unknown as ExecutionContext;

      const mockContext2 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest2),
        }),
      } as unknown as ExecutionContext;

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn(),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      // Mock for first call
      getClientMock().from().select().eq().single = jest
        .fn()
        .mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { role: 'user' },
          error: null,
        });

      // Both should execute
      await expect(
        Promise.all([
          guard.canActivate(mockContext1),
          guard.canActivate(mockContext2),
        ]),
      ).rejects.toThrow();
    });
  });

  describe('logging', () => {
    it('should log when admin access granted', async () => {
      const mockRequest = {
        user: { id: 'admin-123', email: 'admin@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const loggerSpy = jest.spyOn(guard['logger'], 'debug');

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

      await guard.canActivate(mockContext);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should log when access denied', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'user@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const loggerSpy = jest.spyOn(guard['logger'], 'warn');

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

      try {
        await guard.canActivate(mockContext);
      } catch (e) {
        // Expected to throw
      }

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle user with only id property', async () => {
      const mockRequest = {
        user: { id: 'user-id-only' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle profile with null role', async () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

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

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Admin access required',
      );
    });

    it('should handle profile not found', async () => {
      const mockRequest = {
        user: { id: 'nonexistent-user', email: 'test@example.com' },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const getClientMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      jest.spyOn(supabaseAdminService, 'getClient').mockReturnValue(getClientMock() as any);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Admin access required',
      );
    });
  });
});
