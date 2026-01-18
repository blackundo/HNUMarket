import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const jwksUri = url ? `${url}/auth/v1/keys` : undefined;

  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
        'Please ensure SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY are set in .env file.',
    );
  }

  return {
    url,
    anonKey,
    serviceKey,
    jwtSecret,
    jwksUri,
  };
});
