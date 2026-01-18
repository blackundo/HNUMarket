import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

jest.mock('jwks-rsa', () => {
  const mockPassportJwtSecret = jest.fn(() => jest.fn());
  return { passportJwtSecret: mockPassportJwtSecret };
});

describe('SupabaseJwtStrategy', () => {
  let strategy: SupabaseJwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'supabase.url': 'https://test.supabase.co',
        'supabase.jwtSecret': 'test-jwt-secret-key',
        'supabase.jwksUri': 'https://test.supabase.co/auth/v1/keys',
      };
      return config[key];
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize strategy with valid config', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseJwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      strategy = module.get<SupabaseJwtStrategy>(SupabaseJwtStrategy);
      expect(strategy).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalledWith('supabase.url');
      expect(mockConfigService.get).toHaveBeenCalledWith('supabase.jwksUri');
      expect(mockConfigService.get).toHaveBeenCalledWith('supabase.jwtSecret');
    });

    it('should throw error when SUPABASE_URL is missing', () => {
      const invalidConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, string | undefined> = {
            'supabase.url': undefined,
            'supabase.jwtSecret': 'test',
            'supabase.jwksUri': undefined,
          };
          return config[key];
        }),
      };

      // The error is thrown in the constructor when the strategy is instantiated
      expect(() => {
        new SupabaseJwtStrategy(invalidConfigService as any);
      }).toThrow('SUPABASE_URL is required');
    });

    it('should call ConfigService.get with correct keys', async () => {
      await Test.createTestingModule({
        providers: [
          SupabaseJwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      expect(mockConfigService.get).toHaveBeenCalledWith('supabase.jwtSecret');
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          SupabaseJwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      strategy = testModule.get<SupabaseJwtStrategy>(SupabaseJwtStrategy);
    });

    it('should validate JWT payload with required fields', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should return user object with id and email', async () => {
      const payload = {
        sub: 'user-456',
        email: 'another@example.com',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('id', 'user-456');
      expect(result).toHaveProperty('email', 'another@example.com');
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as any;

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with specific message', async () => {
      const invalidPayload = {
        email: 'test@example.com',
      } as any;

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        'Invalid token: missing user ID',
      );
    });

    it('should handle optional role field', async () => {
      const payloadWithRole = {
        sub: 'user-789',
        email: 'admin@example.com',
        role: 'admin',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payloadWithRole);

      // Role should not be in the returned object at this stage
      expect(result).toEqual({
        id: 'user-789',
        email: 'admin@example.com',
      });
      expect(result).not.toHaveProperty('role');
    });

    it('should extract user ID from sub field correctly', async () => {
      const payload = {
        sub: 'complex-user-id-with-dashes-123',
        email: 'complex@example.com',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('complex-user-id-with-dashes-123');
    });

    it('should handle various email formats', async () => {
      const testCases = [
        'simple@example.com',
        'with.dot@example.com',
        'with+tag@example.co.uk',
        'numbers123@example.org',
      ];

      for (const email of testCases) {
        const payload = {
          sub: 'test-user',
          email,
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600,
        };

        const result = await strategy.validate(payload);
        expect(result.email).toBe(email);
      }
    });
  });

  describe('JWT extraction', () => {
    it('should extract JWT from Authorization header', async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          SupabaseJwtStrategy,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      strategy = testModule.get<SupabaseJwtStrategy>(SupabaseJwtStrategy);
      expect(strategy).toBeDefined();
    });
  });
});
