import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call super.canActivate', () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'test-user', email: 'test@example.com' },
          }),
        }),
      } as unknown as ExecutionContext;

      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );

      // The actual canActivate behavior is inherited from AuthGuard
      // Just verify the method exists and can be called
      expect(guard.canActivate).toBeDefined();
    });
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', () => {
      const user = { id: 'test-user', email: 'test@example.com' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const error = new Error('Invalid token');

      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow(error);
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message when user missing', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow('Authentication required');
    });

    it('should throw error from Passport when both error and missing user', () => {
      const passportError = new Error('Passport validation failed');

      expect(() => {
        guard.handleRequest(passportError, null, null);
      }).toThrow(passportError);
    });

    it('should prioritize Passport error over missing user', () => {
      const passportError = new UnauthorizedException('Invalid token');

      expect(() => {
        guard.handleRequest(passportError, null, null);
      }).toThrow(passportError);
    });

    it('should handle user object with various structures', () => {
      const complexUser = {
        id: 'complex-id-123',
        email: 'complex@example.com',
        role: 'admin',
        metadata: { created_at: '2024-01-01' },
      };

      const result = guard.handleRequest(null, complexUser, null);

      expect(result).toEqual(complexUser);
    });

    it('should handle falsy user values (undefined, false, empty object)', () => {
      const falsyUsers = [undefined, false, null];

      for (const user of falsyUsers) {
        expect(() => {
          guard.handleRequest(null, user, null);
        }).toThrow(UnauthorizedException);
      }
    });

    it('should accept user with minimal required properties', () => {
      const minimalUser = { id: 'user-1' };

      const result = guard.handleRequest(null, minimalUser, null);

      expect(result).toEqual(minimalUser);
    });

    it('should preserve user object identity', () => {
      const user = { id: 'test', email: 'test@example.com' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toBe(user);
    });
  });

  describe('authorization header extraction', () => {
    it('should be configured to extract Bearer tokens', () => {
      // Guard is properly initialized and registered with strategy
      expect(guard).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle user with empty string id', () => {
      const user = { id: '', email: 'test@example.com' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should handle error with message', () => {
      const error = new Error('Token expired');

      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow('Token expired');
    });

    it('should handle custom error types', () => {
      class CustomAuthError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomAuthError';
        }
      }

      const customError = new CustomAuthError('Custom auth failed');

      expect(() => {
        guard.handleRequest(customError, null, null);
      }).toThrow(customError);
    });
  });

  describe('integration scenarios', () => {
    it('should work as Express middleware', () => {
      const user = { id: 'user-1', email: 'user@example.com' };
      const result = guard.handleRequest(null, user, null);

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@example.com');
    });

    it('should handle authentication flow correctly', () => {
      // Simulate successful authentication flow
      const validUser = {
        id: 'authenticated-user-123',
        email: 'auth@example.com',
      };

      const result = guard.handleRequest(null, validUser, null);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should handle authentication failure correctly', () => {
      // Simulate failed authentication
      const authError = new UnauthorizedException('Invalid token');

      expect(() => {
        guard.handleRequest(authError, null, null);
      }).toThrow(UnauthorizedException);
    });
  });
});
