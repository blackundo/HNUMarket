import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { REQUEST } from '@nestjs/core';
import * as supabaseJs from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;
  let mockRequest: any;
  let module: TestingModule;

  beforeEach(async () => {
    mockRequest = {
      headers: {
        'authorization': 'Bearer test-token',
      },
    };

    const mockClient = {
      auth: {},
      from: jest.fn(),
    };

    (supabaseJs.createClient as jest.Mock).mockReturnValue(mockClient);

    module = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'supabase.url': 'https://test.supabase.co',
                'supabase.anonKey': 'test-anon-key',
              };
              return config[key];
            }),
          },
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config values', () => {
      expect(configService.get).toHaveBeenCalledWith('supabase.url');
      expect(configService.get).toHaveBeenCalledWith('supabase.anonKey');
    });

    it('should create client with authorization header from request', () => {
      expect(supabaseJs.createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        {
          global: {
            headers: { Authorization: 'Bearer test-token' },
          },
        },
      );
    });

    it('should handle missing authorization header', async () => {
      const mockClient = { auth: {}, from: jest.fn() };
      (supabaseJs.createClient as jest.Mock).mockReturnValue(mockClient);

      const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  'supabase.url': 'https://test.supabase.co',
                  'supabase.anonKey': 'test-anon-key',
                };
                return config[key];
              }),
            },
          },
          {
            provide: REQUEST,
            useValue: { headers: {} },
          },
        ],
      }).compile();

      const serviceWithoutAuth = await moduleWithoutAuth.resolve<SupabaseService>(
        SupabaseService,
      );
      expect(serviceWithoutAuth).toBeDefined();
    });
  });

  describe('getClient', () => {
    it('should return the initialized client', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('should return the same client instance on multiple calls', () => {
      const client1 = service.getClient();
      const client2 = service.getClient();
      expect(client1).toBe(client2);
    });
  });
});
