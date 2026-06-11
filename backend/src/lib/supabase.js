// Shared Supabase client using the service-role key (server-side only).
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n[Movielly] Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env\n');
  process.exit(1);
}
if (!/^https?:\/\//i.test(SUPABASE_URL)) {
  console.error(`\n[Movielly] SUPABASE_URL must start with https:// — got "${SUPABASE_URL}"\n`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = { supabase };
