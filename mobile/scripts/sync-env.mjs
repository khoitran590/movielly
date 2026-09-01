import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mobileRoot = path.resolve(import.meta.dirname, '..');
const explicitEnv = path.join(mobileRoot, '.env');
const generatedEnv = path.join(mobileRoot, '.env.local');
const webEnv = path.resolve(mobileRoot, '../frontend/.env');

if (fs.existsSync(explicitEnv) || !fs.existsSync(webEnv)) process.exit(0);

const values = Object.fromEntries(
  fs.readFileSync(webEnv, 'utf8').split(/\r?\n/).flatMap(line => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : [];
  }),
);
const lanAddress = Object.values(os.networkInterfaces()).flat().find(entry => entry?.family === 'IPv4' && !entry.internal)?.address;
let apiUrl = values.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
if (lanAddress) apiUrl = apiUrl.replace(/(localhost|127\.0\.0\.1)/, lanAddress);

const generated = [
  '# Generated from frontend/.env by npm run env:sync. Do not commit.',
  `EXPO_PUBLIC_API_URL=${apiUrl}`,
  `EXPO_PUBLIC_SUPABASE_URL=${values.NEXT_PUBLIC_SUPABASE_URL || ''}`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${values.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
  `EXPO_PUBLIC_SITE_URL=${values.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
  `EXPO_PUBLIC_SENTRY_DSN=${values.NEXT_PUBLIC_SENTRY_DSN || ''}`,
  '',
].join('\n');
fs.writeFileSync(generatedEnv, generated, { mode: 0o600 });
console.log(`[Movielly] Mobile environment ready${lanAddress ? ` for LAN host ${lanAddress}` : ''}.`);
