import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Schema-typed client: table/column names and insert/update payloads are
// checked against src/types/database.ts at compile time.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
