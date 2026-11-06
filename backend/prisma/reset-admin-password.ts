// Utility to reset an admin's password in Supabase Auth.
// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='NewPass123!' npx ts-node prisma/reset-admin-password.ts
// (Never commit real passwords — pass them via environment variables.)
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@nehacrockery.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Set ADMIN_PASSWORD in the environment');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const user = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) throw new Error(`No Supabase Auth user with email ${email}`);

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;

  console.log(`✅  Password updated in Supabase Auth for ${email}`);
}

main().catch((e) => {
  console.error('❌  Failed:', e);
  process.exit(1);
});
