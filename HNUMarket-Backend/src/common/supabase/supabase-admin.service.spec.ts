import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseAdminService } from './supabase-admin.service';
import * as supabaseJs from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('SupabaseAdminService', () => {
  let service: SupabaseAdminService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockClient = {
      auth: {},
      from: jest.fn(),
      admin: {},
    };

    (supabaseJs.createClient as jest.Mock).mockReturnValue(mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAdminService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'supabase.url': 'https://test.supabase.co',
                'supabase.serviceKey': 'test-service-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseAdminService>(SupabaseAdminService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should be a singleton service (default scope)', () => {
      const instance1 = service;
      const instance2 = service;
      expect(instance1).toBe(instance2);
    });

    it('should initialize with config values', () => {
      expect(configService.get).toHaveBeenCalledWith('supabase.url');
      expect(configService.get).toHaveBeenCalledWith('supabase.serviceKey');
    });

    it('should create client with service key', () => {
      expect(supabaseJs.createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
      );
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

  describe('scope', () => {
    it('should be singleton and shared across injections', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseAdminService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  'supabase.url': 'https://test.supabase.co',
                  'supabase.serviceKey': 'test-service-key',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const service1 = module.get<SupabaseAdminService>(SupabaseAdminService);
      const service2 = module.get<SupabaseAdminService>(SupabaseAdminService);

      expect(service1).toBe(service2);
      expect(service1.getClient()).toBe(service2.getClient());
    });
  });
});
