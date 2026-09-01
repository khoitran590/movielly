import { createMovieApi } from '@movielly/core';

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
};

export const movieApi = createMovieApi({ baseUrl: env.apiUrl });
export const hasBackendConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
