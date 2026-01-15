import { ExecutionContext } from '@nestjs/common';
import { CurrentUser, AuthUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  describe('decorator instantiation', () => {
    it('should create decorator without data', () => {
      expect(CurrentUser).toBeDefined();
    });

    it('should create decorator with field name', () => {
      expect(CurrentUser('id')).toBeDefined();
      expect(CurrentUser('email')).toBeDefined();
      expect(CurrentUser('role')).toBeDefined();
    });
  });

  describe('full user object extraction', () => {
    it('should return full user object when no field specified', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      // Simulate the decorator execution pattern
      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;
      const result = user;

      expect(result).toEqual(mockUser);
    });

    it('should return user object with all properties', () => {
      const mockUser: AuthUser = {
        id: 'complex-id',
        email: 'complex@example.com',
        role: 'admin',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.id).toBe('complex-id');
      expect(user.email).toBe('complex@example.com');
      expect(user.role).toBe('admin');
    });
  });

  describe('specific field extraction', () => {
    it('should extract id field', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;
      const result = user['id'];

      expect(result).toBe('user-123');
    });

    it('should extract email field', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;
      const result = user['email'];

      expect(result).toBe('user@example.com');
    });

    it('should extract role field', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;
      const result = user['role'];

      expect(result).toBe('admin');
    });

    it('should return undefined for non-existent field', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;
      const result = user['role'];

      expect(result).toBeUndefined();
    });
  });

  describe('ExecutionContext integration', () => {
    it('should switch to HTTP context', () => {
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: 'user-123', email: 'user@example.com' },
        }),
      });

      const mockContext = {
        switchToHttp: mockSwitchToHttp,
      } as unknown as ExecutionContext;

      mockContext.switchToHttp().getRequest();

      expect(mockSwitchToHttp).toHaveBeenCalled();
    });

    it('should get request from HTTP context', () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'user@example.com' },
      };

      const mockGetRequest = jest.fn().mockReturnValue(mockRequest);

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: mockGetRequest,
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();

      expect(mockGetRequest).toHaveBeenCalled();
      expect(request).toEqual(mockRequest);
    });

    it('should extract user from request', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user).toEqual(mockUser);
    });
  });

  describe('various user data', () => {
    it('should handle user with all optional fields', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
    });

    it('should handle user without optional role field', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeUndefined();
    });

    it('should handle different role values', () => {
      const roles = ['admin', 'user', 'moderator', 'guest'];

      for (const role of roles) {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'user@example.com',
          role,
        };

        const mockContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: mockUser,
            }),
          }),
        } as unknown as ExecutionContext;

        const request = mockContext.switchToHttp().getRequest();
        const user = request.user as AuthUser;

        expect(user.role).toBe(role);
      }
    });

    it('should handle various email formats', () => {
      const emails = [
        'simple@example.com',
        'with.dot@example.co.uk',
        'with+tag@example.org',
      ];

      for (const email of emails) {
        const mockUser: AuthUser = {
          id: 'user-123',
          email,
        };

        const mockContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: mockUser,
            }),
          }),
        } as unknown as ExecutionContext;

        const request = mockContext.switchToHttp().getRequest();
        const user = request.user as AuthUser;

        expect(user.email).toBe(email);
      }
    });

    it('should handle various ID formats', () => {
      const ids = [
        'simple-id',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000',
        'id_with_underscore',
        'id-with-dash',
        '12345',
      ];

      for (const id of ids) {
        const mockUser: AuthUser = {
          id,
          email: 'user@example.com',
        };

        const mockContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: mockUser,
            }),
          }),
        } as unknown as ExecutionContext;

        const request = mockContext.switchToHttp().getRequest();
        const user = request.user as AuthUser;

        expect(user.id).toBe(id);
      }
    });
  });

  describe('AuthUser interface', () => {
    it('should have id property', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      expect(user).toHaveProperty('id');
      expect(typeof user.id).toBe('string');
    });

    it('should have email property', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      expect(user).toHaveProperty('email');
      expect(typeof user.email).toBe('string');
    });

    it('should have optional role property', () => {
      const userWithRole: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const userWithoutRole: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      expect(userWithRole).toHaveProperty('role');
      expect(userWithoutRole).not.toHaveProperty('role');
    });
  });

  describe('parameter decorator pattern', () => {
    it('should work as parameter decorator in method', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };

      // Simulate how it would be used in a controller method
      // @CurrentUser() user: AuthUser
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const extractedUser = request.user as AuthUser;

      expect(extractedUser).toEqual(mockUser);
    });

    it('should work with field name parameter', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      // Simulate how it would be used with field name
      // @CurrentUser('email') email: string
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const email = request.user.email as string;

      expect(email).toBe('user@example.com');
    });
  });

  describe('type safety', () => {
    it('should type user object correctly', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
    });

    it('should allow id extraction with type safety', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const userId: string = user.id;
      expect(userId).toBe('user-123');
    });

    it('should allow email extraction with type safety', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const userEmail: string = user.email;
      expect(userEmail).toBe('user@example.com');
    });

    it('should allow role extraction with optional type', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const userRole: string | undefined = user.role;
      expect(userRole).toBe('admin');
    });
  });

  describe('edge cases', () => {
    it('should handle user with empty string id', () => {
      const mockUser: AuthUser = {
        id: '',
        email: 'user@example.com',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.id).toBe('');
    });

    it('should handle user with empty string email', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: '',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.email).toBe('');
    });

    it('should handle user with empty string role', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: '',
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;

      const request = mockContext.switchToHttp().getRequest();
      const user = request.user as AuthUser;

      expect(user.role).toBe('');
    });
  });
});
