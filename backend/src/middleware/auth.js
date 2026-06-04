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

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

module.exports = { requireAuth, supabase };
