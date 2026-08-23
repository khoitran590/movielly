// Shared Supabase client using the service-role key (server-side only).
//
// ⚠️ SECURITY: the service-role key BYPASSES Row Level Security. There is no RLS
// safety net behind queries made with this client, so every endpoint that reads
// or writes user-scoped data MUST enforce authorization in code (e.g. scope by a
// user_id derived from the verified auth token — see list.service.getSharedList,
// which filters by the token's own user_id). Never interpolate a client-supplied
// id into a query without first checking the caller is allowed to touch it.
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
