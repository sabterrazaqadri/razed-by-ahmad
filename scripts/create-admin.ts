// Creates (or resets) the single shop-admin login.
//
//   1. Put SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
//   2. npm run create-admin
//
// The service role key is used ONLY here, on your machine. The website itself
// never reads it.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function main() {
  if (!url || !anon) fail("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local");
  if (!service) fail("SUPABASE_SERVICE_ROLE_KEY missing — copy it from Supabase → Project Settings → API");
  if (!email || !password) fail("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  if (password.length < 10) fail("Use an admin password of at least 10 characters");

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
    console.log(`✓ Created ${email}`);
  } else {
    // Already exists → reset the password instead.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) fail(`Could not list users: ${error.message}`);
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) fail(`Could not create ${email}: ${created.error?.message}`);
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (error) fail(`Could not reset password: ${error.message}`);
    console.log(`✓ ${email} already existed — password reset`);
  }

  const { error: listErr } = await admin.from("admin_users").upsert({ user_id: userId });
  if (listErr) fail(`Could not mark as admin: ${listErr.message}`);
  console.log("✓ Added to admin_users");

  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) fail(`Sign-in check failed: ${signInErr.message}`);
  const { data: isAdmin } = await client.rpc("is_admin");
  if (!isAdmin) fail("Signed in, but is_admin() returned false");
  console.log("✓ Sign-in verified — open /admin/login");
}

main();
